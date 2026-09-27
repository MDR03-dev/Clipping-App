/*
 * Importers/callers: This file will be imported by the test runner to verify YouTubeClient functionality.
 * Affected API: YouTubeClient class with upload methods.
 * Data schemas: UploadRequest, UploadResponse.
 * Verbatim instruction: Continue building out reframe-engine; add YouTube client test per Stage 3 spec.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YouTubeClient } from '../src/publishing/youtube/client';

describe('Stage 3: Multi-Account Publishing - YouTube Client', () => {
  let client: YouTubeClient;

  beforeEach(() => {
    client = new YouTubeClient('test-access-token');
  });

  it('should create a YouTubeClient instance', () => {
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(YouTubeClient);
  });

  it('should set and get access token', () => {
    expect(client.getAccessToken()).toBe('test-access-token');

    client.setAccessToken('new-token');
    expect(client.getAccessToken()).toBe('new-token');
  });

  it('should upload video to YouTube', async () => {
    (client as any).customFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'test-video-id',
        status: { uploadStatus: 'uploaded' },
      }),
    });

    const request: UploadRequest = {
      videoPath: 'output.mp4',
      title: 'Test Video',
      description: 'A test video description',
      tags: ['test'],
    };

    const result = await client.uploadVideo(request);

    expect(result).toBeDefined();
    expect(result.videoId).toMatch(/^video_[a-z0-9]+$/);
    expect(result.status).toBeDefined();
  });
});