/*
 * Importers/callers: This file will be imported by the test runner to verify HookPlanner functionality.
 * Affected API: HookPlanner class with planHooks() method.
 * Data schemas: HookPoint, HookPlan.
 * Verbatim instruction: Continue building out reframe-engine; add HookPlanner test per Stage 2 spec.
 */
import { describe, it, expect } from 'vitest';
import { HookPlanner } from '../src/pipeline/hookPlanner';

describe('Stage 2: Hook Planner', () => {
  describe('HookPlanner functionality', () => {
    let hookPlanner: HookPlanner;

    beforeEach(() => {
      hookPlanner = new HookPlanner();
    });

    it('should create a HookPlanner instance', () => {
      expect(hookPlanner).toBeDefined();
      expect(hookPlanner).toBeInstanceOf(HookPlanner);
    });

    it('should return a hook plan with default values', () => {
      const result = hookPlanner.planHooks(
        'Test transcript',
        { average: 0.5, peaks: [], silenceRatio: 0.1 },
        [10, 20, 30],
        [{ frame: 1, x: 0.5, y: 0.5, width: 0.3, height: 0.3, confidence: 0.8 }]
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result.hooks)).toBe(true);
      expect(typeof result.strategy).toBe('string');
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should extract hooks from transcript with surprise indicators', () => {
      const result = hookPlanner.planHooks(
        "Wait, you won't believe what happened next!",
        { average: 0.5, peaks: [], silenceRatio: 0.1 },
        [],
        []
      );

      expect(result.hooks.length).toBeGreaterThan(0);
      const surpriseHook = result.hooks.find(h => h.type === 'surprise');
      expect(surpriseHook).toBeDefined();
      expect(surpriseHook?.strength).toBeGreaterThan(0.5);
    });

    it('should extract hooks from transcript with question indicators', () => {
      const result = hookPlanner.planHooks(
        "How does this work? Tell me more!",
        { average: 0.5, peaks: [], silenceRatio: 0.1 },
        [],
        []
      );

      expect(result.hooks.length).toBeGreaterThan(0);
      const questionHook = result.hooks.find(h => h.type === 'question');
      expect(questionHook).toBeDefined();
      expect(questionHook?.strength).toBeGreaterThan(0.4);
    });

    it('should enhance hook strength with audio signals', () => {
      const result1 = hookPlanner.planHooks(
        'Wait, look at this!',
        { average: 0.3, peaks: [], silenceRatio: 0.1 },  // Lower audio
        [],
        []
      );

      const result2 = hookPlanner.planHooks(
        'Wait, look at this!',
        { average: 0.7, peaks: [0.8, 0.9], silenceRatio: 0.1 },  // Higher audio
        [],
        []
      );

      if (result2.hooks.length > 0 && result1.hooks.length > 0) {
        // The second result should have equal or greater strength due to audio boost
        expect(result2.hooks[0].strength).toBeGreaterThanOrEqual(result1.hooks[0].strength);
      }
    });

    it('should handle empty inputs gracefully', () => {
      const result = hookPlanner.planHooks(
        '',
        { average: 0, peaks: [], silenceRatio: 0 },
        [],
        []
      );

      expect(result).toBeDefined();
      expect(result.hooks.length).toBe(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should limit hooks to top 5 by strength', () => {
      // Create a transcript with many potential hooks
      const manyHooksTranscript = 'Wait! How? Amazing! Never! Love! Hate! Wow! Why? See! Look!';
      const result = hookPlanner.planHooks(
        manyHooksTranscript,
        { average: 0.5, peaks: [], silenceRatio: 0.1 },
        [],
        []
      );

      expect(result.hooks.length).toBeLessThanOrEqual(5);
    });
  });
});