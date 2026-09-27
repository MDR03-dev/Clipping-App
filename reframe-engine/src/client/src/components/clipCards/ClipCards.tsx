import React from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useReduceMotion } from '../../hooks/useReduceMotion';

interface Clip {
  id: string;
  title: string;
  startSec: number;
  endSec: number;
  viralityScore: number;
  hookSummary: string;
  payoffSummary: string;
  suggestedCaption: string;
}

export function ClipCards() {
  const { clips, selectedClip, setSelectedClip } = useProjectStore();
  const reducedMotion = useReduceMotion();

  if (clips.length === 0) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center p-6" aria-label="No clips generated">
        <div className="w-16 h-16 rounded-2xl bg-[color._surface-variant] flex items-center justify-center mx-auto mb-4" role="img" aria-label="search">
          <span className="text-[2rem]">🔍</span>
        </div>
        <h3 className="text-[clamp(1.125rem,3vw,1.5rem)] font-[weight._display] [color._on-surface] mb-2">
          No clips yet
        </h3>
        <p className="text-[color._on-surface-variant] text-[0.875rem] max-w-xs text-center">
          Run AI analysis to generate clip candidates
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="clips-heading" className="flex-1 overflow-y-auto p-6">
      <div className="mb-4">
        <h2 id="clips-heading" className="text-[1.125rem] font-[weight._display] [color._on-surface]">
          {clips.length} {clips.length === 1 ? 'clip' : 'clips'} generated
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clips.map((clip: Clip) => (
          <article
            key={clip.id}
            className={`
              bg-[color._surface] border border-[color._border] rounded-[16px] p-4 cursor-pointer
              transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color._focus] focus-visible:ring-offset-2 focus-visible:ring-offset-[color._surface-variant]
              ${selectedClip?.id === clip.id
                ? 'ring-2 ring-[color._accent] shadow-[0_0_20px_rgba(255,59,59,0.25)] border-[color._accent]'
                : 'hover:bg-[color._surface-variant]'
              }
            `}
            onClick={() => setSelectedClip(clip)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedClip(clip);
              }
            }}
            tabIndex={0}
            role="button"
            aria-pressed={selectedClip?.id === clip.id}
            aria-label={`${clip.title}, ${Math.round(clip.endSec - clip.startSec)} seconds, virality score ${clip.viralityScore}`}
            style={{
              transition: reducedMotion ? 'none' : 'all 0.15s ease'
            }}
          >
            <header className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-[weight._display] text-[color._on-surface] text-[1rem] leading-snug truncate flex-1 pr-2">
                {clip.title}
              </h3>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-[1.5rem] font-[weight._display] text-[color._accent]">
                  {clip.viralityScore}
                </span>
                <span className="text-[0.625rem] text-[color._on-surface-variant] uppercase tracking-wide">
                  virality
                </span>
              </div>
            </header>

            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-[color._surface-variant] px-2 py-1 text-[0.6875rem] text-[color._on-surface-variant] font-medium">
                <span aria-hidden="true">⏱</span>
                {clip.startSec}s - {clip.endSec}s
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[color._surface-variant] px-2 py-1 text-[0.6875rem] text-[color._on-surface-variant] font-medium">
                <span aria-hidden="true">⏱</span>
                {Math.round(clip.endSec - clip.startSec)}s
              </span>
            </div>

            <details className="mb-2">
              <summary className="text-[0.6875rem] font-medium text-[color._on-surface-variant] uppercase tracking-wider mb-1 cursor-pointer select-none list-none">
                Hook
              </summary>
              <p className="text-[0.8125rem] text-[color._on-surface] mt-1 line-clamp-2">
                {clip.hookSummary}
              </p>
            </details>

            <details className="mb-3">
              <summary className="text-[0.6875rem] font-medium text-[color._on-surface-variant] uppercase tracking-wider mb-1 cursor-pointer select-none list-none">
                Payoff
              </summary>
              <p className="text-[0.8125rem] text-[color._on-surface] mt-1 line-clamp-2">
                {clip.payoffSummary}
              </p>
            </details>

            <div className="bg-[color._surface-variant] rounded-lg p-3 text-[0.75rem] text-[color._on-surface-variant] line-clamp-2">
              {clip.suggestedCaption}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ClipCards;