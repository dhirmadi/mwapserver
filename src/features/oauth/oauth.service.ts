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

export class OAuthService {
  async exchangeCodeForTokens(
    code: string,
    provider: CloudProvider,
    redirectUri: string
  ): Promise<TokenResponse> {
    try {
      logInfo(`Exchanging OAuth code for tokens with provider ${provider.name}`);
      
      // Prepare token request based on provider's requirements
      const tokenRequest = {
        method: provider.tokenMethod,
        url: provider.tokenUrl,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams({
          grant_type: provider.grantType,
          code,
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
          redirect_uri: redirectUri
        }).toString()
      };
      
      // Make the token request
      const response = await axios(tokenRequest);
      
      logInfo(`Successfully exchanged code for tokens with provider ${provider.name}`);
      
      // Parse the response (handling different provider formats)
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        scopesGranted: response.data.scope ? response.data.scope.split(' ') : undefined
      };
    } catch (error) {
      logError('Token exchange failed', error);
      throw new ApiError('Failed to exchange code for tokens', 500);
    }
  }
  
  async refreshTokens(
    refreshToken: string,
    provider: CloudProvider
  ): Promise<TokenResponse> {
    try {
      logInfo(`Refreshing OAuth tokens with provider ${provider.name}`);
      
      // Prepare refresh token request
      const refreshRequest = {
        method: provider.tokenMethod,
        url: provider.tokenUrl,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: provider.clientId,
          client_secret: provider.clientSecret
        }).toString()
      };
      
      // Make the refresh request
      const response = await axios(refreshRequest);
      
      logInfo(`Successfully refreshed tokens with provider ${provider.name}`);
      
      // Parse the response
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken, // Some providers don't return a new refresh token
        expiresIn: response.data.expires_in,
        scopesGranted: response.data.scope ? response.data.scope.split(' ') : undefined
      };
    } catch (error) {
      logError('Token refresh failed', error);
      throw new ApiError('Failed to refresh tokens', 500);
    }
  }
}