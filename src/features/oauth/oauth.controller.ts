import { Request, Response } from 'express';
import { CloudIntegrationsService } from '../cloud-integrations/cloudIntegrations.service.js';
import { CloudProviderService } from '../cloud-providers/cloudProviders.service.js';
import { OAuthService } from './oauth.service.js';
import { OAuthCallbackSecurityService } from './oauthCallbackSecurity.service.js';
import { jsonResponse } from '../../utils/response.js';
import { logInfo, logError, logAudit } from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';
import { getUserFromToken } from '../../utils/auth.js';
import { logPublicRouteAccess } from '../../middleware/publicRoutes.js';

const cloudIntegrationsService = new CloudIntegrationsService();
const cloudProviderService = new CloudProviderService();
const oauthService = new OAuthService();
const oauthSecurityService = new OAuthCallbackSecurityService();

/**
 * Handle OAuth callback from cloud providers
 * This endpoint is called by the cloud provider after the user authorizes the application
 * 
 * Enhanced with comprehensive security controls:
 * - State parameter validation with timestamp and nonce verification
 * - Integration ownership verification
 * - Replay attack prevention
 * - Detailed audit logging
 * - Generic error messages for security
 */
export async function handleOAuthCallback(req: Request, res: Response) {
  const requestContext = {
    ip: req.ip || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    timestamp: Date.now()
  };

  // Initialize audit data
  const auditData: any = {
    ip: requestContext.ip,
    userAgent: requestContext.userAgent,
    timestamp: requestContext.timestamp,
    state: req.query.state as string,
    code: req.query.code as string,
    success: false,
    securityIssues: [] as string[]
  };

  try {
    logInfo('OAuth callback received', {
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      hasCode: !!req.query.code,
      hasState: !!req.query.state,
      hasError: !!req.query.error
    });

    // 1. Extract and validate parameters
    const { code, state, error, error_description } = req.query;
    
    // 2. Handle OAuth provider errors
    if (error) {
      auditData.errorCode = error as string;
      auditData.securityIssues.push(`OAuth provider error: ${error}`);
      
      await oauthSecurityService.logCallbackAttempt(auditData, {
        providerError: error,
        providerErrorDescription: error_description
      });
      
      // Use generic error message for security
      const errorResponse = oauthSecurityService.generateErrorResponse('PROVIDER_ERROR');
      return res.redirect(errorResponse.redirectUrl);
    }
    
    // 3. Validate required parameters
    if (!code || !state) {
      auditData.securityIssues.push('Missing required OAuth parameters');
      auditData.errorCode = 'MISSING_PARAMETERS';
      
      await oauthSecurityService.logCallbackAttempt(auditData);
      
      const errorResponse = oauthSecurityService.generateErrorResponse('INVALID_STATE');
      return res.redirect(errorResponse.redirectUrl);
    }
    
    // 4. Enhanced state parameter validation
    const stateValidation = await oauthSecurityService.validateStateParameter(
      state as string,
      requestContext
    );
    
    if (!stateValidation.isValid) {
      auditData.securityIssues.push(...(stateValidation.securityIssues || []));
      auditData.errorCode = stateValidation.errorCode;
      
      await oauthSecurityService.logCallbackAttempt(auditData);
      
      const errorResponse = oauthSecurityService.generateErrorResponse(
        stateValidation.errorCode || 'INVALID_STATE'
      );
      return res.redirect(errorResponse.redirectUrl);
    }
    
    const stateData = stateValidation.stateData!;
    
    // Update audit data with state information
    auditData.tenantId = stateData.tenantId;
    auditData.integrationId = stateData.integrationId;
    auditData.userId = stateData.userId;
    
    // 5. Verify integration ownership
    const ownershipValidation = await oauthSecurityService.verifyIntegrationOwnership(
      stateData,
      requestContext
    );
    
    if (!ownershipValidation.isValid) {
      auditData.securityIssues.push(...(ownershipValidation.securityIssues || []));
      auditData.errorCode = ownershipValidation.errorCode;
      
      await oauthSecurityService.logCallbackAttempt(auditData);
      
      const errorResponse = oauthSecurityService.generateErrorResponse(
        ownershipValidation.errorCode || 'VERIFICATION_ERROR'
      );
      return res.redirect(errorResponse.redirectUrl);
    }
    
    logInfo('OAuth callback security validation passed', {
      tenantId: stateData.tenantId,
      integrationId: stateData.integrationId,
      userId: stateData.userId,
      stateAge: requestContext.timestamp - stateData.timestamp
    });
    
    // 6. Get the integration and provider (already validated in ownership check)
    const integration = await cloudIntegrationsService.findById(
      stateData.integrationId,
      stateData.tenantId
    );
    const provider = await cloudProviderService.findById(
      integration.providerId.toString(),
      true
    );
    
    auditData.provider = provider.name;
    
    // 7. Build the redirect URI that was used for the authorization request
    const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/oauth/callback`;
    
    // 8. Exchange the code for tokens
    logInfo('Exchanging OAuth code for tokens', {
      provider: provider.name,
      tenantId: stateData.tenantId,
      integrationId: stateData.integrationId
    });
    
    const tokenResponse = await oauthService.exchangeCodeForTokens(
      code as string,
      provider,
      redirectUri
    );
    
    // 9. Update the integration with the tokens
    await cloudIntegrationsService.updateTokens(
      stateData.integrationId,
      stateData.tenantId,
      tokenResponse.accessToken,
      tokenResponse.refreshToken,
      tokenResponse.expiresIn,
      stateData.userId,
      tokenResponse.scopesGranted
    );
    
    // 10. Success - log audit and redirect
    auditData.success = true;
    
    await oauthSecurityService.logCallbackAttempt(auditData, {
      providerId: provider._id.toString(),
      scopesGranted: tokenResponse.scopesGranted,
      tokenExpiresIn: tokenResponse.expiresIn
    });
    
    logAudit('oauth.callback.success', stateData.userId, stateData.integrationId, {
      tenantId: stateData.tenantId,
      providerId: provider._id.toString(),
      provider: provider.name,
      scopesGranted: tokenResponse.scopesGranted,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent
    });
    
    // 11. Redirect to success page
    return res.redirect(`/oauth/success?tenantId=${stateData.tenantId}&integrationId=${stateData.integrationId}`);
    
  } catch (error) {
    // Handle unexpected errors with comprehensive logging
    auditData.securityIssues.push('Internal processing error');
    auditData.errorCode = 'INTERNAL_ERROR';
    
    logError('OAuth callback processing error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      tenantId: auditData.tenantId,
      integrationId: auditData.integrationId
    });
    
    await oauthSecurityService.logCallbackAttempt(auditData, {
      internalError: error instanceof Error ? error.message : String(error)
    });
    
    // Return generic error for security
    const errorResponse = oauthSecurityService.generateErrorResponse('VALIDATION_ERROR');
    return res.redirect(errorResponse.redirectUrl);
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