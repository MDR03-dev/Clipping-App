/*
 * Importers/callers: This file will be imported by the test runner to verify OAuthManager functionality.
 * Affected API: OAuthManager class with PKCE flow methods.
 * Data schemas: PKCEChallenge, TokenResponse.
 * Verbatim instruction: Continue building out reframe-engine; add OAuth test per Stage 3 spec.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthManager } from '../src/publishing/oauth';

describe('Stage 3: Multi-Account Publishing - OAuth', () => {
  let oauth: OAuthManager;

  beforeEach(() => {
    oauth = new OAuthManager({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback',
      fetch: vi.fn() as any,
    });
  });

  it('should create an OAuthManager instance', () => {
    expect(oauth).toBeDefined();
    expect(oauth).toBeInstanceOf(OAuthManager);
  });

  it('should generate PKCE challenge and verifier', () => {
    const challenge = oauth.generatePKCEChallenge();

    expect(challenge).toBeDefined();
    expect(challenge.codeVerifier).toBeDefined();
    expect(challenge.codeChallenge).toBeDefined();
    expect(challenge.codeChallengeMethod).toBe('S256');
    expect(challenge.codeVerifier.length).toBeGreaterThan(40);
    expect(challenge.codeChallenge.length).toBeGreaterThan(40);
  });

  it('should generate authorization URL with PKCE', () => {
    const challenge = oauth.generatePKCEChallenge();
    const authUrl = oauth.getAuthorizationUrl(challenge.codeChallenge, 'test-state', ['user.info.basic', 'video.upload']);

    expect(authUrl).toContain('client_id=test-client-id');
    expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
    expect(authUrl).toContain('response_type=code');
    expect(authUrl).toContain('code_challenge=');
    expect(authUrl).toContain('code_challenge_method=S256');
    expect(authUrl).toContain('state=test-state');
    // scope can be URL-encoded space (%20) or + (form-encoded), both are valid
    expect(authUrl).toMatch(/scope=user\.info\.basic(.|\+)video\.upload/);
  });

  it('should exchange code for tokens', async () => {
    // Mock fetch response
    (oauth as any).customFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'user.info.basic video.upload',
      }),
    });

    const challenge = oauth.generatePKCEChallenge();
    const tokens = await oauth.exchangeCodeForTokens('test-auth-code', challenge.codeVerifier);

    expect(tokens).toBeDefined();
    expect(tokens.accessToken).toBe('test-access-token');
    expect(tokens.refreshToken).toBe('test-refresh-token');
    expect(tokens.expiresIn).toBe(3600);
    expect(tokens.tokenType).toBe('Bearer');
    expect(tokens.scope).toBe('user.info.basic video.upload');
  });

  it('should refresh access token', async () => {
    (oauth as any).customFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'user.info.basic video.upload',
      }),
    });

    const tokens = await oauth.refreshAccessToken('test-refresh-token');

    expect(tokens).toBeDefined();
    expect(tokens.accessToken).toBe('new-access-token');
    expect(tokens.refreshToken).toBe('new-refresh-token');
  });

  it('should handle token exchange errors', async () => {
    (oauth as any).customFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'invalid_grant',
        error_description: 'Invalid authorization code',
      }),
    });

    const challenge = oauth.generatePKCEChallenge();
    await expect(oauth.exchangeCodeForTokens('invalid-code', challenge.codeVerifier))
      .rejects.toThrow('OAuth token exchange failed: invalid_grant');
  });

  it('should handle refresh token errors', async () => {
    (oauth as any).customFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'invalid_grant',
        error_description: 'Refresh token expired',
      }),
    });

    await expect(oauth.refreshAccessToken('expired-refresh-token'))
      .rejects.toThrow('OAuth token refresh failed: invalid_grant');
  });
});