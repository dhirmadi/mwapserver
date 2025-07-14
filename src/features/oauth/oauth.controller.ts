import { Request, Response } from 'express';
import { CloudIntegrationsService } from '../cloud-integrations/cloudIntegrations.service.js';
import { CloudProviderService } from '../cloud-providers/cloudProviders.service.js';
import { OAuthService } from './oauth.service.js';
import { jsonResponse } from '../../utils/response.js';
import { logInfo, logError, logAudit } from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';
import { getUserFromToken } from '../../utils/auth.js';

const cloudIntegrationsService = new CloudIntegrationsService();
const cloudProviderService = new CloudProviderService();
const oauthService = new OAuthService();

/**
 * Handle OAuth callback from cloud providers
 * This endpoint is called by the cloud provider after the user authorizes the application
 */
export async function handleOAuthCallback(req: Request, res: Response) {
  try {
    // 1. Extract parameters from the request
    const { code, state, error, error_description } = req.query;
    
    // 2. Handle OAuth errors
    if (error) {
      logError(`OAuth error: ${error}${error_description ? ` - ${error_description}` : ''}`);
      return res.redirect(`/oauth/error?message=${encodeURIComponent(error as string)}`);
    }
    
    if (!code || !state) {
      logError('Missing code or state parameter in OAuth callback');
      return res.redirect('/oauth/error?message=Missing+required+parameters');
    }
    
    // 3. Parse and validate state parameter
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch (error) {
      logError('Failed to parse state parameter', error);
      return res.redirect('/oauth/error?message=Invalid+state+parameter');
    }
    
    const { tenantId, integrationId, userId } = stateData;
    
    if (!tenantId || !integrationId || !userId) {
      logError('Invalid state parameter: missing required fields');
      return res.redirect('/oauth/error?message=Invalid+state+parameter');
    }
    
    logInfo(`Processing OAuth callback for integration ${integrationId} in tenant ${tenantId}`);
    
    // 4. Get the integration and provider
    const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
    const provider = await cloudProviderService.findById(integration.providerId.toString(), true);
    
    // 5. Build the redirect URI that was used for the authorization request
    const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/oauth/callback`;
    
    // 6. Exchange the code for tokens
    const tokenResponse = await oauthService.exchangeCodeForTokens(
      code as string,
      provider,
      redirectUri
    );
    
    // 7. Update the integration with the tokens
    await cloudIntegrationsService.updateTokens(
      integrationId,
      tenantId,
      tokenResponse.accessToken,
      tokenResponse.refreshToken,
      tokenResponse.expiresIn,
      userId,
      tokenResponse.scopesGranted
    );
    
    logAudit('oauth.callback.success', userId, integrationId, {
      tenantId,
      providerId: provider._id.toString()
    });
    
    // 8. Redirect to success page
    return res.redirect(`/oauth/success?tenantId=${tenantId}&integrationId=${integrationId}`);
  } catch (error) {
    logError('OAuth callback error', error);
    return res.redirect('/oauth/error?message=Failed+to+process+OAuth+callback');
  }
}

/**
 * Manually refresh OAuth tokens for an integration
 * This endpoint is called by the frontend when tokens need to be refreshed
 */
export async function refreshIntegrationTokens(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId, integrationId } = req.params;
    
    logInfo(`Manually refreshing tokens for integration ${integrationId} in tenant ${tenantId}`);
    
    // 1. Get the integration and provider
    const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
    const provider = await cloudProviderService.findById(integration.providerId.toString(), true);
    
    if (!integration.refreshToken) {
      throw new ApiError('Integration does not have a refresh token', 400);
    }
    
    // 2. Refresh the tokens
    const tokenResponse = await oauthService.refreshTokens(
      integration.refreshToken,
      provider
    );
    
    // 3. Update the integration with the new tokens
    const updatedIntegration = await cloudIntegrationsService.updateTokens(
      integrationId,
      tenantId,
      tokenResponse.accessToken,
      tokenResponse.refreshToken,
      tokenResponse.expiresIn,
      user.sub,
      tokenResponse.scopesGranted
    );
    
    logAudit('oauth.tokens.refresh', user.sub, integrationId, {
      tenantId,
      providerId: provider._id.toString()
    });
    
    // 4. Return the updated integration
    return jsonResponse(res, 200, {
      ...updatedIntegration,
      accessToken: '[REDACTED]',
      refreshToken: '[REDACTED]'
    });
  } catch (error) {
    logError('Token refresh error', error);
    throw error;
  }
}