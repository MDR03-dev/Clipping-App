/*
 * Importers/callers: This file will be imported by AIRouter to use Direct API (Gemini/OpenAI) for analysis.
 * Affected API: DirectAPI class with analyze() method.
 * Data schemas: AnalysisBrief { title, summary, tags, viralityScore, recommendedClips }.
 * Verbatim instruction: Continue building out reframe-engine; add Direct API adapter per Stage 1C spec.
 */
import type { AnalysisBrief } from './aiRouter';

export interface DirectAPIOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export class DirectAPI {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private provider: 'gemini' | 'openai';

  constructor(apiKey?: string, model?: string, options: DirectAPIOptions = {}) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
    this.model = model || options.model || 'gemini-1.5-flash';
    this.baseUrl = options.baseUrl || '';
    this.provider = this.detectProvider();
  }

  /**
   * Detect which provider based on model name or API key.
   * @returns Provider type
   */
  private detectProvider(): 'gemini' | 'openai' {
    if (this.model.startsWith('gpt') || this.apiKey.startsWith('sk-')) {
      return 'openai';
    }
    return 'gemini';
  }

  /**
   * Analyze media metadata using Direct API.
   * @param metadata Media metadata including duration, transcript, detected speakers, etc.
   * @returns Analysis brief with virality scoring and clip recommendations
   */
  async analyze(metadata: Record<string, any>): Promise<AnalysisBrief> {
    if (!this.apiKey) {
      console.warn('No API key configured for Direct API, using fallback');
      return this.getFallbackAnalysis(metadata);
    }

    const prompt = this.buildPrompt(metadata);

    try {
      const response = await this.callAPI(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.warn('Direct API analysis failed, using fallback:', error);
      return this.getFallbackAnalysis(metadata);
    }
  }

  /**
   * Build the prompt for Direct API based on metadata.
   * @param metadata Media metadata
   * @returns Formatted prompt string
   */
  private buildPrompt(metadata: Record<string, any>): string {
    const {
      duration,
      transcript,
      speakers,
      sceneCuts,
      faceDetections,
      audioLevels,
    } = metadata;

    return `Analyze this video content and provide a structured analysis brief for short-form clip selection.

Video Metadata:
- Duration: ${duration || 'unknown'} seconds
- Transcript: ${transcript || 'not available'}
- Detected speakers: ${JSON.stringify(speakers || [])}
- Scene cuts: ${JSON.stringify(sceneCuts || [])}
- Face detections: ${faceDetections ? faceDetections.length : 0} faces detected
- Audio levels: ${JSON.stringify(audioLevels || {})}

Provide a JSON response with exactly this structure:
{
  "title": "Compelling title for the content",
  "summary": "2-3 sentence summary of the content",
  "tags": ["tag1", "tag2", "tag3"],
  "viralityScore": 0.0-1.0,
  "recommendedClips": [
    { "startSec": 10, "endSec": 25, "reason": "Why this clip is engaging" }
  ]
}

Focus on:
1. Virality potential (hooks, emotional moments, surprises)
2. Clear narrative arcs
3. Visual engagement (face presence, scene changes)
4. Audio quality and speech clarity
5. Platform-appropriate clip lengths (15-60 seconds for TikTok/Reels/Shorts)`;
  }

  /**
   * Call the appropriate API based on provider.
   * @param prompt The prompt to send
   * @returns API response text
   */
  private async callAPI(prompt: string): Promise<string> {
    if (this.provider === 'openai') {
      return this.callOpenAI(prompt);
    }
    return this.callGemini(prompt);
  }

  /**
   * Call OpenAI API.
   * @param prompt The prompt to send
   * @returns API response text
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a video content analyst specializing in short-form viral clip selection.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Call Gemini API.
   * @param prompt The prompt to send
   * @returns API response text
   */
  private async callGemini(prompt: string): Promise<string> {
    const url = this.baseUrl || `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  /**
   * Parse API response into AnalysisBrief.
   * @param response Raw response from API
   * @returns Parsed AnalysisBrief
   */
  private parseResponse(response: string): AnalysisBrief {
    try {
      const parsed = JSON.parse(response);
      return this.validateAnalysisBrief(parsed);
    } catch (error) {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return this.validateAnalysisBrief(parsed);
        } catch {
          // Fall through to error
        }
      }
      throw new Error(`Failed to parse API response: ${error}`);
    }
  }

  /**
   * Validate and normalize AnalysisBrief structure.
   * @param data Parsed data from API
   * @returns Validated AnalysisBrief
   */
  private validateAnalysisBrief(data: any): AnalysisBrief {
    return {
      title: data.title || 'Untitled Analysis',
      summary: data.summary || 'No summary provided',
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 10) : [],
      viralityScore: typeof data.viralityScore === 'number'
        ? Math.max(0, Math.min(1, data.viralityScore))
        : 0.5,
      recommendedClips: Array.isArray(data.recommendedClips)
        ? data.recommendedClips
            .filter((clip: any) =>
              typeof clip.startSec === 'number' &&
              typeof clip.endSec === 'number' &&
              clip.endSec > clip.startSec
            )
            .slice(0, 5)
            .map((clip: any) => ({
              startSec: clip.startSec,
              endSec: clip.endSec,
              reason: clip.reason || 'Recommended clip',
            }))
        : [],
    };
  }

  /**
   * Get fallback analysis when API is unavailable.
   * @param metadata Media metadata
   * @returns Basic AnalysisBrief
   */
  private getFallbackAnalysis(metadata: Record<string, any>): AnalysisBrief {
    const duration = metadata.duration || 60;
    const clipLength = Math.min(30, duration * 0.5);
    const startSec = Math.max(0, (duration - clipLength) / 2);

    return {
      title: 'Content Analysis (Fallback)',
      summary: 'API analysis unavailable. Using duration-based clip selection.',
      tags: ['auto-generated', 'fallback'],
      viralityScore: 0.3,
      recommendedClips: [
        {
          startSec,
          endSec: startSec + clipLength,
          reason: 'Center portion of video - fallback selection',
        },
      ],
    };
  }

  /**
   * Set the API key.
   * @param apiKey The API key to use
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.provider = this.detectProvider();
  }

  /**
   * Set the model.
   * @param model The model to use
   */
  setModel(model: string): void {
    this.model = model;
    this.provider = this.detectProvider();
  }
}