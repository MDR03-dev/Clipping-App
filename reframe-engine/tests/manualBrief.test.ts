/*
 * Importers/callers: This file will be imported by the test runner to verify Manual Brief handler functionality.
 * Affected API: ManualBrief class.
 * Data schemas: AnalysisBrief { title, summary, tags, viralityScore, recommendedClips }.
 * Verbatim instruction: Continue building out reframe-engine; add test for Manual Brief per Stage 1C spec.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ManualBrief } from '../src/pipeline/manualBrief';
import type { AnalysisBrief, ManualBriefInput } from '../src/pipeline/aiRouter';

describe('Stage 1C: Manual Brief Handler', () => {
  let manualBrief: ManualBrief;

  beforeEach(() => {
    manualBrief = new ManualBrief();
  });

  it('should instantiate ManualBrief', () => {
    expect(manualBrief).toBeDefined();
    expect(manualBrief).toBeInstanceOf(ManualBrief);
  });

  it('should return provided manual input when title and summary are given', async () => {
    const input: ManualBriefInput = {
      title: 'Custom Title',
      summary: 'Custom summary',
      tags: ['custom', 'test'],
      viralityScore: 0.85,
      recommendedClips: [
        { startSec: 5, endSec: 30, reason: 'Custom reason' },
      ],
    };

    const result = await manualBrief.analyze({ duration: 60 }, input);

    expect(result.title).toBe('Custom Title');
    expect(result.summary).toBe('Custom summary');
    expect(result.tags).toEqual(['custom', 'test']);
    expect(result.viralityScore).toBe(0.85);
    expect(result.recommendedClips).toHaveLength(1);
    expect(result.recommendedClips[0].startSec).toBe(5);
    expect(result.recommendedClips[0].endSec).toBe(30);
    expect(result.recommendedClips[0].reason).toBe('Custom reason');
  });

  it('should generate analysis from metadata when no manual input provided', async () => {
    const metadata = {
      duration: 60,
      transcript: 'Test transcript',
      speakers: [{ id: '1', confidence: 0.9 }],
      sceneCuts: [10, 20, 30],
      faceDetections: [{ frame: 1, x: 0.5, y: 0.5, width: 0.3, height: 0.3, confidence: 0.8 }],
      audioLevels: { average: 0.5, peaks: [], silenceRatio: 0.1 },
    };

    const result = await manualBrief.analyze(metadata);

    expect(result.title).toBe('Manual Analysis');
    expect(result.summary).toContain('60s long');
    expect(result.summary).toContain('Has transcript');
    expect(result.summary).toContain('1 speaker(s)');
    expect(result.summary).toContain('3 scene cuts');
    expect(result.viralityScore).toBeGreaterThan(0.3);
    expect(result.viralityScore).toBeLessThanOrEqual(0.8);
    expect(result.recommendedClips).toHaveLength(1);
  });

  it('should calculate virality score based on metadata signals', async () => {
    // Full metadata should give higher score
    const fullMetadata = {
      duration: 60,
      transcript: 'Test',
      speakers: [{ id: '1', confidence: 0.9 }],
      sceneCuts: [10, 20, 30, 40],
      faceDetections: [{ frame: 1, x: 0.5, y: 0.5, width: 0.3, height: 0.3, confidence: 0.8 }],
      audioLevels: { average: 0.5, peaks: [], silenceRatio: 0.1 },
    };

    const minimalMetadata = { duration: 10 };

    const fullResult = await manualBrief.analyze(fullMetadata);
    const minimalResult = await manualBrief.analyze(minimalMetadata);

    expect(fullResult.viralityScore).toBeGreaterThan(minimalResult.viralityScore);
  });

  it('should clamp virality score to 0-1 range', async () => {
    const input: ManualBriefInput = {
      title: 'Test',
      summary: 'Test',
      viralityScore: 1.5, // over 1
    };

    const result = await manualBrief.analyze({ duration: 60 }, input);
    expect(result.viralityScore).toBe(1.0);

    input.viralityScore = -0.5; // under 0
    const result2 = await manualBrief.analyze({ duration: 60 }, input);
    expect(result2.viralityScore).toBe(0.0);
  });

  it('should filter invalid recommended clips', async () => {
    const input: ManualBriefInput = {
      title: 'Test',
      summary: 'Test',
      recommendedClips: [
        { startSec: 5, endSec: 30, reason: 'Valid' },
        { startSec: 30, endSec: 20, reason: 'Invalid - end before start' },
        { startSec: 'invalid' as any, endSec: 40, reason: 'Invalid - non-number start' },
        { startSec: 10, endSec: 50, reason: 'Valid 2' },
      ],
    };

    const result = await manualBrief.analyze({ duration: 60 }, input);
    expect(result.recommendedClips).toHaveLength(2);
    expect(result.recommendedClips[0].startSec).toBe(5);
    expect(result.recommendedClips[1].startSec).toBe(10);
  });

  it('should allow setting and getting default input', () => {
    const defaultInput: ManualBriefInput = {
      title: 'Default Title',
      summary: 'Default summary',
    };

    manualBrief.setDefaultInput(defaultInput);
    const retrieved = manualBrief.getDefaultInput();

    expect(retrieved.title).toBe('Default Title');
    expect(retrieved.summary).toBe('Default summary');
  });

  it('should merge default input with provided input', async () => {
    manualBrief.setDefaultInput({
      title: 'Default Title',
      tags: ['default'],
    });

    const result = await manualBrief.analyze({ duration: 60 }, {
      summary: 'Provided summary',
    });

    expect(result.title).toBe('Default Title');
    expect(result.summary).toBe('Provided summary');
    expect(result.tags).toEqual(['default']);
  });
});