import axios from 'axios';
import { CloudProvider } from '../../schemas/cloudProvider.schema.js';
import { logInfo, logError } from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scopesGranted?: string[];
}

/**
 * OAuth Service for handling token exchange and refresh operations
 * 
 * This service implements secure OAuth 2.0 token exchange following RFC 6749 standards:
 * - Uses HTTP Basic Authentication for client credentials (Section 2.3.1)
 * - Ensures redirect_uri exactly matches the authorization request
 * - Provides detailed but secure logging (omits sensitive data)
 * - Handles all common OAuth error scenarios gracefully
 * - Supports both Heroku-deployed and local HTTPS development environments
 */

export class OAuthService {
  /**
   * Exchange authorization code for access and refresh tokens
   * 
   * This method implements both traditional OAuth 2.0 authorization code flow (RFC 6749 Section 4.1.3)
   * and PKCE (Proof Key for Code Exchange) flow (RFC 7636). It automatically detects the flow type
   * based on the presence of codeVerifier parameter.
   * 
   * Traditional flow: Uses HTTP Basic Authentication with client credentials
   * PKCE flow: Uses code_verifier parameter instead of client secret
   * 
   * @param code - Authorization code received from OAuth provider
   * @param provider - Cloud provider configuration with client credentials
   * @param redirectUri - Redirect URI that must exactly match the authorization request
   * @param codeVerifier - Optional PKCE code verifier for public clients (RFC 7636)
   * @returns Promise<TokenResponse> - Access token, refresh token, and metadata
   * @throws ApiError - On authentication failures, network errors, or invalid responses
   */
  async exchangeCodeForTokens(
    code: string,
    provider: CloudProvider,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<TokenResponse> {
    const startTime = Date.now();
    
    try {
      const isPKCEFlow = !!codeVerifier;
      
      logInfo(`Exchanging OAuth code for tokens with provider ${provider.name}`, {
        provider: provider.name,
        providerId: provider._id.toString(),
        redirectUri,
        tokenUrl: provider.tokenUrl,
        grantType: provider.grantType,
        tokenMethod: provider.tokenMethod,
        flowType: isPKCEFlow ? 'PKCE' : 'traditional',
        hasCodeVerifier: isPKCEFlow,
        codeVerifierLength: codeVerifier?.length
      });
      
      // Prepare token request based on flow type
      let tokenRequest: any;
      
      if (isPKCEFlow) {
        // PKCE flow (RFC 7636) - use code_verifier instead of client secret
        logInfo('Using PKCE flow for token exchange', {
          provider: provider.name,
          codeVerifierLength: codeVerifier!.length
        });
        
        tokenRequest = {
          method: provider.tokenMethod,
          url: provider.tokenUrl,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'MWAP-OAuth-Client/1.0'
          },
          data: new URLSearchParams({
            grant_type: provider.grantType,
            code,
            redirect_uri: redirectUri,
            client_id: provider.clientId,
            code_verifier: codeVerifier!
          }).toString(),
          timeout: 30000, // 30 second timeout
          validateStatus: (status: number) => status < 500 // Don't throw on 4xx errors, we'll handle them
        };
      } else {
        // Traditional flow (RFC 6749) - use HTTP Basic Authentication with client credentials
        logInfo('Using traditional OAuth flow for token exchange', {
          provider: provider.name
        });
        
        const clientCredentials = Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64');
        
        tokenRequest = {
          method: provider.tokenMethod,
          url: provider.tokenUrl,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${clientCredentials}`,
            'User-Agent': 'MWAP-OAuth-Client/1.0'
          },
          data: new URLSearchParams({
            grant_type: provider.grantType,
            code,
            redirect_uri: redirectUri
          }).toString(),
          timeout: 30000, // 30 second timeout
          validateStatus: (status: number) => status < 500 // Don't throw on 4xx errors, we'll handle them
        };
      }
      
      logInfo('Making token exchange request', {
        provider: provider.name,
        url: provider.tokenUrl,
        method: provider.tokenMethod,
        flowType: isPKCEFlow ? 'PKCE' : 'traditional',
        hasBasicAuth: !isPKCEFlow,
        hasPKCE: isPKCEFlow,
        redirectUri,
        requestSize: tokenRequest.data.length
      });
      
      // Make the token request
      const response = await axios(tokenRequest);
      const duration = Date.now() - startTime;
      
      // Handle different HTTP status codes
      if (response.status >= 400) {
        const errorData = response.data || {};
        
        logError('Token exchange failed with client error', {
          provider: provider.name,
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          errorDescription: errorData.error_description,
          duration,
          redirectUri,
          // Security: Don't log the actual code or credentials
          codeLength: code.length,
          tokenUrl: provider.tokenUrl
        });
        
        // Provide specific error messages based on common OAuth error codes
        let errorMessage = 'Failed to exchange code for tokens';
        if (errorData.error === 'invalid_grant') {
          errorMessage = 'Authorization code is invalid or expired';
        } else if (errorData.error === 'invalid_client') {
          errorMessage = 'Client authentication failed';
        } else if (errorData.error === 'invalid_request') {
          errorMessage = 'Token request is malformed';
        } else if (errorData.error === 'unsupported_grant_type') {
          errorMessage = 'Grant type not supported by provider';
        }
        
        throw new ApiError(errorMessage, response.status);
      }
      
      // Validate response structure
      if (!response.data || !response.data.access_token) {
        logError('Token exchange returned invalid response structure', {
          provider: provider.name,
          status: response.status,
          hasData: !!response.data,
          hasAccessToken: !!(response.data && response.data.access_token),
          duration
        });
        throw new ApiError('Invalid token response from provider', 502);
      }
      
      logInfo(`Successfully exchanged code for tokens with provider ${provider.name}`, {
        provider: provider.name,
        flowType: isPKCEFlow ? 'PKCE' : 'traditional',
        duration,
        hasRefreshToken: !!response.data.refresh_token,
        expiresIn: response.data.expires_in,
        scopesGranted: response.data.scope ? response.data.scope.split(' ') : undefined,
        tokenType: response.data.token_type
      });
      
      // Parse the response (handling different provider formats)
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in || 3600, // Default to 1 hour if not provided
        scopesGranted: response.data.scope ? response.data.scope.split(' ') : undefined
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof ApiError) {
        // Re-throw ApiErrors as-is (they already have proper logging)
        throw error;
      }
      
      // Handle network and other errors
      if (axios.isAxiosError(error)) {
        logError('Token exchange network error', {
          provider: provider.name,
          duration,
          code: error.code,
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          isTimeout: error.code === 'ECONNABORTED',
          redirectUri,
          tokenUrl: provider.tokenUrl
        });
        
        if (error.code === 'ECONNABORTED') {
          throw new ApiError('Token exchange request timed out', 504);
        } else if (error.response?.status) {
          throw new ApiError(`Token exchange failed with status ${error.response.status}`, error.response.status);
        } else {
          throw new ApiError('Network error during token exchange', 502);
        }
      }
      
      // Handle unexpected errors
      logError('Unexpected error during token exchange', {
        provider: provider.name,
        duration,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        redirectUri,
        tokenUrl: provider.tokenUrl
      });
      
      throw new ApiError('Internal error during token exchange', 500);
    }
  }
  
  /**
   * Refresh OAuth access tokens using a refresh token
   * 
   * This method implements the OAuth 2.0 refresh token flow as specified
   * in RFC 6749 Section 6. It uses HTTP Basic Authentication for client
   * credentials to ensure secure token refresh operations.
   * 
   * @param refreshToken - Valid refresh token from previous authorization
   * @param provider - Cloud provider configuration with client credentials
   * @returns Promise<TokenResponse> - New access token and optionally new refresh token
   * @throws ApiError - On authentication failures, network errors, or invalid responses
   */
  async refreshTokens(
    refreshToken: string,
    provider: CloudProvider
  ): Promise<TokenResponse> {
    const startTime = Date.now();
    
    try {
      logInfo(`Refreshing OAuth tokens with provider ${provider.name}`, {
        provider: provider.name,
        providerId: provider._id.toString(),
        tokenUrl: provider.tokenUrl,
        tokenMethod: provider.tokenMethod
      });
      
      // Prepare client credentials for HTTP Basic Authentication
      const clientCredentials = Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64');
      
      // Prepare refresh token request
      const refreshRequest = {
        method: provider.tokenMethod,
        url: provider.tokenUrl,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${clientCredentials}`,
          'User-Agent': 'MWAP-OAuth-Client/1.0'
        },
        data: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }).toString(),
        timeout: 30000, // 30 second timeout
        validateStatus: (status: number) => status < 500 // Don't throw on 4xx errors, we'll handle them
      };
      
      logInfo('Making token refresh request', {
        provider: provider.name,
        url: provider.tokenUrl,
        method: provider.tokenMethod,
        hasBasicAuth: true,
        requestSize: refreshRequest.data.length
      });
      
      // Make the refresh request
      const response = await axios(refreshRequest);
      const duration = Date.now() - startTime;
      
      // Handle different HTTP status codes
      if (response.status >= 400) {
        const errorData = response.data || {};
        
        logError('Token refresh failed with client error', {
          provider: provider.name,
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          errorDescription: errorData.error_description,
          duration,
          tokenUrl: provider.tokenUrl
        });
        
        // Provide specific error messages based on common OAuth error codes
        let errorMessage = 'Failed to refresh tokens';
        if (errorData.error === 'invalid_grant') {
          errorMessage = 'Refresh token is invalid or expired';
        } else if (errorData.error === 'invalid_client') {
          errorMessage = 'Client authentication failed during refresh';
        } else if (errorData.error === 'invalid_request') {
          errorMessage = 'Token refresh request is malformed';
        }
        
        throw new ApiError(errorMessage, response.status);
      }
      
      // Validate response structure
      if (!response.data || !response.data.access_token) {
        logError('Token refresh returned invalid response structure', {
          provider: provider.name,
          status: response.status,
          hasData: !!response.data,
          hasAccessToken: !!(response.data && response.data.access_token),
          duration
        });
        throw new ApiError('Invalid token refresh response from provider', 502);
      }
      
      logInfo(`Successfully refreshed tokens with provider ${provider.name}`, {
        provider: provider.name,
        duration,
        hasNewRefreshToken: !!response.data.refresh_token,
        expiresIn: response.data.expires_in,
        scopesGranted: response.data.scope ? response.data.scope.split(' ') : undefined,
        tokenType: response.data.token_type
      });
      
      // Parse the response
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken, // Some providers don't return a new refresh token
        expiresIn: response.data.expires_in || 3600, // Default to 1 hour if not provided
        scopesGranted: response.data.scope ? response.data.scope.split(' ') : undefined
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof ApiError) {
        // Re-throw ApiErrors as-is (they already have proper logging)
        throw error;
      }
      
      // Handle network and other errors
      if (axios.isAxiosError(error)) {
        logError('Token refresh network error', {
          provider: provider.name,
          duration,
          code: error.code,
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          isTimeout: error.code === 'ECONNABORTED',
          tokenUrl: provider.tokenUrl
        });
        
        if (error.code === 'ECONNABORTED') {
          throw new ApiError('Token refresh request timed out', 504);
        } else if (error.response?.status) {
          throw new ApiError(`Token refresh failed with status ${error.response.status}`, error.response.status);
        } else {
          throw new ApiError('Network error during token refresh', 502);
        }
      }
      
      // Handle unexpected errors
      logError('Unexpected error during token refresh', {
        provider: provider.name,
        duration,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        tokenUrl: provider.tokenUrl
      });
      
      throw new ApiError('Internal error during token refresh', 500);
    }
  }

  /**
   * Generate OAuth authorization URL for initiating the OAuth flow
   * 
   * This method creates the authorization URL that users visit to grant permissions
   * to the application. It ensures the redirect_uri is constructed consistently
   * with the callback handler to prevent redirect URI mismatch errors.
   * 
   * @param provider - Cloud provider configuration
   * @param state - Cryptographically secure state parameter for CSRF protection
   * @param redirectUri - Redirect URI that must exactly match the callback endpoint
   * @returns string - Complete authorization URL for the OAuth provider
   */
  generateAuthorizationUrl(
    provider: CloudProvider,
    state: string,
    redirectUri: string
  ): string {
    try {
      logInfo(`Generating OAuth authorization URL for provider ${provider.name}`, {
        provider: provider.name,
        providerId: provider._id.toString(),
        authUrl: provider.authUrl,
        redirectUri,
        scopes: provider.scopes?.join(' ') || 'default'
      });

      // Build authorization URL parameters
      const params = new URLSearchParams({
        client_id: provider.clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        state: state
      });

      // Add scopes if available
      if (provider.scopes && provider.scopes.length > 0) {
        params.set('scope', provider.scopes.join(' '));
      }

      // Add any provider-specific parameters
      if (provider.name.toLowerCase() === 'dropbox') {
        // Dropbox-specific parameters
        params.set('token_access_type', 'offline'); // Request refresh token
      } else if (provider.name.toLowerCase() === 'google') {
        // Google-specific parameters
        params.set('access_type', 'offline'); // Request refresh token
        params.set('prompt', 'consent'); // Force consent screen to get refresh token
      }

      const authorizationUrl = `${provider.authUrl}?${params.toString()}`;

      logInfo('OAuth authorization URL generated successfully', {
        provider: provider.name,
        redirectUri,
        urlLength: authorizationUrl.length,
        hasScopes: !!(provider.scopes && provider.scopes.length > 0)
      });

      return authorizationUrl;
    } catch (error) {
      logError('Failed to generate OAuth authorization URL', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        provider: provider.name,
        redirectUri
      });
      
      throw new ApiError('Failed to generate authorization URL', 500);
    }
  }
}