/*
 * Importers/callers: This file will be imported by the CLI and pipeline index to route AI analysis requests.
 * Affected API: AIRouter class with analyze() method.
 * Data schemas: AnalysisBrief { title, summary, tags, viralityScore, recommendedClips }.
 * Verbatim instruction: Continue building out reframe-engine; add AI Router per Stage 1C spec.
 */
import { CodexCLI } from './codexCli';
import { DirectAPI } from './directApi';
import { ManualBrief } from './manualBrief';

export type AIProvider = 'codex' | 'direct' | 'manual';

export interface AnalysisBrief {
  title: string;
  summary: string;
  tags: string[];
  viralityScore: number;
  recommendedClips: Array<{ startSec: number; endSec: number; reason: string }>;
}

export interface AIRouterOptions {
  provider?: AIProvider;
  apiKey?: string;
  model?: string;
}

export class AIRouter {
  private codex: CodexCLI;
  private direct: DirectAPI;
  private manual: ManualBrief;
  private defaultProvider: AIProvider;

  constructor(options: AIRouterOptions = {}) {
    this.codex = new CodexCLI();
    this.direct = new DirectAPI(options.apiKey, options.model);
    this.manual = new ManualBrief();
    this.defaultProvider = options.provider || 'manual';
  }

  /**
   * Analyze media metadata and return a structured analysis brief.
   * @param metadata Media metadata including duration, transcript, detected speakers, etc.
   * @param provider Optional override for AI provider
   * @returns Analysis brief with virality scoring and clip recommendations
   */
  async analyze(metadata: Record<string, any>, provider?: AIProvider): Promise<AnalysisBrief> {
    const activeProvider = provider || this.defaultProvider;

    switch (activeProvider) {
      case 'codex':
        return this.codex.analyze(metadata);
      case 'direct':
        return this.direct.analyze(metadata);
      case 'manual':
        return this.manual.analyze(metadata);
      default:
        throw new Error(`Unknown AI provider: ${activeProvider}`);
    }
  }

  /**
   * Set the default AI provider.
   * @param provider The provider to use by default
   */
  setDefaultProvider(provider: AIProvider): void {
    this.defaultProvider = provider;
  }

  /**
   * Get the current default AI provider.
   * @returns The current default provider
   */
  getDefaultProvider(): AIProvider {
    return this.defaultProvider;
  }
}