/*
 * Importers/callers: This file will be imported by the test runner to verify Codex CLI adapter functionality.
 * Affected API: CodexCLI class.
 * Data schemas: AnalysisBrief { title, summary, tags, viralityScore, recommendedClips }.
 * Verbatim instruction: Continue building out reframe-engine; add test for Codex CLI per Stage 1C spec.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodexCLI, CodexExecutor } from '../src/pipeline/codexCli';
import type { AnalysisBrief } from '../src/pipeline/aiRouter';

describe('Stage 1C: Codex CLI Adapter', () => {
  let codex: CodexCLI;
  let mockExecutor: CodexExecutor;

  beforeEach(() => {
    // Create a mock executor that always fails to trigger fallback
    mockExecutor = vi.fn().mockRejectedValue(new Error('Mock Codex failure'));
    codex = new CodexCLI(5000, mockExecutor);
  });

  it('should instantiate CodexCLI', () => {
    expect(codex).toBeDefined();
    expect(codex).toBeInstanceOf(CodexCLI);
  });

  it('should return fallback analysis when Codex CLI is not available', async () => {
    const metadata = {
      duration: 60,
      transcript: 'Test transcript',
      speakers: [{ id: '1', confidence: 0.9 }],
      sceneCuts: [10, 20, 30],
      faceDetections: [],
      audioLevels: { average: 0.5 },
    };

    const result = await codex.analyze(metadata);

    expect(result).toBeDefined();
    expect(result.title).toBe('Content Analysis (Fallback)');
    expect(result.summary).toContain('Automated analysis unavailable');
    expect(result.viralityScore).toBe(0.3);
    expect(result.recommendedClips).toHaveLength(1);
    expect(result.recommendedClips[0].startSec).toBeGreaterThanOrEqual(0);
    expect(result.recommendedClips[0].endSec).toBeGreaterThan(result.recommendedClips[0].startSec);
    expect(mockExecutor).toHaveBeenCalled();
  });

  it('should validate and normalize AnalysisBrief structure', async () => {
    const metadata = { duration: 120 };
    const result = await codex.analyze(metadata);

    expect(result.title).toBeTypeOf('string');
    expect(result.summary).toBeTypeOf('string');
    expect(Array.isArray(result.tags)).toBe(true);
    expect(typeof result.viralityScore).toBe('number');
    expect(result.viralityScore).toBeGreaterThanOrEqual(0);
    expect(result.viralityScore).toBeLessThanOrEqual(1);
    expect(Array.isArray(result.recommendedClips)).toBe(true);
  });

  it('should handle empty metadata gracefully', async () => {
    const result = await codex.analyze({});

    expect(result).toBeDefined();
    expect(result.recommendedClips).toHaveLength(1);
  });

  it('should use custom executor when provided', async () => {
    const customExecutor: CodexExecutor = vi.fn().mockResolvedValue(JSON.stringify({
      title: 'Custom Result',
      summary: 'Custom summary',
      tags: ['custom'],
      viralityScore: 0.9,
      recommendedClips: [{ startSec: 0, endSec: 15, reason: 'Custom' }],
    }));

    const customCodex = new CodexCLI(5000, customExecutor);
    const result = await customCodex.analyze({ duration: 60 });

    expect(result.title).toBe('Custom Result');
    expect(result.viralityScore).toBe(0.9);
    expect(customExecutor).toHaveBeenCalled();
  });
});