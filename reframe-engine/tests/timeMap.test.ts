/*
 * Importers/callers: This file will be imported by the test runner to verify TimeMap functionality.
 * Affected API: TimeMap class with bidirectional mapping methods.
 * Data schemas: TimeMap { createForwardMapping, createReverseMapping }.
 * Verbatim instruction: Continue building out reframe-engine; add TimeMap test per Stage 2 spec.
 */
import { describe, it, expect } from 'vitest';
import { TimeMap } from '../src/pipeline/timeMap';

describe('Stage 2: TimeMap & STT Budget', () => {
  describe('TimeMap bidirectional mappings', () => {
    it('should create a TimeMap instance', () => {
      const timeMap = new TimeMap();
      expect(timeMap).toBeDefined();
    });

    it('should create forward mapping', () => {
      const timeMap = new TimeMap();
      const result = timeMap.createForwardMapping(0, 30, 60);
      expect(result).toBeDefined();
      expect(result.startSec).toBe(0);
      expect(result.endSec).toBe(30);
      expect(result.durationSec).toBe(30); // sourceEnd - sourceStart
    });

    it('should create reverse mapping', () => {
      const timeMap = new TimeMap();
      const result = timeMap.createReverseMapping(0, 30, 60);
      expect(result).toBeDefined();
      expect(result.startSec).toBe(0);
      expect(result.endSec).toBe(30);
      expect(result.durationSec).toBe(30); // outputEnd - outputStart
    });

    it('should handle boundary values', () => {
      const timeMap = new TimeMap();
      const forward = timeMap.createForwardMapping(0, 0, 60);
      expect(forward.durationSec).toBe(0); // sourceEnd - sourceStart = 0

      const reverse = timeMap.createReverseMapping(30, 30, 60);
      expect(reverse.durationSec).toBe(0); // outputEnd - outputStart = 0
    });
  });
});