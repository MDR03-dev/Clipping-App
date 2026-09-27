/*
 * Importers/callers: This file will be imported by AI adapters to build prompts for virality scoring.
 * Affected API: Prompt templates and builders.
 * Data schemas: ViralityPromptContext, PromptTemplate.
 * Verbatim instruction: Continue building out reframe-engine; add prompts for virality scoring per Stage 1C spec.
 */

export interface ViralityPromptContext {
  duration: number;
  transcript?: string;
  speakers?: Array<{ id: string; name?: string; confidence: number; segments: Array<{ start: number; end: number }> }>;
  sceneCuts?: number[];
  faceDetections?: Array<{ frame: number; x: number; y: number; width: number; height: number; confidence: number }>;
  audioLevels?: { average: number; peaks: number[]; silenceRatio: number };
  platform?: 'tiktok' | 'reels' | 'shorts' | 'general';
  targetLength?: number; // seconds
}

export interface PromptTemplate {
  system: string;
  user: string;
  variables: string[];
}

/**
 * Build the system prompt for virality analysis.
 * @returns System prompt string
 */
export function buildSystemPrompt(): string {
  return `You are an expert video content analyst specializing in short-form viral clip selection for TikTok, Instagram Reels, and YouTube Shorts.

Your task is to analyze video metadata and identify the most engaging clips with high virality potential.

Evaluate based on these criteria:
1. **Hook Strength** (0-1): Does the clip start with an immediate attention-grabber?
2. **Emotional Impact** (0-1): Does it evoke strong emotions (surprise, joy, curiosity, tension)?
3. **Narrative Completeness** (0-1): Does the clip tell a complete mini-story?
4. **Visual Engagement** (0-1): Face presence, scene changes, dynamic movement
5. **Audio Quality** (0-1): Clear speech, good energy, minimal noise
6. **Platform Fit** (0-1): Optimal length, format, and style for target platform
7. **Rewatch Value** (0-1): Would viewers watch it multiple times?
8. **Shareability** (0-1): Would viewers send this to others?

Return ONLY valid JSON matching the specified schema. No additional text, no markdown formatting.`;
}

/**
 * Build the user prompt for virality analysis.
 * @param context Video metadata context
 * @returns User prompt string
 */
export function buildUserPrompt(context: ViralityPromptContext): string {
  const {
    duration,
    transcript,
    speakers,
    sceneCuts,
    faceDetections,
    audioLevels,
    platform = 'general',
    targetLength = 30,
  } = context;

  const platformGuidance = getPlatformGuidance(platform, targetLength);

  return `Analyze this video for viral clip potential.

VIDEO METADATA:
- Duration: ${duration} seconds
- Target Platform: ${platform}
- Target Clip Length: ${targetLength} seconds
- Transcript: ${transcript || 'Not available'}
- Detected Speakers: ${JSON.stringify(speakers || [], null, 2)}
- Scene Cuts (seconds): ${JSON.stringify(sceneCuts || [])}
- Face Detections: ${faceDetections ? faceDetections.length : 0} total
- Audio Levels: Average ${audioLevels?.average?.toFixed(2) || 'N/A'}, Silence Ratio ${audioLevels?.silenceRatio?.toFixed(2) || 'N/A'}

${platformGuidance}

Return JSON with exactly this structure:
{
  "title": "Compelling title (max 80 chars)",
  "summary": "2-3 sentence summary highlighting the hook and payoff",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "viralityScore": 0.0-1.0,
  "recommendedClips": [
    {
      "startSec": 10.5,
      "endSec": 35.2,
      "reason": "Strong hook at 10.5s with surprise reveal, complete narrative arc, high face presence"
    }
  ],
  "scores": {
    "hookStrength": 0.0-1.0,
    "emotionalImpact": 0.0-1.0,
    "narrativeCompleteness": 0.0-1.0,
    "visualEngagement": 0.0-1.0,
    "audioQuality": 0.0-1.0,
    "platformFit": 0.0-1.0,
    "rewatchValue": 0.0-1.0,
    "shareability": 0.0-1.0
  }
}

Recommend 1-3 clips. Each clip must be ${Math.max(10, targetLength - 10)}-${targetLength + 15} seconds.`;
}

/**
 * Get platform-specific guidance for clip selection.
 * @param platform Target platform
 * @param targetLength Target clip length in seconds
 * @returns Platform guidance string
 */
function getPlatformGuidance(platform: string, targetLength: number): string {
  switch (platform) {
    case 'tiktok':
      return `TIKTOK OPTIMIZATION:
- Optimal length: 15-60 seconds (sweet spot: 21-34 seconds)
- Hook must land in first 3 seconds
- Vertical 9:16 format
- Trending audio/sounds boost reach
- Text overlays for silent viewing
- Loop-friendly endings encouraged`;
    case 'reels':
      return `INSTAGRAM REELS OPTIMIZATION:
- Optimal length: 15-90 seconds (sweet spot: 30-60 seconds)
- Strong visual hook in first 3 seconds
- Vertical 9:16 format
- Carousel-style multi-part content works well
- Educational/saveable content performs well
- Hashtag strategy important`;
    case 'shorts':
      return `YOUTUBE SHORTS OPTIMIZATION:
- Optimal length: 15-60 seconds
- Hook in first 3 seconds critical
- Vertical 9:16 format
- Loop-friendly for repeat views
- Title/description SEO matters
- Related to long-form content helps channel growth`;
    default:
      return `GENERAL SHORT-FORM OPTIMIZATION:
- Target length: ${targetLength} seconds (range: ${Math.max(10, targetLength - 10)}-${targetLength + 15} seconds)
- Hook in first 3 seconds
- Vertical 9:16 preferred
- Complete narrative arc
- High visual and audio quality`;
  }
}

/**
 * Build a prompt for clip ranking given multiple candidates.
 * @param clips Array of clip candidates with metadata
 * @param platform Target platform
 * @returns Ranking prompt string
 */
export function buildRankingPrompt(
  clips: Array<{ startSec: number; endSec: number; metadata: ViralityPromptContext }>,
  platform: string = 'general'
): string {
  const clipsSummary = clips.map((clip, i) => `
CLIP ${i + 1}: ${clip.startSec}s - ${clip.endSec}s (${(clip.endSec - clip.startSec).toFixed(1)}s)
  Transcript: ${clip.metadata.transcript?.slice(0, 200) || 'N/A'}
  Speakers: ${clip.metadata.speakers?.length || 0}
  Scene Cuts: ${clip.metadata.sceneCuts?.length || 0}
  Face Detections: ${clip.metadata.faceDetections?.length || 0}
  Audio Quality: ${clip.metadata.audioLevels?.average?.toFixed(2) || 'N/A'}
`).join('\n');

  return `Rank these clip candidates by virality potential for ${platform}.

CANDIDATES:${clipsSummary}

Return JSON:
{
  "ranking": [
    { "index": 0, "score": 0.0-1.0, "reason": "Why this ranks highest" }
  ]
}

Rank all clips. Higher score = more viral potential.`;
}

/**
 * Build a prompt for hook detection in a transcript.
 * @param transcript Video transcript
 * @returns Hook detection prompt
 */
export function buildHookDetectionPrompt(transcript: string): string {
  return `Identify the strongest hooks in this transcript for short-form clip selection.

TRANSCRIPT:
${transcript}

A "hook" is a moment that grabs attention immediately - a surprising statement, question, bold claim, emotional reveal, or visual cue described in speech.

Return JSON:
{
  "hooks": [
    { "timeSec": 5.2, "text": "Wait, you won't believe what happened next", "type": "surprise", "strength": 0.9 }
  ]
}

Types: surprise, question, claim, emotion, curiosity, visual
Strength: 0.0-1.0`;
}

/**
 * Get the complete prompt template for a provider.
 * @param provider AI provider ('codex' | 'gemini' | 'openai' | 'manual')
 * @returns PromptTemplate
 */
export function getPromptTemplate(provider: string): PromptTemplate {
  const system = buildSystemPrompt();
  const user = '{{USER_PROMPT}}'; // placeholder

  return {
    system,
    user,
    variables: ['duration', 'transcript', 'speakers', 'sceneCuts', 'faceDetections', 'audioLevels', 'platform', 'targetLength'],
  };
}