import React from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useReduceMotion } from '../../hooks/useReduceMotion';

export function Header() {
  const { currentProject, currentStep } = useProjectStore();
  const reducedMotion = useReduceMotion();

  const steps = [
    { label: 'Import', icon: '1', description: 'Import a video file or YouTube URL' },
    { label: 'Analyze', icon: '2', description: 'Run AI analysis to generate clips' },
    { label: 'Select', icon: '3', description: 'Review and select the best clip' },
    { label: 'Render', icon: '4', description: 'Edit and render your final clip' },
  ];

  return (
    <header
      className="bg-[color._surface] border-b border-[color._border] py-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
      data-testid="app-header"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 px-6">
        {/* App branding */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[color._accent] flex items-center justify-center">
            <span className="text-[color._on-accent] font-[weight._bold] text-[clamp(1rem,4vw,1.5rem)]" aria-hidden="true">
              ▶
            </span>
          </div>
          <div>
            <h1 className="font-[weight._bold] text-[clamp(1.5rem,6vw,2.5rem)] tracking-wider [color._on-surface]">
              REFRAME
            </h1>
            <p className="text-[color._on-surface-variant] text-[text-sm]">
              Video Clipping Studio
            </p>
          </div>
        </div>

        {/* Project info */}
        {currentProject && (
          <div className="flex items-center gap-3 text-[text-sm] text-[color._on-surface-variant]">
            <span>Project:</span>
            <span className="font-[weight._medium] text-[color._on-surface]">{currentProject.title}</span>
            <span>({currentProject.duration}s)</span>
          </div>
        )}

        {/* Step indicators */}
        <nav
          className="flex items-center gap-2 flex-wrap"
          aria-label="Progress steps"
          role="tablist"
        >
          {steps.map((step, index) => (
            <button
              key={step.label}
              role="tab"
              aria-selected={index === currentStep}
              aria-controls={`step-${index}`}
              aria-label={`${step.label} step, ${index === currentStep ? 'current' : index < currentStep ? 'completed' : 'not started'}`}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-[var(--radius-lg)] border border-[color._border]
                bg-transparent text-[text-sm] font-[weight._medium] transition-[color._background-color]-[var(--transition-normal)]
                [&[aria-selected="true"]]:bg-[color._accent] [&[aria-selected="true"]]:text-[color._on-accent]
                [&[aria-selected="false"]:not([aria-disabled="true"]):hover]:bg-[color._surface-variant]
                [&[aria-disabled="true"]]:opacity-50 [&[aria-disabled="true"]]:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color._focus] focus-visible:ring-offset-2
              `}
              disabled={index > currentStep}
              style={{
                transition: reducedMotion ? 'none' : 'all 0.2s ease',
                minHeight: '44px',
                minWidth: '44px'
              }}
            >
              <span className="w-5 h-5 flex-shrink-0 rounded-[var(--radius-sm)] bg-[color._surface] flex items-center justify-center text-[0.65rem]">
                {step.icon}
              </span>
              <span className="hidden sm:inline capitalize">{step.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}