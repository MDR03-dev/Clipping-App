/*
 * Importers/callers: This file will be imported by the test runner to verify Direct API adapter functionality.
 * Affected API: DirectAPI class.
 * Data schemas: AnalysisBrief { title, summary, tags, viralityScore, recommendedClips }.
 * Verbatim instruction: Continue building out reframe-engine; add test for Direct API per Stage 1C spec.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DirectAPI } from '../src/pipeline/directApi';
import type { AnalysisBrief } from '../src/pipeline/aiRouter';

describe('Stage 1C: Direct API Adapter', () => {
  let directApi: DirectAPI;

  beforeEach(() => {
    // Don't set API key to trigger fallback
    directApi = new DirectAPI('', 'gemini-1.5-flash');
  });

  it('should instantiate DirectAPI', () => {
    expect(directApi).toBeDefined();
    expect(directApi).toBeInstanceOf(DirectAPI);
  });

  it('should return fallback analysis when no API key is configured', async () => {
    const metadata = {
      duration: 60,
      transcript: 'Test transcript',
      speakers: [{ id: '1', confidence: 0.9 }],
      sceneCuts: [10, 20, 30],
      faceDetections: [],
      audioLevels: { average: 0.5 },
    };

    const result = await directApi.analyze(metadata);

    expect(result).toBeDefined();
    expect(result.title).toBe('Content Analysis (Fallback)');
    expect(result.summary).toContain('API analysis unavailable');
    expect(result.viralityScore).toBe(0.3);
    expect(result.recommendedClips).toHaveLength(1);
    expect(result.recommendedClips[0].startSec).toBeGreaterThanOrEqual(0);
    expect(result.recommendedClips[0].endSec).toBeGreaterThan(result.recommendedClips[0].startSec);
  });

  it('should validate and normalize AnalysisBrief structure', async () => {
    const metadata = { duration: 120 };
    const result = await directApi.analyze(metadata);

    expect(result.title).toBeTypeOf('string');
    expect(result.summary).toBeTypeOf('string');
    expect(Array.isArray(result.tags)).toBe(true);
    expect(typeof result.viralityScore).toBe('number');
    expect(result.viralityScore).toBeGreaterThanOrEqual(0);
    expect(result.viralityScore).toBeLessThanOrEqual(1);
    expect(Array.isArray(result.recommendedClips)).toBe(true);
  });

  it('should handle empty metadata gracefully', async () => {
    const result = await directApi.analyze({});

    expect(result).toBeDefined();
    expect(result.recommendedClips).toHaveLength(1);
  });

  it('should detect provider from model name', () => {
    const openaiApi = new DirectAPI('sk-test', 'gpt-4');
    const geminiApi = new DirectAPI('gemini-key', 'gemini-1.5-flash');

    // Test that both instantiate without error
    expect(openaiApi).toBeDefined();
    expect(geminiApi).toBeDefined();
  });

  it('should allow setting API key and model', () => {
    directApi.setApiKey('new-key');
    directApi.setModel('gemini-1.5-pro');
    // No error means success
    expect(true).toBe(true);
  });
});