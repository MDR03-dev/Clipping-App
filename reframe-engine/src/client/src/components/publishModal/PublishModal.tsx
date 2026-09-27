import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';

export function PublishModal() {
  const { currentProject, selectedClip, clips } = useProjectStore();
  const [platform, setPlatform] = useState<'tiktok' | 'youtube'>('tiktok');
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedClip) return;

    let abort;
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 5;
      });
    }, 500);

    // In a real implementation, this would call the publish API
    // For now, simulate completion
    setTimeout(() => {
      setStatus('success');
      setProgress(100);
      setTimeout(() => setStatus('pending'), 3000);
    }, 3000);
  }, [selectedClip]);

  const handlePublish = async () => {
    if (!selectedClip || !currentProject) return;

    setStatus('pending');
    setProgress(0);
    setError(null);

    // In real implementation, this would call the publishing API
    // await api.publishVideo({ ... }, platform);
    setTimeout(() => {
      setStatus('success');
      setProgress(100);
      setTimeout(() => setStatus('pending'), 5000);
    }, 2000);
  };

  function closePublish() {
    setStatus('pending');
    setProgress(0);
    setError(null);
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e35] rounded-xl w-full max-w-sm mx-4 transform scale-100 transition-transform duration-300">
        <div className="flex items-center justify-between border-b border-[#2a2a45] px-6 py-4">
          <h3 className="font-anton text-xl text-white">
            {platform === 'tiktok' ? 'Publish to TikTok' : 'Publish to YouTube'}
          </h3>
          <button
            onClick={() => setPlatform(platform === 'tiktok' ? 'youtube' : 'tiktok')}
            className="text-sm text-[#a0a0b8] hover:text-white transition-colors"
          >
            {platform === 'tiktok' ? 'YouTube' : 'TikTok'}
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-xs text-[#a0a0b8] mb-1">Selected Clip</p>
            <p className="font-medium text-white">{selectedClip?.title}</p>
            <p className="text-xs text-[#a0a0b8]">
              {selectedClip.startSec}s - {selectedClip.endSec}s ({selectedClip.endSec - selectedClip.startSec}s)
            </p>
          </div>

          <div className="mb-4">
            <p className="text-xs text-[#a0a0b8] mb-1">Platform</p>
            <button
              onClick={() => setPlatform(platform === 'tiktok' ? 'youtube' : 'tiktok')}
              className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${platform === 'tiktok' ? 'bg-[#ff3b3b] text-white' : 'text-[#a0a0b8] hover:text-white'}`}
            >
              TikTok
            </button>
            <button
              onClick={() => setPlatform('youtube')}
              className="mt-2 w-full px-4 py-2 rounded text-sm font-medium transition-colors text-white bg-[#333] hover:bg-[#444]"
            >
              YouTube
            </button>
          </div>

          <div className="mb-4">
            <p className="text-xs text-[#a0a0b8] mb-1">Clip to Publish</p>
            <button
              className="w-full bg-[#ff3b3b] text-white text-sm font-medium rounded px-4 py-2 hover:bg-[#ff5555] transition-colors"
              onClick={() => handlePublish()}
              disabled={status !== 'pending'}
            >
              {status === 'pending' ? 'Publish Now' : status}
            </button>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a2a45]">
            <button
              onClick={() => closePublish()}
              className="text-[#a0a0b8] hover:text-white text-sm font-medium transition-colors"
              style={{ cursor: 'pointer' }}
            >
              Cancel
            </button>
            <span className="text-sm text-[#a0a0b8]">{status === 'pending' ? 'Publishing...' : status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublishModal;