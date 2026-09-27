/*
 * Importers/callers: This file will be imported by the pipeline index to plan optimal hook placement.
 * Affected API: HookPlanner class with planHooks() method.
 * Data schemas: HookPlan { hooks: HookPoint[], strategy: string }.
 * Verbatim instruction: Continue building out reframe-engine; add hookPlanner per Stage 2 spec.
 */

export interface HookPoint {
  timeSec: number;
  strength: number;
  type: 'surprise' | 'question' | 'claim' | 'emotion' | 'curiosity' | 'visual';
  description?: string;
}

export interface HookPlan {
  hooks: HookPoint[];
  strategy: string;
  confidence: number;
}

export class HookPlanner {
  /**
   * Plan optimal hook placement based on content analysis.
   * @param transcript Video transcript with timing information
   * @param audioLevels Audio level analysis (peaks, silence ratio)
   * @param sceneCuts Scene change timestamps
   * @param faceDetections Face detection data with confidence
   * @returns Hook placement plan with ranked hook points
   */
  planHooks(
    transcript: string,
    audioLevels: { average: number; peaks: number[]; silenceRatio: number },
    sceneCuts: number[],
    faceDetections: Array<{ frame: number; x: number; y: number; width: number; height: number; confidence: number }>
  ): HookPlan {
    // Extract potential hook points from transcript
    const transcriptHooks = this.extractTranscriptHooks(transcript);

    // Enhance hook scores with audio and visual signals
    const enhancedHooks = this.enhookWithSignals(
      transcriptHooks,
      audioLevels,
      sceneCuts,
      faceDetections
    );

    // Sort by strength and select top hooks
    const sortedHooks = enhancedHooks
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5); // Top 5 hooks

    return {
      hooks: sortedHooks,
      strategy: 'hybrid_audio_visual_text',
      confidence: this.calculatePlanConfidence(enhancedHooks, audioLevels, sceneCuts, faceDetections)
    };
  }

  /**
   * Extract potential hook points from transcript text.
   * @param transcript Full transcript text
   * @returns Array of potential hook points from linguistic analysis
   */
  private extractTranscriptHooks(transcript: string): HookPoint[] {
    const hooks: HookPoint[] = [];
    const sentences = this.splitIntoSentences(transcript);

    let currentTime = 0;
    const timePerSentence = transcript.length > 0 ? 60 / sentences.length : 0; // Assume 60 second video

    for (const sentence of sentences) {
      const hookType = this.classifyHookType(sentence.trim());
      const strength = this.calculateHookStrength(sentence.trim(), hookType);

      if (strength > 0.3) { // Only include meaningful hooks
        hooks.push({
          timeSec: currentTime,
          strength,
          type: hookType,
          description: sentence.trim().substring(0, 50) + (sentence.length > 50 ? '...' : '')
        });
      }

      currentTime += timePerSentence;
    }

    return hooks;
  }

  /**
   * Classify the type of hook based on linguistic patterns.
   * @param text Sentence or phrase to classify
   * @returns Hook type classification
   */
  private classifyHookType(text: string): HookPoint['type'] {
    const lowerText = text.toLowerCase().trim();

    // Surprise indicators
    if (/\b(wait|what|no way|unbelievable|amazing|incredible|wow|whoa)\b/.test(lowerText)) {
      return 'surprise';
    }

    // Question indicators
    if (text.endsWith('?') || /\b(how|why|what|when|where|who|can you|did you)\b/.test(lowerText)) {
      return 'question';
    }

    // Claim indicators
    if (/\b(always|never|every|none|the best|the worst|proven|secret)\b/.test(lowerText)) {
      return 'claim';
    }

    // Emotion indicators
    if (/\b(love|hate|fear|joy|angry|sad|excited|terrified|happy)\b/.test(lowerText)) {
      return 'emotion';
    }

    // Curiosity indicators
    if (/\b(see|look|discover|find out|learn|know|wonder|curious)\b/.test(lowerText)) {
      return 'curiosity';
    }

    // Default to visual for remaining content
    return 'visual';
  }

  /**
   * Calculate hook strength based on linguistic and delivery factors.
   * @param text The hook text
   * @param type The classified hook type
   * @returns Strength score from 0.0 to 1.0
   */
  private calculateHookStrength(text: string, type: HookPoint['type']): number {
    let strength = 0.5; // Base strength

    // Length penalty for very short or long hooks
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 3) {
      strength *= 0.7; // Too short
    } else if (wordCount > 20) {
      strength *= 0.8; // Too long
    }

    // Type-specific adjustments
    switch (type) {
      case 'surprise':
        strength += 0.2;  // Surprise is naturally engaging
        break;
      case 'question':
        strength += 0.15; // Questions create curiosity
        break;
      case 'claim':
        strength += 0.1;  // Bold claims attract attention
        break;
      case 'emotion':
        strength += 0.1;  // Emotional content resonates
        break;
      case 'curiosity':
        strength += 0.15; // Curiosity gaps drive engagement
        break;
      case 'visual':
        strength += 0.05; // Visual hooks are weaker without visual context
        break;
    }

    // Punctuation and emphasis bonuses
    if (text.endsWith('!') || text.endsWith('?')) {
      strength += 0.1;
    }

    if (text.match(/[A-Z]{2,}/)) {  // ALL CAPS words
      strength += 0.1;
    }

    return Math.min(1.0, Math.max(0.0, strength));
  }

  /**
   * Enhance hook scores with audio and visual signals from the video.
   * @param hooks Initial hook points from transcript analysis
   * @param audioLevels Audio analysis data
   * @param sceneCuts Scene change timestamps
   * @param faceDetections Face detection data
   * @returns Enhanced hook points with audio/visual boosting
   */
  private enhookWithSignals(
    hooks: HookPoint[],
    audioLevels: { average: number; peaks: number[]; silenceRatio: number },
    sceneCuts: number[],
    faceDetections: Array<{ frame: number; x: number; y: number; width: number; height: number; confidence: number }>
  ): HookPoint[] {
    return hooks.map(hook => {
      let enhancedStrength = hook.strength;

      // Audio boost: higher average volume and peaks increase hook strength
      if (audioLevels.average > 0.5) {
        enhancedStrength *= 1.1;
      }

      const peakCount = audioLevels.peaks.filter(p => p > 0.7).length;
      if (peakCount > 0) {
        enhancedStrength *= 1.0 + Math.min(0.2, peakCount * 0.05);
      }

      // Visual boost: more face detections and scene cuts increase engagement
      const faceCount = faceDetections.length;
      if (faceCount > 0) {
        enhancedStrength *= 1.0 + Math.min(0.15, faceCount * 0.03);
      }

      const sceneCutCount = sceneCuts.length;
      if (sceneCutCount > 0) {
        enhancedStrength *= 1.0 + Math.min(0.1, sceneCutCount * 0.02);
      }

      // Silence penalty: high silence ratio reduces effectiveness
      if (audioLevels.silenceRatio > 0.3) {
        enhancedStrength *= 1.0 - Math.min(0.2, audioLevels.silenceRatio * 0.5);
      }

      return {
        ...hook,
        strength: Math.min(1.0, Math.max(0.0, enhancedStrength))
      };
    });
  }

  /**
   * Calculate confidence in the hook planning based on signal quality.
   * @param hooks Enhanced hook points
   * @param audioLevels Audio analysis data
   * @param sceneCuts Scene change timestamps
   * @param faceDetections Face detection data
   * @returns Confidence score from 0.0 to 1.0
   */
  private calculatePlanConfidence(
    hooks: HookPoint[],
    audioLevels: { average: number; peaks: number[]; silenceRatio: number },
    sceneCuts: number[],
    faceDetections: Array<{ frame: number; x: number; y: number; width: number; height: number; confidence: number }>
  ): number {
    let confidence = 0.5;  // Base confidence

    // More hooks increase confidence (up to a point)
    const hookFactor = Math.min(0.2, hooks.length * 0.03);
    confidence += hookFactor;

    // Audio quality affects confidence
    if (audioLevels.average > 0.3 && audioLevels.average < 0.9) {
      confidence += 0.1;  // Good audio levels
    }

    if (audioLevels.silenceRatio < 0.4) {
      confidence += 0.1;  // Not too much silence
    }

    // Visual information availability
    if (faceDetections.length > 0) {
      confidence += 0.1;
    }

    if (sceneCuts.length > 0) {
      confidence += 0.1;
    }

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * Split transcript into sentences for analysis.
   * @param transcript Full transcript text
   * @returns Array of sentence strings
   */
  private splitIntoSentences(transcript: string): string[] {
    // Simple sentence splitting on punctuation
    return transcript
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
}