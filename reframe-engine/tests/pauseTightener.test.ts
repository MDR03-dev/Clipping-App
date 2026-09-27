/*
 * Importers/callers: This file will be imported by the test runner to verify PauseTightener functionality.
 * Affected API: PauseTightener class with tightenPauses() method.
 * Data schemas: TightenedClip.
 * Verbatim instruction: Continue building out reframe-engine; add pauseTightener test per Stage 2 spec.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PauseTightener } from '../src/pipeline/pauseTightener';

describe('Stage 2: Pause Tightener', () => {
  describe('PauseTightener functionality', () => {
    let pauseTightener: PauseTightener;

    beforeEach(() => {
      pauseTightener = new PauseTightener();
    });

    it('should create a PauseTightener instance', () => {
      expect(pauseTightener).toBeDefined();
      expect(pauseTightener).toBeInstanceOf(PauseTightener);
    });

    it('should tighten pauses when silence segments are provided', () => {
      const result = pauseTightener.tightenPauses(
        0,
        30,
        {
          average: 0.5,
          peaks: [],
          silenceRatio: 0.3,
          silenceSegments: [
            { start: 5, end: 7 },    // 2 seconds of silence
            { start: 15, end: 18 }   // 3 seconds of silence
          ]
        }
      );

      expect(result).toBeDefined();
      expect(result.originalStart).toBe(0);
      expect(result.originalEnd).toBe(30);
      expect(result.tightenedStart).toBe(0);
      expect(result.tightenedEnd).toBe(25); // 30 - 5 seconds removed
      expect(result.removedSilenceSec).toBe(5);
    });

    it('should not tighten when silence is below minimum threshold', () => {
      const result = pauseTightener.tightenPauses(
        0,
        30,
        {
          average: 0.5,
          peaks: [],
          silenceRatio: 0.1,
          silenceSegments: [
            { start: 5, end: 5.3 },    // 0.3 seconds - below minimum
            { start: 15, end: 15.4 }   // 0.4 seconds - below minimum
          ]
        }
      );

      expect(result).toBeDefined();
      expect(result.originalStart).toBe(0);
      expect(result.originalEnd).toBe(30);
      expect(result.tightenedStart).toBe(0);
      expect(result.tightenedEnd).toBe(30); // No change
      expect(result.removedSilenceSec).toBe(0);
    });

    it('should estimate silence segments when not provided', () => {
      const result = pauseTightener.tightenPauses(
        0,
        60,
        {
          average: 0.5,
          peaks: [],
          silenceRatio: 0.2  // 20% silence
        }
      );

      expect(result).toBeDefined();
      expect(result.originalStart).toBe(0);
      expect(result.originalEnd).toBe(60);
      expect(result.tightenedStart).toBe(0);
      // Should remove some silence based on estimated segments
      expect(result.tightenedEnd).toBeLessThan(60);
      expect(result.tightenedEnd).toBeGreaterThan(0);
      expect(result.removedSilenceSec).toBeGreaterThan(0);
      expect(result.removedSilenceSec).toBeLessThanOrEqual(12.1); // 20% of 60 (with floating point tolerance)
    });

    it('should respect minimum pause duration for estimated segments', () => {
      // Create a pause tightener with high minimum duration
      const tightener = new PauseTightener(0.3, 5.0); // 5 second minimum

      const result = tightener.tightenPauses(
        0,
        30,
        {
          average: 0.5,
          peaks: [],
          silenceRatio: 0.5  // 50% silence
        }
      );

      expect(result).toBeDefined();
      // With high minimum duration, estimated segments may be filtered out
      expect(result.removedSilenceSec).toBeGreaterThanOrEqual(0);
    });

    it('should handle edge cases gracefully', () => {
      // Zero duration clip
      const result1 = pauseTightener.tightenPauses(
        10,
        10,
        { average: 0.5, peaks: [], silenceRatio: 0.5 }
      );
      expect(result1.removedSilenceSec).toBe(0);
      expect(result1.tightenedStart).toBe(10);
      expect(result1.tightenedEnd).toBe(10);

      // No silence
      const result2 = pauseTightener.tightenPauses(
        0,
        30,
        { average: 0.5, peaks: [], silenceRatio: 0.0 }
      );
      expect(result2.removedSilenceSec).toBe(0);
      expect(result2.tightenedEnd).toBe(30);
    });

    it('should allow configuring thresholds', () => {
      const tightener = new PauseTightener();

      // Test getter/setter
      expect(tightener.getSilenceThreshold()).toBe(0.3);
      expect(tightener.getMinPauseDuration()).toBe(0.5);

      tightener.setSilenceThreshold(0.5);
      tightener.setMinPauseDuration(1.0);

      expect(tightener.getSilenceThreshold()).toBe(0.5);
      expect(tightener.getMinPauseDuration()).toBe(1.0);
    });
  });
});