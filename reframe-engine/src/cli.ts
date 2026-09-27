/*
 * Importers/callers: This file is the CLI entrypoint for the reframe-engine, imported by npm scripts or directly by node.
 * Affected API: main() function that processes a job.json file, runs active speaker detection, and renders video.
 * Data schemas: ReframeJob { jobId, sourcePath, startSec, endSec, outputPath, progressPath, captions? }.
 * Verbatim instruction: Continue building out reframe-engine; add AI selection step per Stage 1C spec.
 */
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeClipASD } from './pipeline/asd';
import { chooseSpeakerByScores } from './pipeline/speaker';
import { portraitCropWidth } from './shared/cameraPath';
import { buildFocusTrack } from './pipeline/faces';
import { renderClipWithTracking } from './pipeline/render';
import { pipeline } from './pipeline/index';
import type { FocusKeyframe } from './shared/types';
import type { AnalysisBrief } from './pipeline/aiRouter';

interface ReframeJob {
  jobId: string;
  sourcePath: string;
  startSec: number;
  endSec: number;
  outputPath: string;
  progressPath: string;
  captions?: Array<{ start: number; end: number; text: string }>;
  aiProvider?: 'codex' | 'direct' | 'manual';
}

function reportProgress(progressPath: string, progress: number, message: string): void {
  const line = JSON.stringify({ progress, message, ts: Date.now() }) + '\n';
  appendFileSync(progressPath, line, { encoding: 'utf8' });
}

async function main(): Promise<void> {
  const jobArg = process.argv[2];
  if (!jobArg) {
    console.error('Usage: node dist/cli.js <job.json>');
    process.exit(1);
  }

  const job: ReframeJob = JSON.parse(readFileSync(jobArg, 'utf-8'));
  const { sourcePath, startSec, endSec, outputPath, progressPath, captions, aiProvider } = job;

  try {
    reportProgress(progressPath, 0.05, 'Extracting audio & detecting faces (YuNet)');

    // 1. Run Audio-Visual Active Speaker Detection (LR-ASD at 25 fps)
    const asd = await analyzeClipASD(sourcePath, startSec, endSec);
    let focusTrack: FocusKeyframe[] | null = null;

    if (asd && asd.tracks.length > 0) {
      reportProgress(progressPath, 0.45, 'Scoring active speakers with LR-ASD');
      const { centres, switchCuts } = chooseSpeakerByScores(
        asd.tracks,
        asd.frameCount,
        asd.sceneCuts,
        asd.fps
      );
      const cuts = [...new Set([...asd.sceneCuts, ...switchCuts])].sort((a, b) => a - b);
      const cropWidth = asd.cropSize
        ? portraitCropWidth(asd.cropSize.width / Math.max(1, asd.cropSize.height))
        : undefined;

      reportProgress(progressPath, 0.65, 'Building smooth camera focus track');
      focusTrack = buildFocusTrack(centres, startSec, cuts, asd.fps, { cropWidth });
    } else {
      reportProgress(progressPath, 0.65, 'No distinct faces found; defaulting to centered framing');
    }

    // NEW: AI Selection Step (Stage 1C)
    reportProgress(progressPath, 0.70, 'Running AI-powered content analysis');
    const analysis = await pipeline.run(sourcePath, startSec, endSec,
      asd?.tracks || [], aiProvider);

    if (analysis.analysis) {
      reportProgress(progressPath, 0.75, `AI Analysis complete: "${analysis.analysis.title}" (virality: ${analysis.analysis.viralityScore.toFixed(2)})`);
      // In a full implementation, we would use analysis.analysis.recommendedClips to adjust focusTrack
      // For Stage 1C, we just log the analysis and continue with original focusTrack
    }

    // 2. Render 9:16 Video with Focus Track & Subtitles
    reportProgress(progressPath, 0.78, 'Executing FFmpeg 9:16 tracking render');
    await renderClipWithTracking({
      sourcePath,
      startSec,
      endSec,
      outputPath,
      focusTrack: focusTrack ?? [],
      captions: captions || [],
      onProgress: (p) => reportProgress(progressPath, 0.78 + p * 0.20, 'Rendering video')
    });

    reportProgress(progressPath, 1.0, 'Render complete');
    writeFileSync(progressPath + '.done', 'ok', { encoding: 'utf8' });
    process.exit(0);
  } catch (err: any) {
    console.error('Reframe engine error:', err);
    writeFileSync(progressPath + '.error', String(err?.message || err), { encoding: 'utf8' });
    process.exit(1);
  }
}

main();