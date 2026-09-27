import React, { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { api } from '../../lib/api';
import { useReduceMotion } from '../../hooks/useReduceMotion';

export function VideoImport() {
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setProgress, setProcessing, setCurrentProject, setCurrentStep, setError: storeError } = useProjectStore();
  const reducedMotion = useReduceMotion();

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsUploading(true);
    setError(null);
    setProgress(0.1, 'Downloading video...');

    try {
      const result = await api.importVideo(url);
      setProgress(0.5, 'Extracting subtitles...');

      const project = {
        id: result.sourceId,
        title: result.title || 'Untitled',
        duration: result.duration || 0,
        sourcePath: result.videoPath,
        status: 'uploaded' as const,
      };

      setCurrentProject(project);
      setProgress(0.8, 'Analyzing content...');
      setCurrentStep(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setError(message);
      storeError(message);
    } finally {
      setIsUploading(false);
      setProgress(1, 'Complete');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setProgress(0.1, 'Uploading file...');

    try {
      const result = await api.uploadFile(file);
      setProgress(0.5, 'Processing video...');

      const project = {
        id: result.sourceId,
        title: file.name.replace(/\.[^.]+$/, ''),
        duration: result.duration || 0,
        sourcePath: result.videoPath,
        status: 'uploaded' as const,
      };

      setCurrentProject(project);
      setProgress(0.8, 'Ready for analysis');
      setCurrentStep(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      storeError(message);
    } finally {
      setIsUploading(false);
      setProgress(1, 'Complete');
    }
  };

  return (
    <main className="flex-1 p-6 flex items-center justify-center" aria-labelledby="video-import-heading">
      <form onSubmit={handleUrlSubmit} className="w-full max-w-xl">
        <section
          className="bg-[color._surface] border border-[color._border] rounded-[var(--radius-xl)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
          style={{
            transition: reducedMotion ? 'none' : 'all 0.2s ease'
          }}
          aria-labelledby="video-import-heading video-import-description"
        >
          <header className="text-center mb-6">
            <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[color._accent-bg] flex items-center justify-center mx-auto mb-4">
              <span className="text-[color._accent] text-[1.5rem]" role="img" aria-label="video camera">🎬</span>
            </div>
            <h2 id="video-import-heading" className="text-[clamp(1.25rem,4vw,1.75rem)] font-[weight._bold] [color._on-surface] mb-2">
              Start a New Project
            </h2>
            <p id="video-import-description" className="text-[color._on-surface-variant] text-[text-sm]">
              Import a YouTube URL or upload a local video file
            </p>
          </header>

          <div className="space-y-5">
            <div className="flex gap-3">
              <label htmlFor="video-url" className="sr-only">
                YouTube or video URL
              </label>
              <input
                id="video-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 bg-[color._surface-variant] border border-[color._border] rounded-[var(--radius-lg)] px-[var(--space-4)] py-[var(--space-3)] text-[color._on-surface] placeholder-[color._on-surface-variant] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color._focus] focus-visible:ring-offset-[var(--space-2)] disabled:opacity-50 disabled:cursor-not-allowed transition-[color._background-color]-[var(--transition-normal)]"
                disabled={isUploading}
                autoComplete="url"
                required
                autoFocus
              />
              <button
                type="submit"
                disabled={isUploading || !url.trim()}
                className="inline-flex items-center justify-center gap-2 bg-[color._accent] hover:bg-[color._accent-hover] active:bg-[color._accent-pressed] disabled:opacity-50 disabled:cursor-not-allowed text-[color._on-accent] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-lg)] font-[weight._medium] transition-[color._background-color]-[var(--transition-normal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color._focus] focus-visible:ring-offset-[var(--space-2)]"
                style={{
                  minHeight: '44px',
                  minWidth: '44px'
                }}
              >
                {isUploading ? (
                  <>
                    <span className="inline-flex h-4 w-4 shrink-0 animate-spin border-2 border-current border-t-transparent rounded-full" aria-hidden="true"></span>
                    Importing…
                  </>
                ) : (
                  'Import'
                )}
              </button>
            </div>

            <div className="relative" role="separator" aria-orientation="horizontal" aria-label="or">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[color._border]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[color._surface] px-[var(--space-3)] text-[color._on-surface-variant] text-[text-xs]">or</span>
              </div>
            </div>

            <label htmlFor="video-file" className="block cursor-pointer">
              <span className="block text-[color._on-surface-variant] text-[text-sm] mb-2">Upload local video</span>
              <input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="sr-only"
              />
              <div
                className="flex items-center justify-center w-full py-[var(--space-4)] px-[var(--space-4)] rounded-[var(--radius-lg)] border-2 border-dashed border-[color._border] hover:border-[color._accent] hover:bg-[color._accent]/5 transition-[color._background-color]-[var(--transition-normal)] cursor-pointer focus-within:ring-2 focus-within:ring-[color._focus] focus-within:ring-offset-[var(--space-2)]"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    (e.currentTarget.querySelector('input') as HTMLInputElement)?.click();
                  }
                }}
              >
                <span className="inline-flex items-center gap-2 text-[color._on-surface-variant]">
                  <span className="w-4 h-4 flex-shrink-0" aria-hidden="true">📁</span>
                  <span>Choose video file</span>
                </span>
              </div>
            </label>

            {error && (
              <div
                role="alert"
                className="bg-[color._error-bg] border border-[color._error] rounded-[var(--radius-lg)] p-[var(--space-3)] text-[color._error] text-[text-sm] animate-[fade-in_0.2s_ease-out]"
                style={{
                  animation: reducedMotion ? 'none' : 'fade-in 0.2s ease-out'
                }}
              >
                {error}
              </div>
            )}
          </div>
        </section>
      </form>
    </main>
  );
}

export default VideoImport;