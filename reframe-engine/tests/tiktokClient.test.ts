/*
 * Importers/callers: This file will be imported by the test runner to verify TikTokClient functionality.
 * Affected API: TikTokClient class with upload methods.
 * Data schemas: UploadRequest, UploadResponse.
 * Verbatim instruction: Continue building out reframe-engine; add TikTok client test per Stage 3 spec.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TikTokClient } from '../src/publishing/tiktok/client';

describe('Stage 3: Multi-Account Publishing - TikTok Client', () => {
  let client: TikTokClient;

  beforeEach(() => {
    client = new TikTokClient('test-access-token');
  });

  it('should create a TikTokClient instance', () => {
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(TikTokClient);
  });

  it('should set and get access token', () => {
    expect(client.getAccessToken()).toBe('test-access-token');

    client.setAccessToken('new-token');
    expect(client.getAccessToken()).toBe('new-token');
  });

  it('should initialize video upload', async () => {
    const request: UploadRequest = {
      videoPath: 'output.mp4',
      title: 'Test Video',
      description: 'A test video description',
      tags: ['test'],
    };

    const result = await client.initVideoUpload(request);

    expect(result).toBeDefined();
    expect(result.uploadUrl).toBe('https://upload.tiktok.com/v1/upload');
    expect(result.uploadId).toMatch(/^upload_[a-z0-9]+$/);
  });

  it('should upload video file', async () => {
    (client as any).customFetch = vi.fn().mockResolvedValue({
      ok: true,
    });

    const result = await client.uploadVideo('https://upload.tiktok.com/v1/upload', 'output.mp4');

    expect(result).toBeDefined();
    expect(result.publishId).toBeDefined();
    expect(result.status).toBeDefined();
  });

  it('should check upload status', async () => {
    (client as any).customFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        publish_id: 'test-publish-id',
        status: 'SUCCESS',
      }),
    });

    const result = await client.checkStatus('test-publish-id');

    expect(result).toBeDefined();
    expect(result.publishId).toBe('test-publish-id');
    expect(result.status).toBe('SUCCESS');
  });

  it('should complete full upload flow', async () => {
    (client as any).customFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        upload_url: 'https://upload.tiktok.com/v1/upload',
        upload_id: 'test-upload-id',
      }),
    });

    const request: UploadRequest = {
      videoPath: 'output.mp4',
      title: 'Test Video',
      description: 'A test video description',
      tags: ['test'],
    };

    const result = await client.uploadAndPublish(request);

    expect(result).toBeDefined();
    expect(result.status).toBe('SUCCESS');
    expect(result.publishId).toBeDefined();
  });
});