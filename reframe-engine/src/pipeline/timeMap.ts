/*
 * Importers/callers: This file will be imported by the pipeline index and STT router to handle time transformations.
 * Affected API: TimeMap class with createForwardMapping() and createReverseMapping() methods.
 * Data schemas: TimeMapping { startSec, endSec, durationSec }.
 * Verbatim instruction: Continue building out reframe-engine; add TimeMap per Stage 2 spec.
 */

export interface TimeMapping {
  startSec: number;
  endSec: number;
  durationSec: number;
}

export class TimeMap {
  /**
   * Create a forward time mapping (source time -> output time).
   * @param sourceStart Start time in source media (seconds)
   * @param sourceEnd End time in source media (seconds)
   * @param outputDuration Desired duration in output (seconds) - not used, preserves source duration
   * @returns TimeMapping object preserving source timing
   */
  createForwardMapping(sourceStart: number, sourceEnd: number, outputDuration: number): TimeMapping {
    return {
      startSec: sourceStart,
      endSec: sourceEnd,
      durationSec: Math.max(0, sourceEnd - sourceStart)
    };
  }

  /**
   * Create a reverse time mapping (output time -> source time).
   * @param outputStart Start time in output media (seconds)
   * @param outputEnd End time in output media (seconds)
   * @param sourceDuration Duration of source media (seconds) - not used, preserves output duration
   * @returns TimeMapping object preserving output timing
   */
  createReverseMapping(outputStart: number, outputEnd: number, sourceDuration: number): TimeMapping {
    return {
      startSec: outputStart,
      endSec: outputEnd,
      durationSec: Math.max(0, outputEnd - outputStart)
    };
  }
}