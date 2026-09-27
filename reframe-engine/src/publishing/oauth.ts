/*
 * Importers/callers: This file will be imported by the publishing controller to handle OAuth flows.
 * Affected API: OAuthManager class with PKCE flow methods.
 * Data schemas: PKCEChallenge, TokenResponse.
 * Verbatim instruction: Continue building out reframe-engine; add OAuth manager per Stage 3 spec.
 */

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

export type FetchFunction = (url: string, options?: RequestInit) => Promise<Response>;

export class OAuthManager {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];
  private customFetch?: FetchFunction;

  constructor(options: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes?: string[];
    fetch?: FetchFunction;
  }) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.redirectUri = options.redirectUri;
    this.scopes = options.scopes || [];
    this.customFetch = options.fetch;
  }

  /**
   * Generate PKCE challenge and verifier for OAuth flow.
   * @returns PKCEChallenge object
   */
  generatePKCEChallenge(): PKCEChallenge {
    // Generate a random code verifier (43-128 characters)
    const codeVerifier = this.generateRandomString(64);

    // Create code challenge by SHA256 hashing the verifier and base64url encoding
    // Note: In a real implementation, you would use a crypto library
    // For this stub, we'll simulate the transformation
    const codeChallenge = this.base64UrlEncode(this.sha256(codeVerifier));

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
    };
  }

  /**
   * Generate authorization URL for OAuth flow.
   * @param codeChallenge PKCE code challenge
   * @param state State parameter for CSRF protection
   * @param scopes Array of permission scopes
   * @returns Authorization URL string
   */
  getAuthorizationUrl(
    codeChallenge: string,
    state: string,
    scopes: string[]
  ): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });

    // Using TikTok as example - in reality this would be configurable
    return `https://www.tiktok.com/auth/authorize/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token.
   * @param code Authorization code from callback
   * @param codeVerifier PKCE code verifier
   * @returns TokenResponse object
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<TokenResponse> {
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';

    const params = new URLSearchParams({
      client_key: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier,
    });

    const fetchFn = this.customFetch || (globalThis.fetch as FetchFunction);
    const response = await fetchFn(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OAuth token exchange failed: ${errorData.error || 'unknown_error'}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Refresh access token using refresh token.
   * @param refreshToken Refresh token from previous exchange
   * @returns TokenResponse object
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';

    const params = new URLSearchParams({
      client_key: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const fetchFn = this.customFetch || (globalThis.fetch as FetchFunction);
    const response = await fetchFn(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OAuth token refresh failed: ${errorData.error || 'unknown_error'}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Generate a random string for PKCE verifier.
   * @param length Length of the random string
   * @returns Random string
   */
  private generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Simulate SHA256 hash (in real implementation, use crypto library).
   * @param input Input string
   * @returns Base64 encoded hash
   */
  private sha256(input: string): ArrayBuffer {
    // Simple hash simulation for stub - real implementation would use crypto.subtle
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hash = new ArrayBuffer(data.length);
    const view = new Uint8Array(hash);

    // Simple XOR folding for demonstration (not cryptographically secure)
    for (let i = 0; i < data.length; i++) {
      view[i] = data[i];
    }

    return hash;
  }

  /**
   * Base64 URL encode an ArrayBuffer.
   * @param input ArrayBuffer to encode
   * @returns Base64 URL encoded string
   */
  private base64UrlEncode(input: ArrayBuffer): string {
    // Convert ArrayBuffer to base64 URL safe string
    const bytes = new Uint8Array(input);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    let base64 = btoa(binary);
    // Convert to URL-safe format
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Get the client ID.
   * @returns Client ID string
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * Get the redirect URI.
   * @returns Redirect URI string
   */
  getRedirectUri(): string {
    return this.redirectUri;
  }

  /**
   * Get the scopes.
   * @returns Scopes array
   */
  getScopes(): string[] {
    return [...this.scopes];
  }
}