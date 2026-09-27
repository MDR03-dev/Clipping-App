/*
 * Importers/callers: This file will be imported by AIRouter to use Codex CLI for analysis.
 * Affected API: CodexCLI class with analyze() method.
 * Data schemas: AnalysisBrief { title, summary, tags, viralityScore, recommendedClips }.
 * Verbatim instruction: Continue building out reframe-engine; add Codex CLI adapter per Stage 1C spec.
 */
import { spawn } from 'node:child_process';
import type { AnalysisBrief } from './aiRouter';

export type CodexExecutor = (prompt: string) => Promise<string>;

export class CodexCLI {
  private timeout: number;
  private executor?: CodexExecutor;

  constructor(timeout: number = 60000, executor?: CodexExecutor) {
    this.timeout = timeout;
    this.executor = executor;
  }

  /**
   * Analyze media metadata using Codex CLI.
   * @param metadata Media metadata including duration, transcript, detected speakers, etc.
   * @returns Analysis brief with virality scoring and clip recommendations
   */
  async analyze(metadata: Record<string, any>): Promise<AnalysisBrief> {
    const prompt = this.buildPrompt(metadata);

    try {
      const result = await this.runCodex(prompt);
      return this.parseResponse(result);
    } catch (error) {
      // Fallback to a basic analysis if Codex fails
      console.warn('Codex CLI analysis failed, using fallback:', error);
      return this.getFallbackAnalysis(metadata);
    }
  }

  /**
   * Build the prompt for Codex CLI based on metadata.
   * @param metadata Media metadata
   * @returns Formatted prompt string
   */
  private buildPrompt(metadata: Record<string, any>): string {
    const {
      duration,
      transcript,
      speakers,
      sceneCuts,
      faceDetections,
      audioLevels,
    } = metadata;

    return `Analyze this video content and provide a structured analysis brief for short-form clip selection.

Video Metadata:
- Duration: ${duration || 'unknown'} seconds
- Transcript: ${transcript || 'not available'}
- Detected speakers: ${JSON.stringify(speakers || [])}
- Scene cuts: ${JSON.stringify(sceneCuts || [])}
- Face detections: ${faceDetections ? faceDetections.length : 0} faces detected
- Audio levels: ${JSON.stringify(audioLevels || {})}

Provide a JSON response with exactly this structure:
{
  "title": "Compelling title for the content",
  "summary": "2-3 sentence summary of the content",
  "tags": ["tag1", "tag2", "tag3"],
  "viralityScore": 0.0-1.0,
  "recommendedClips": [
    { "startSec": 10, "endSec": 25, "reason": "Why this clip is engaging" }
  ]
}

Focus on:
1. Virality potential (hooks, emotional moments, surprises)
2. Clear narrative arcs
3. Visual engagement (face presence, scene changes)
4. Audio quality and speech clarity
5. Platform-appropriate clip lengths (15-60 seconds for TikTok/Reels/Shorts)`;
  }

  /**
   * Run Codex CLI with the given prompt.
   * @param prompt The prompt to send to Codex
   * @returns Codex CLI output
   */
  private async runCodex(prompt: string): Promise<string> {
    // Use custom executor if provided (for testing)
    if (this.executor) {
      return this.executor(prompt);
    }

    // Default: spawn actual Codex CLI
    return new Promise((resolve, reject) => {
      const codexProcess = spawn('codex', ['exec', prompt], {
        timeout: this.timeout,
      });

      let stdout = '';
      let stderr = '';

      codexProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      codexProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      codexProcess.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Codex CLI exited with code ${code}: ${stderr}`));
        }
      });

      codexProcess.on('error', (error) => {
        reject(new Error(`Failed to spawn Codex CLI: ${error.message}`));
      });
    });
  }

  /**
   * Parse Codex CLI response into AnalysisBrief.
   * @param response Raw response from Codex
   * @returns Parsed AnalysisBrief
   */
  private parseResponse(response: string): AnalysisBrief {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAnalysisBrief(parsed);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      throw new Error(`Failed to parse Codex response: ${error}`);
    }
  }

  /**
   * Validate and normalize AnalysisBrief structure.
   * @param data Parsed data from Codex
   * @returns Validated AnalysisBrief
   */
  private validateAnalysisBrief(data: any): AnalysisBrief {
    return {
      title: data.title || 'Untitled Analysis',
      summary: data.summary || 'No summary provided',
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 10) : [],
      viralityScore: typeof data.viralityScore === 'number'
        ? Math.max(0, Math.min(1, data.viralityScore))
        : 0.5,
      recommendedClips: Array.isArray(data.recommendedClips)
        ? data.recommendedClips
            .filter((clip: any) =>
              typeof clip.startSec === 'number' &&
              typeof clip.endSec === 'number' &&
              clip.endSec > clip.startSec
            )
            .slice(0, 5)
            .map((clip: any) => ({
              startSec: clip.startSec,
              endSec: clip.endSec,
              reason: clip.reason || 'Recommended clip',
            }))
        : [],
    };
  }

  /**
   * Get fallback analysis when Codex is unavailable.
   * @param metadata Media metadata
   * @returns Basic AnalysisBrief
   */
  private getFallbackAnalysis(metadata: Record<string, any>): AnalysisBrief {
    const duration = metadata.duration || 60;
    const clipLength = Math.min(30, duration * 0.5);
    const startSec = Math.max(0, (duration - clipLength) / 2);

    return {
      title: 'Content Analysis (Fallback)',
      summary: 'Automated analysis unavailable. Using duration-based clip selection.',
      tags: ['auto-generated', 'fallback'],
      viralityScore: 0.3,
      recommendedClips: [
        {
          startSec,
          endSec: startSec + clipLength,
          reason: 'Center portion of video - fallback selection',
        },
      ],
    };
  }
}