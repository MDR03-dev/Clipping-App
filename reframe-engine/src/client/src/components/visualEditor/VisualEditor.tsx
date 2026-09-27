import React, { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useReduceMotion } from '../../hooks/useReduceMotion';

export function VisualEditor() {
  const { selectedClip, currentProject } = useProjectStore();
  const [hookMode, setHookMode] = useState(1);
  const [splitScreen, setSplitScreen] = useState(false);
  const reducedMotion = useReduceMotion();

  if (!selectedClip) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center p-6" aria-label="No clip selected">
        <div className="w-16 h-16 rounded-2xl bg-[color._surface-variant] flex items-center justify-center mx-auto mb-4" role="img" aria-label="video camera">
          <span className="text-[2rem]">🎥</span>
        </div>
        <h3 className="text-[clamp(1.125rem,3vw,1.5rem)] font-[weight._display] [color._on-surface] mb-2">
          No clip selected
        </h3>
        <p className="text-[color._on-surface-variant] text-[0.875rem] max-w-xs text-center">
          Select a clip to edit the visual framing
        </p>
      </section>
    );
  }

  const clipDuration = selectedClip.endSec - selectedClip.startSec;

  return (
    <section aria-labelledby="visual-editor-heading" className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <article className="bg-[color._surface] border border-[color._border] rounded-[16px] overflow-hidden">
            <header className="p-4 border-b border-[color._border]">
              <h3 id="visual-editor-heading" className="font-[weight._display] text-[color._on-surface] text-[1rem]">
                Visual Editor
              </h3>
            </header>

            <div className="p-4">
              <div className="aspect-video bg-[color._surface-variant] rounded-[12px] relative overflow-hidden mb-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[color._accent]/10 to-[color._surface-variant] flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-[3rem] mb-3" role="img" aria-label="video preview">📺</div>
                    <p className="font-[weight._display] text-[color._on-surface] text-[clamp(1rem,3vw,1.25rem)]">
                      {selectedClip.title}
                    </p>
                    <p className="text-[color._on-surface-variant] text-[0.8125rem] mt-2">
                      {selectedClip.startSec}s – {selectedClip.endSec}s ({clipDuration}s)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <fieldset className="border-0 p-0">
                  <legend className="text-[0.75rem] font-medium text-[color._on-surface-variant] uppercase tracking-wider mb-3">
                    Hook Mode
                  </legend>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Hook mode selection">
                    {[1, 2, 3].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setHookMode(mode)}
                        role="radio"
                        aria-checked={hookMode === mode}
                        className={`
                          inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                          text-[0.8125rem] font-medium transition-colors
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color._focus] focus-visible:ring-offset-2 focus-visible:ring-offset-[color._surface]
                          ${
                            hookMode === mode
                              ? 'bg-[color._accent] text-[color._on-accent]'
                              : 'bg-[color._surface-variant] text-[color._on-surface] hover:bg-[color._border]'
                          }
                        `}
                        style={{
                          minHeight: '40px',
                          transition: reducedMotion ? 'none' : 'all 0.15s ease'
                        }}
                      >
                        Mode {mode}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={splitScreen}
                    onChange={(e) => setSplitScreen(e.target.checked)}
                    className={`
                      w-4 h-4 rounded border-[color._border] bg-[color._surface-variant]
                      text-[color._accent] focus-visible:ring-2 focus-visible:ring-[color._focus] focus-visible:ring-offset-2
                      accent-[color._accent]
                    `}
                  />
                  <span className="text-[color._on-surface] text-[0.875rem]">2-person split-screen layout</span>
                </label>
              </div>
            </div>
          </article>
        </div>

        <aside aria-labelledby="clip-details-heading">
          <article className="bg-[color._surface] border border-[color._border] rounded-[16px] p-4 h-fit sticky top-[100px]">
            <header className="mb-4">
              <h3 id="clip-details-heading" className="font-[weight._display] text-[color._on-surface] text-[1rem]">
                Clip Details
              </h3>
            </header>

            <div className="space-y-4">
              <div>
                <label className="text-[0.6875rem] font-medium text-[color._on-surface-variant] uppercase tracking-wider block mb-1">
                  Title
                </label>
                <p className="text-[color._on-surface] font-medium text-[0.875rem] truncate">{selectedClip.title}</p>
              </div>

              <div>
                <label className="text-[0.6875rem] font-medium text-[color._on-surface-variant] uppercase tracking-wider block mb-1">
                  Time Range
                </label>
                <p className="font-mono text-[color._on-surface] text-[0.875rem] tabular-nums">
                  {selectedClip.startSec}s – {selectedClip.endSec}s
                </p>
              </div>

              <div>
                <label className="text-[0.6875rem] font-medium text-[color._on-surface-variant] uppercase tracking-wider block mb-2">
                  Virality Score
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[color._surface-variant] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[color._accent] rounded-full transition-all"
                      style={{
                        width: `${selectedClip.viralityScore}%`,
                        transition: reducedMotion ? 'none' : 'width 0.3s ease-out'
                      }}
                      role="progressbar"
                      aria-valuenow={selectedClip.viralityScore}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Virality score ${selectedClip.viralityScore} out of 100`}
                    />
                  </div>
                  <span className="font-[weight._display] text-[color._accent] text-[1.125rem] tabular-nums w-10 text-right">
                    {selectedClip.viralityScore}
                  </span>
                </div>
              </div>

              <details className="group">
                <summary className={`
                  text-[0.6875rem] font-medium text-[color._on-surface-variant] uppercase tracking-wider
                  cursor-pointer select-none list-none flex items-center justify-between
                  py-1
                `}>
                  Hook
                  <span className="text-[color._accent] transition-transform group-open:rotate-180" style={{
                    transform: reducedMotion ? 'none' : 'rotate(0deg)',
                    transition: reducedMotion ? 'none' : 'transform 0.2s ease'
                  }}>
                    ▼
                  </span>
                </summary>
                <div className="mt-1 pb-2 text-[0.8125rem] text-[color._on-surface] leading-relaxed animate-[slide-down_0.2s_ease-out]">
                  {selectedClip.hookSummary}
                </div>
              </details>

              <details className="group">
                <summary className={`
                  text-[0.6875rem] font-medium text-[color._on-surface-variant] uppercase tracking-wider
                  cursor-pointer select-none list-none flex items-center justify-between
                  py-1
                `}>
                  Payoff
                  <span className="text-[color._accent] transition-transform group-open:rotate-180" style={{
                    transform: reducedMotion ? 'none' : 'rotate(0deg)',
                    transition: reducedMotion ? 'none' : 'transform 0.2s ease'
                  }}>
                    ▼
                  </span>
                </summary>
                <div className="mt-1 pb-2 text-[0.8125rem] text-[color._on-surface] leading-relaxed animate-[slide-down_0.2s_ease-out]">
                  {selectedClip.payoffSummary}
                </div>
              </details>

              <details className="group">
                <summary className={`
                  text-[0.6875rem] font-medium text-[color._on-surface-variant] uppercase tracking-wider
                  cursor-pointer select-none list-none flex items-center justify-between
                  py-1
                `}>
                  Suggested Caption
                  <span className="text-[color._accent] transition-transform group-open:rotate-180" style={{
                    transform: reducedMotion ? 'none' : 'rotate(0deg)',
                    transition: reducedMotion ? 'none' : 'transform 0.2s ease'
                  }}>
                    ▼
                  </span>
                </summary>
                <div className="mt-2 p-3 bg-[color._surface-variant] rounded-lg text-[0.8125rem] text-[color._on-surface] leading-relaxed animate-[slide-down_0.2s_ease-out]">
                  {selectedClip.suggestedCaption}
                </div>
              </details>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

export default VisualEditor;