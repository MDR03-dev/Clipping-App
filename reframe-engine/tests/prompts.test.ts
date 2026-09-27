/*
 * Importers/callers: This file will be imported by the test runner to verify prompt templates.
 * Affected API: Prompt building functions.
 * Data schemas: ViralityPromptContext, PromptTemplate.
 * Verbatim instruction: Continue building out reframe-engine; add test for prompts per Stage 1C spec.
 */
import { describe, it, expect } from 'vitest';
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildRankingPrompt,
  buildHookDetectionPrompt,
  getPromptTemplate,
  type ViralityPromptContext,
} from '../src/pipeline/prompts';

describe('Stage 1C: Prompt Templates', () => {
  const sampleContext: ViralityPromptContext = {
    duration: 60,
    transcript: 'This is a test transcript with a surprising moment!',
    speakers: [
      { id: '1', name: 'Speaker 1', confidence: 0.9, segments: [{ start: 0, end: 30 }] },
      { id: '2', name: 'Speaker 2', confidence: 0.8, segments: [{ start: 30, end: 60 }] },
    ],
    sceneCuts: [10, 20, 35, 45],
    faceDetections: [
      { frame: 1, x: 0.5, y: 0.5, width: 0.3, height: 0.3, confidence: 0.9 },
      { frame: 25, x: 0.4, y: 0.5, width: 0.3, height: 0.3, confidence: 0.8 },
    ],
    audioLevels: { average: 0.6, peaks: [0.8, 0.9, 0.7], silenceRatio: 0.1 },
    platform: 'tiktok',
    targetLength: 30,
  };

  describe('buildSystemPrompt', () => {
    it('should return a non-empty system prompt', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toBeTypeOf('string');
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('should contain key evaluation criteria', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('Hook Strength');
      expect(prompt).toContain('Emotional Impact');
      expect(prompt).toContain('Narrative Completeness');
      expect(prompt).toContain('Visual Engagement');
      expect(prompt).toContain('Audio Quality');
      expect(prompt).toContain('Platform Fit');
      expect(prompt).toContain('Rewatch Value');
      expect(prompt).toContain('Shareability');
    });

    it('should instruct JSON-only response', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('No additional text');
    });
  });

  describe('buildUserPrompt', () => {
    it('should return a non-empty user prompt with context', () => {
      const prompt = buildUserPrompt(sampleContext);
      expect(prompt).toBeTypeOf('string');
      expect(prompt.length).toBeGreaterThan(200);
    });

    it('should include all metadata fields', () => {
      const prompt = buildUserPrompt(sampleContext);
      expect(prompt).toContain('60');
      expect(prompt).toContain('tiktok');
      expect(prompt).toContain('30');
      expect(prompt).toContain('test transcript');
      expect(prompt).toContain('Speaker 1');
      expect(prompt).toContain('[10,20,35,45]'); // JSON.stringify format
    });

    it('should include platform-specific guidance for tiktok', () => {
      const prompt = buildUserPrompt({ ...sampleContext, platform: 'tiktok' });
      expect(prompt).toContain('TIKTOK OPTIMIZATION');
      expect(prompt).toContain('21-34 seconds');
    });

    it('should include platform-specific guidance for reels', () => {
      const prompt = buildUserPrompt({ ...sampleContext, platform: 'reels' });
      expect(prompt).toContain('INSTAGRAM REELS OPTIMIZATION');
      expect(prompt).toContain('30-60 seconds');
    });

    it('should include platform-specific guidance for shorts', () => {
      const prompt = buildUserPrompt({ ...sampleContext, platform: 'shorts' });
      expect(prompt).toContain('YOUTUBE SHORTS OPTIMIZATION');
    });

    it('should include general guidance for unknown platform', () => {
      const prompt = buildUserPrompt({ ...sampleContext, platform: 'unknown' });
      expect(prompt).toContain('GENERAL SHORT-FORM OPTIMIZATION');
    });

    it('should specify required JSON structure', () => {
      const prompt = buildUserPrompt(sampleContext);
      expect(prompt).toContain('title');
      expect(prompt).toContain('summary');
      expect(prompt).toContain('tags');
      expect(prompt).toContain('viralityScore');
      expect(prompt).toContain('recommendedClips');
      expect(prompt).toContain('scores');
    });
  });

  describe('buildRankingPrompt', () => {
    it('should return a ranking prompt with all clips', () => {
      const clips = [
        { startSec: 0, endSec: 30, metadata: sampleContext },
        { startSec: 30, endSec: 60, metadata: { ...sampleContext, duration: 30 } },
      ];

      const prompt = buildRankingPrompt(clips, 'tiktok');
      expect(prompt).toContain('CLIP 1');
      expect(prompt).toContain('CLIP 2');
      expect(prompt).toContain('tiktok');
      expect(prompt).toContain('ranking');
    });
  });

  describe('buildHookDetectionPrompt', () => {
    it('should return a hook detection prompt', () => {
      const transcript = "Wait, you won't believe this! This is amazing.";
      const prompt = buildHookDetectionPrompt(transcript);
      expect(prompt).toContain(transcript);
      expect(prompt).toContain('hooks');
      expect(prompt).toContain('surprise');
      expect(prompt).toContain('question');
    });
  });

  describe('getPromptTemplate', () => {
    it('should return a prompt template with system and user', () => {
      const template = getPromptTemplate('codex');
      expect(template).toHaveProperty('system');
      expect(template).toHaveProperty('user');
      expect(template).toHaveProperty('variables');
      expect(Array.isArray(template.variables)).toBe(true);
      expect(template.variables.length).toBeGreaterThan(0);
    });

    it('should include all expected variables', () => {
      const template = getPromptTemplate('gemini');
      expect(template.variables).toContain('duration');
      expect(template.variables).toContain('transcript');
      expect(template.variables).toContain('speakers');
      expect(template.variables).toContain('sceneCuts');
      expect(template.variables).toContain('faceDetections');
      expect(template.variables).toContain('audioLevels');
      expect(template.variables).toContain('platform');
      expect(template.variables).toContain('targetLength');
    });
  });

  describe('Context handling', () => {
    it('should handle minimal context', () => {
      const minimalContext: ViralityPromptContext = {
        duration: 30,
      };

      const prompt = buildUserPrompt(minimalContext);
      expect(prompt).toContain('30');
      expect(prompt).not.toContain('undefined');
    });

    it('should handle empty arrays gracefully', () => {
      const context: ViralityPromptContext = {
        duration: 30,
        speakers: [],
        sceneCuts: [],
        faceDetections: [],
      };

      const prompt = buildUserPrompt(context);
      expect(prompt).toContain('0');
    });
  });
});