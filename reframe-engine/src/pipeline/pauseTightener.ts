/*
 * Importers/callers: This file will be imported by the pipeline index to handle pause tightening.
 * Affected API: PauseTightener class with tightenPauses() method.
 * Data schemas: TightenedClip { originalStart, originalEnd, tightenedStart, tightenedEnd, removedSilenceSec }.
 * Verbatim instruction: Continue building out reframe-engine; add pauseTightener per Stage 2 spec.
 */

export interface TightenedClip {
  originalStart: number;
  originalEnd: number;
  tightenedStart: number;
  tightenedEnd: number;
  removedSilenceSec: number;
}

export class PauseTightener {
  private silenceThreshold: number;
  private minPauseDuration: number;

  constructor(silenceThreshold: number = 0.3, minPauseDuration: number = 0.5) {
    this.silenceThreshold = silenceThreshold;
    this.minPauseDuration = minPauseDuration;
  }

  /**
   * Tighten pauses in a clip by removing silence segments.
   * @param originalStart Original clip start time (seconds)
   * @param originalEnd Original clip end time (seconds)
   * @param audioLevels Audio levels with peaks and silence info
   * @returns TightenedClip with adjusted timing
   */
  tightenPauses(
    originalStart: number,
    originalEnd: number,
    audioLevels: { average: number; peaks: number[]; silenceRatio: number; silenceSegments?: Array<{ start: number; end: number }> }
  ): TightenedClip {
    const originalDuration = originalEnd - originalStart;

    // If no silence segments provided, estimate from silence ratio
    const silenceSegments = audioLevels.silenceSegments || this.estimateSilenceSegments(
      originalStart,
      originalEnd,
      audioLevels.silenceRatio
    );

    // Filter out silence segments shorter than minimum pause duration
    const significantSilence = silenceSegments.filter(
      segment => segment.end - segment.start >= this.minPauseDuration
    );

    // Calculate total silence to remove
    const removedSilenceSec = significantSilence.reduce(
      (sum, segment) => sum + (segment.end - segment.start), 0
    );

    // Adjust timing - keep original start, shorten end
    const tightenedEnd = originalEnd - removedSilenceSec;

    return {
      originalStart,
      originalEnd,
      tightenedStart: originalStart,
      tightenedEnd: Math.max(tightenedEnd, originalStart),
      removedSilenceSec
    };
  }

  /**
   * Estimate silence segments from silence ratio.
   * @param start Start time
   * @param end End time
   * @param silenceRatio Ratio of silence in clip
   * @returns Estimated silence segments
   */
  private estimateSilenceSegments(
    start: number,
    end: number,
    silenceRatio: number
  ): Array<{ start: number; end: number }> {
    const duration = end - start;
    const totalSilence = duration * silenceRatio;

    // Distribute silence into estimated segments
    const segmentCount = Math.max(1, Math.floor(duration / 5)); // One segment per ~5 seconds
    const segmentDuration = totalSilence / segmentCount;

    const segments: Array<{ start: number; end: number }> = [];
    for (let i = 0; i < segmentCount; i++) {
      const segmentStart = start + (i / segmentCount) * duration + Math.random() * (duration / segmentCount - segmentDuration);
      segments.push({
        start: segmentStart,
        end: segmentStart + segmentDuration
      });
    }

    return segments;
  }

  /**
   * Tighten multiple clips.
   * @param clips Array of clips with original timing and audio levels
   * @returns Array of tightened clips
   */
  tightenClips(
    clips: Array<{
      startSec: number;
      endSec: number;
      audioLevels: { average: number; peaks: number[]; silenceRatio: number; silenceSegments?: Array<{ start: number; end: number }> }
    }>
  ): TightenedClip[] {
    return clips.map(clip =>
      this.tightenPauses(clip.startSec, clip.endSec, clip.audioLevels)
    );
  }

  /**
   * Get the silence threshold.
   * @returns Silence threshold value
   */
  getSilenceThreshold(): number {
    return this.silenceThreshold;
  }

  /**
   * Set the silence threshold.
   * @param threshold New silence threshold
   */
  setSilenceThreshold(threshold: number): void {
    this.silenceThreshold = threshold;
  }

  /**
   * Get the minimum pause duration.
   * @returns Minimum pause duration
   */
  getMinPauseDuration(): number {
    return this.minPauseDuration;
  }

  /**
   * Set the minimum pause duration.
   * @param duration New minimum pause duration
   */
  setMinPauseDuration(duration: number): void {
    this.minPauseDuration = duration;
  }
}