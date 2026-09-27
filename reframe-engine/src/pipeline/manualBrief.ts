/*
 * Importers/callers: This file will be imported by AIRouter to use Manual brief for analysis.
 * Affected API: ManualBrief class with analyze() method.
 * Data schemas: AnalysisBrief { title, summary, tags, viralityScore, recommendedClips }.
 * Verbatim instruction: Continue building out reframe-engine; add Manual brief handler per Stage 1C spec.
 */
import type { AnalysisBrief } from './aiRouter';

export interface ManualBriefInput {
  title?: string;
  summary?: string;
  tags?: string[];
  viralityScore?: number;
  recommendedClips?: Array<{ startSec: number; endSec: number; reason: string }>;
}

export class ManualBrief {
  private defaultInput: ManualBriefInput;

  constructor(defaultInput: ManualBriefInput = {}) {
    this.defaultInput = defaultInput;
  }

  /**
   * Analyze media metadata using manual/provided brief.
   * This returns the pre-configured manual brief or generates a basic one from metadata.
   * @param metadata Media metadata including duration, transcript, detected speakers, etc.
   * @param input Optional manual input to override defaults
   * @returns Analysis brief with virality scoring and clip recommendations
   */
  async analyze(metadata: Record<string, any>, input?: ManualBriefInput): Promise<AnalysisBrief> {
    const mergedInput = { ...this.defaultInput, ...input };

    // If manual input is provided, use it directly
    if (mergedInput.title && mergedInput.summary) {
      return this.validateAnalysisBrief(mergedInput);
    }

    // Otherwise generate a basic brief from metadata
    return this.generateFromMetadata(metadata, mergedInput);
  }

  /**
   * Generate a basic analysis brief from metadata.
   * @param metadata Media metadata
   * @param input Partial manual input
   * @returns AnalysisBrief
   */
  private generateFromMetadata(metadata: Record<string, any>, input: ManualBriefInput): AnalysisBrief {
    const duration = metadata.duration || 60;
    const clipLength = Math.min(30, duration * 0.5);
    const startSec = Math.max(0, (duration - clipLength) / 2);

    const hasTranscript = metadata.transcript && metadata.transcript.length > 0;
    const hasSpeakers = metadata.speakers && metadata.speakers.length > 0;
    const hasFaceDetections = metadata.faceDetections && metadata.faceDetections.length > 0;
    const sceneCutsCount = metadata.sceneCuts ? metadata.sceneCuts.length : 0;

    // Calculate a basic virality score based on available signals
    let viralityScore = 0.3; // base score
    if (hasTranscript) viralityScore += 0.15;
    if (hasSpeakers) viralityScore += 0.15;
    if (hasFaceDetections) viralityScore += 0.1;
    if (sceneCutsCount > 3) viralityScore += 0.1;
    if (duration >= 30 && duration <= 120) viralityScore += 0.1;
    viralityScore = Math.min(0.8, viralityScore);

    return this.validateAnalysisBrief({
      title: input.title || 'Manual Analysis',
      summary: input.summary || `Video is ${duration}s long. ${hasTranscript ? 'Has transcript.' : 'No transcript.'} ${hasSpeakers ? `${metadata.speakers.length} speaker(s) detected.` : 'No speakers detected.'} ${sceneCutsCount} scene cuts.`,
      tags: input.tags || ['manual', 'analysis'],
      viralityScore: input.viralityScore ?? viralityScore,
      recommendedClips: input.recommendedClips || [
        {
          startSec,
          endSec: startSec + clipLength,
          reason: 'Center portion - manual selection',
        },
      ],
    });
  }

  /**
   * Validate and normalize AnalysisBrief structure.
   * @param data Manual input data
   * @returns Validated AnalysisBrief
   */
  private validateAnalysisBrief(data: ManualBriefInput): AnalysisBrief {
    return {
      title: data.title || 'Untitled Analysis',
      summary: data.summary || 'No summary provided',
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 10) : [],
      viralityScore: typeof data.viralityScore === 'number'
        ? Math.max(0, Math.min(1, data.viralityScore))
        : 0.5,
      recommendedClips: Array.isArray(data.recommendedClips)
        ? data.recommendedClips
            .filter((clip) =>
              typeof clip.startSec === 'number' &&
              typeof clip.endSec === 'number' &&
              clip.endSec > clip.startSec
            )
            .slice(0, 5)
            .map((clip) => ({
              startSec: clip.startSec,
              endSec: clip.endSec,
              reason: clip.reason || 'Recommended clip',
            }))
        : [],
    };
  }

  /**
   * Set default manual brief input.
   * @param input Default input to use
   */
  setDefaultInput(input: ManualBriefInput): void {
    this.defaultInput = input;
  }

  /**
   * Get current default manual brief input.
   * @returns Current default input
   */
  getDefaultInput(): ManualBriefInput {
    return { ...this.defaultInput };
  }
}