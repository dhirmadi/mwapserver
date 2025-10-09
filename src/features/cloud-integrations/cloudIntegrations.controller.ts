import { Request, Response } from 'express';
import { CloudIntegrationsService } from './cloudIntegrations.service.js';
import { validateWithSchema } from '../../utils/validate.js';
import { z } from 'zod';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';
import { ApiError } from '../../utils/errors.js';
import { 
  createCloudProviderIntegrationSchema, 
  updateCloudProviderIntegrationSchema, 
  CloudProviderIntegrationErrorCodes 
} from '../../schemas/cloudProviderIntegration.schema.js';
import type { CreateCloudProviderIntegrationRequest, UpdateCloudProviderIntegrationRequest } from '../../schemas/cloudProviderIntegration.schema.js';
import { logInfo, logError, logAudit } from '../../utils/logger.js';
import { CloudProviderService } from '../cloud-providers/cloudProviders.service.js';
import { OAuthService } from '../oauth/oauth.service.js';
import axios from 'axios';
import { decrypt, encrypt } from '../../utils/encryption.js';

const cloudIntegrationsService = new CloudIntegrationsService();
const cloudProviderService = new CloudProviderService();
const oauthService = new OAuthService();

/**
 * Get all integrations for a tenant
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function getTenantIntegrations(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId } = req.params;
  
  logInfo(`Fetching integrations for tenant ${tenantId} by user ${user.sub}`);
  
  const integrations = await cloudIntegrationsService.findByTenantId(tenantId);
  
  logInfo(`Found ${integrations.length} integrations for tenant ${tenantId}`);
  
  // Redact sensitive tokens in responses
  const sanitized = integrations.map((integration: any) => ({
    ...integration,
    accessToken: integration.accessToken ? '[REDACTED]' : undefined,
    refreshToken: integration.refreshToken ? '[REDACTED]' : undefined
  }));
  
  return jsonResponse(res, 200, sanitized);
}

/**
 * Get a specific integration by ID
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function getTenantIntegrationById(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId, integrationId } = req.params;
  
  logInfo(`Fetching integration ${integrationId} for tenant ${tenantId} by user ${user.sub}`);
  
  const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
  
  logInfo(`Found integration ${integrationId} for tenant ${tenantId}`);
  
  const response = {
    ...integration,
    accessToken: integration.accessToken ? '[REDACTED]' : undefined,
    refreshToken: integration.refreshToken ? '[REDACTED]' : undefined
  };
  
  return jsonResponse(res, 200, response);
}

/**
 * Create a new integration for a tenant
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function createTenantIntegration(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId } = req.params;
    
    logInfo(`Creating new integration for tenant ${tenantId} by user ${user.sub}`);
    
    // Add tenantId from URL parameters to the request body
    const requestWithTenantId = {
      ...req.body,
      tenantId: tenantId
    };
    
    try {
      const dataParsed = validateWithSchema(createCloudProviderIntegrationSchema, requestWithTenantId);
      const data: CreateCloudProviderIntegrationRequest = {
        status: (dataParsed.status ?? 'active') as 'active' | 'expired' | 'revoked' | 'error',
        providerId: dataParsed.providerId,
        tenantId: dataParsed.tenantId,
        scopesGranted: dataParsed.scopesGranted,
        metadata: dataParsed.metadata
      };
      const integration = await cloudIntegrationsService.create(tenantId, data, user.sub);
      
      logInfo(`Created new integration for tenant ${tenantId} with provider ${data.providerId}`);
      
      // Remove sensitive data from response
      const response = {
        ...integration,
        accessToken: integration.accessToken ? '[REDACTED]' : undefined,
        refreshToken: integration.refreshToken ? '[REDACTED]' : undefined
      };
      
      return jsonResponse(res, 201, response);
    } catch (validationError) {
      throw validationError;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logInfo(`Validation error when creating integration: ${error.message}`);
      throw new ApiError('Invalid input', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    logError(`Error creating integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Update an existing integration
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function updateTenantIntegration(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId, integrationId } = req.params;
    
    logInfo(`Updating integration ${integrationId} for tenant ${tenantId} by user ${user.sub}`);
    
    const data: UpdateCloudProviderIntegrationRequest = validateWithSchema(updateCloudProviderIntegrationSchema, req.body);
    const integration = await cloudIntegrationsService.update(integrationId, tenantId, data, user.sub);
    
    logInfo(`Updated integration ${integrationId} for tenant ${tenantId}`);
    
    // Remove sensitive data from response
    const response = {
      ...integration,
      accessToken: integration.accessToken ? '[REDACTED]' : undefined,
      refreshToken: integration.refreshToken ? '[REDACTED]' : undefined
    };
    
    return jsonResponse(res, 200, response);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logInfo(`Validation error when updating integration: ${error.message}`);
      throw new ApiError('Invalid input', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    logError(`Error updating integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Delete an integration
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function deleteTenantIntegration(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId, integrationId } = req.params;
  
  logInfo(`Deleting integration ${integrationId} for tenant ${tenantId} by user ${user.sub}`);
  
  await cloudIntegrationsService.delete(integrationId, tenantId, user.sub);
  
  logInfo(`Deleted integration ${integrationId} for tenant ${tenantId}`);
  
  return jsonResponse(res, 204);
}

/**
 * Refresh OAuth tokens for an integration
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function refreshIntegrationToken(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId, integrationId } = req.params;
    
    logInfo(`Refreshing tokens for integration ${integrationId} in tenant ${tenantId} by user ${user.sub}`);
    
    // 1. Get the integration and provider
    const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
    const provider = await cloudProviderService.findById(integration.providerId.toString(), true);
    
    if (!integration.refreshToken) {
      throw new ApiError('Integration does not have a refresh token', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    
    // 2. Refresh the tokens using OAuth service
    const decryptedRefresh = decrypt(integration.refreshToken);
    const tokenResponse = await oauthService.refreshTokens(
      decryptedRefresh,
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
    
    logAudit('integration.tokens.refresh', user.sub, integrationId, {
      tenantId,
      providerId: provider._id.toString()
    });
    
    // 4. Return success response with sanitized data
    return jsonResponse(res, 200, {
      success: true,
      data: {
        ...updatedIntegration,
        accessToken: '[REDACTED]',
        refreshToken: '[REDACTED]'
      }
    });
  } catch (error) {
    logError('Token refresh error', error);
    throw error;
  }
}

/**
 * Check the health status of an integration
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function checkIntegrationHealth(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId, integrationId } = req.params;
    
    logInfo(`Checking health for integration ${integrationId} in tenant ${tenantId} by user ${user.sub}`);
    
    // Get the integration health status
    const healthStatus = await cloudIntegrationsService.checkIntegrationHealth(integrationId, tenantId);
    
    logInfo(`Health check completed for integration ${integrationId}: ${healthStatus.status}`);
    
    return jsonResponse(res, 200, healthStatus);
  } catch (error) {
    logError('Integration health check error', error);
    throw error;
  }
}

/**
 * Test integration connectivity and token validity (with optional one-time refresh retry)
 */
export async function testIntegrationConnectivity(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId, integrationId } = req.params;

  logInfo(`Testing integration connectivity ${integrationId} for tenant ${tenantId} by user ${user.sub}`);

  const startedAt = Date.now();
  try {
    // 1) Load integration and verify tenant ownership
    const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
    const provider = await cloudProviderService.findById(integration.providerId.toString(), true);

    // 2) Decrypt tokens
    const accessToken = integration.accessToken ? decrypt(integration.accessToken) : '';
    const refreshToken = integration.refreshToken ? decrypt(integration.refreshToken) : '';

    if (!accessToken) {
      return res.status(200).json({
        success: false,
        details: {
          tokenValid: false,
          apiReachable: false,
          scopesValid: false
        },
        error: 'Missing access token'
      });
    }

    const doDropboxTest = async (token: string) => {
      const t0 = Date.now();
      try {
        // Dropbox API expects POST with no body but application/json Content-Type
        const resp = await axios({
          method: 'POST',
          url: 'https://api.dropboxapi.com/2/users/get_current_account',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: null, // Explicitly null to prevent axios from setting form-urlencoded
          timeout: 5000,
          validateStatus: () => true
        });
        const ms = Date.now() - t0;
        if (resp.status === 200) {
          return { tokenValid: true, apiReachable: true, scopesValid: true, responseTime: ms };
        }
        if (resp.status === 401) {
          return { tokenValid: false, apiReachable: true, scopesValid: false, responseTime: ms, authError: true } as any;
        }
        if (resp.status === 403) {
          return { tokenValid: true, apiReachable: true, scopesValid: false, responseTime: ms, scopeError: true } as any;
        }
        if (resp.status === 409 || resp.status === 429) {
          return { tokenValid: false, apiReachable: true, scopesValid: false, responseTime: ms, rateLimited: true } as any;
        }
        return { tokenValid: false, apiReachable: true, scopesValid: false, responseTime: ms };
      } catch (err: any) {
        const ms = Date.now() - t0;
        const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
        return { tokenValid: false, apiReachable: false, scopesValid: false, responseTime: ms, networkError: true, timeout: isTimeout } as any;
      }
    };

    const providerName = (provider.name || provider.slug || '').toLowerCase();
    if (providerName !== 'dropbox' && provider.slug?.toLowerCase() !== 'dropbox') {
      throw new ApiError('Unsupported provider for test endpoint', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }

    let details: any = await doDropboxTest(accessToken);

    // 4) One-time refresh retry on 401/403
    if (details.authError && refreshToken) {
      try {
        const params = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        });
        const basic = Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64');
        const refreshResp = await axios.post(
          'https://api.dropboxapi.com/oauth2/token',
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${basic}`
            },
            timeout: 10000,
            validateStatus: () => true
          }
        );
        if (refreshResp.status === 200 && refreshResp.data?.access_token) {
          const newAccess = refreshResp.data.access_token as string;
          const newRefresh = refreshResp.data.refresh_token as string | undefined;
          const expiresIn = Number(refreshResp.data.expires_in || 0);
          await cloudIntegrationsService.updateTokens(
            integrationId,
            tenantId,
            newAccess,
            newRefresh || '',
            expiresIn,
            user.sub,
            undefined
          );
          details = await doDropboxTest(newAccess);
          await cloudIntegrationsService.update(integrationId, tenantId, { status: details.tokenValid ? 'active' : 'error' } as any, user.sub);
        } else {
          await cloudIntegrationsService.update(integrationId, tenantId, { status: 'error' } as any, user.sub);
          return res.status(200).json({
            success: false,
            details: {
              tokenValid: Boolean(details.tokenValid),
              apiReachable: Boolean(details.apiReachable),
              scopesValid: Boolean(details.scopesValid),
              ...(details.responseTime != null ? { responseTime: details.responseTime } : {})
            },
            error: 'Refresh token invalid or expired; reconnect required'
          });
        }
      } catch {
        await cloudIntegrationsService.update(integrationId, tenantId, { status: 'error' } as any, user.sub);
        return res.status(200).json({
          success: false,
          details: {
            tokenValid: Boolean(details.tokenValid),
            apiReachable: Boolean(details.apiReachable),
            scopesValid: Boolean(details.scopesValid),
            ...(details.responseTime != null ? { responseTime: details.responseTime } : {})
          },
          error: 'Refresh token invalid or expired; reconnect required'
        });
      }
    }

    // 5) Persist minor state based on final details
    await cloudIntegrationsService.update(integrationId, tenantId, { status: details.tokenValid ? 'active' : 'error' } as any, user.sub);

    // 6) Return result
    const totalMs = Date.now() - startedAt;
    const successEval = Boolean(details.tokenValid && details.apiReachable && details.scopesValid);
    const base: any = {
      success: successEval,
      details: {
        tokenValid: Boolean(details.tokenValid),
        apiReachable: Boolean(details.apiReachable),
        scopesValid: Boolean(details.scopesValid),
        responseTime: details.responseTime ?? totalMs
      }
    };
    if (details.rateLimited) base.error = 'Provider rate limit exceeded; retry later';
    if (details.networkError) base.error = 'Provider unreachable (timeout)';
    return res.status(200).json(base);
  } catch (error) {
    logError('Integration test error', error as any);
    throw error;
  }
}

// ===== Folder Browsing Endpoint =====

const browseQuerySchema = z.object({
  containerId: z.string().trim().min(1).optional(),
  folderId: z.string().trim().min(1).optional(),
  path: z.string().trim().optional(),
  cursor: z.string().trim().optional()
}).transform((v) => ({
  containerId: v.containerId,
  folderId: v.folderId,
  cursor: v.cursor,
  path: (v.path && v.path.length > 0 ? v.path : '/')
})).refine((v) => v.path.startsWith('/'), { message: 'path must start with "/"', path: ['path'] });

type BrowseQuery = { containerId?: string; folderId?: string; cursor?: string; path: string };

interface FolderItem {
  id: string;
  name: string;
  path: string;
  isFolder: true;
  isContainer?: boolean;
}

interface ListResult {
  items: FolderItem[];
  nextCursor?: string | null;
}

interface ProviderCapabilities {
  supportsPath: boolean;
  supportsId: boolean;
  supportsContainers: boolean;
  maxPageSize: number | null;
}

interface ProviderContext {
  accessToken: string;
  provider: any;
}

interface ProviderAdapter {
  listContainers(ctx: ProviderContext, cursor?: string | undefined): Promise<ListResult>;
  listFoldersById(ctx: ProviderContext, containerId: string, folderId: string, cursor?: string | undefined): Promise<ListResult>;
  listFoldersByPath(ctx: ProviderContext, containerId: string | undefined, path: string, cursor?: string | undefined): Promise<ListResult>;
  capabilities(): ProviderCapabilities;
}

class DropboxAdapter implements ProviderAdapter {
  capabilities(): ProviderCapabilities {
    return { supportsPath: true, supportsId: false, supportsContainers: false, maxPageSize: null };
  }
  async listContainers(_ctx: ProviderContext): Promise<ListResult> {
    return { items: [], nextCursor: null };
  }
  async listFoldersById(_ctx: ProviderContext, _containerId: string, _folderId: string): Promise<ListResult> {
    throw new ApiError('Provider does not support id-based folder listing', 400, 'capability/not-supported');
  }
  async listFoldersByPath(ctx: ProviderContext, _containerId: string | undefined, path: string, cursor?: string): Promise<ListResult> {
    const listUrl = 'https://api.dropboxapi.com/2/files/list_folder';
    if (cursor) {
      const continueUrl = 'https://api.dropboxapi.com/2/files/list_folder/continue';
      const resp = await axios({
        method: 'POST',
        url: continueUrl,
        headers: { Authorization: `Bearer ${ctx.accessToken}`, 'Content-Type': 'application/json' },
        data: { cursor },
        timeout: 10000,
        validateStatus: () => true
      });
      if (resp.status === 401) throw new ApiError('Unauthorized', 401, 'oauth/unauthorized');
      if (resp.status === 403) throw new ApiError('Forbidden', 403, 'oauth/forbidden');
      if (resp.status >= 500) throw new ApiError('Provider error', 502, 'provider/error');
      const entries = Array.isArray(resp.data?.entries) ? resp.data.entries : [];
      const items: FolderItem[] = entries.filter((e: any) => e['.tag'] === 'folder')
        .map((e: any) => ({ id: e.id, name: e.name, path: path === '/' ? `/${e.name}` : `${path}/${e.name}`, isFolder: true as const }));
      return { items, nextCursor: resp.data?.has_more ? resp.data?.cursor : null };
    }
    const resp = await axios({
      method: 'POST',
      url: listUrl,
      headers: { Authorization: `Bearer ${ctx.accessToken}`, 'Content-Type': 'application/json' },
      data: { path: path === '/' ? '' : path, recursive: false, include_deleted: false, include_non_downloadable_files: true },
      timeout: 10000,
      validateStatus: () => true
    });
    if (resp.status === 401) throw new ApiError('Unauthorized', 401, 'oauth/unauthorized');
    if (resp.status === 403) throw new ApiError('Forbidden', 403, 'oauth/forbidden');
    if (resp.status >= 500) throw new ApiError('Provider error', 502, 'provider/error');
    const entries = Array.isArray(resp.data?.entries) ? resp.data.entries : [];
    const items: FolderItem[] = entries.filter((e: any) => e['.tag'] === 'folder')
      .map((e: any) => ({ id: e.id, name: e.name, path: path === '/' ? `/${e.name}` : `${path}/${e.name}`, isFolder: true as const }));
    return { items, nextCursor: resp.data?.has_more ? resp.data?.cursor : null };
  }
}

function getAdapterForProvider(provider: any): ProviderAdapter {
  const name = (provider?.name || provider?.slug || provider?.metadata?.providerType || '').toLowerCase();
  if (name === 'dropbox') return new DropboxAdapter();
  return new DropboxAdapter();
}

export async function browseIntegrationFolders(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId, integrationId } = req.params as { tenantId: string; integrationId: string };
  const parsed = browseQuerySchema.parse(req.query);
  const query: BrowseQuery = { containerId: parsed.containerId, folderId: parsed.folderId, cursor: parsed.cursor, path: parsed.path };

  logInfo('Browse folders request', { tenantId, integrationId, userId: user.sub, containerId: query.containerId, folderId: query.folderId, path: query.path, cursor: query.cursor });

  try {
    const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
    const provider = await cloudProviderService.findById(integration.providerId.toString(), true);
    const accessToken = integration.accessToken ? decrypt(integration.accessToken) : '';
    const refreshToken = integration.refreshToken ? decrypt(integration.refreshToken) : '';
    if (!accessToken) throw new ApiError('Missing access token', 401, 'oauth/unauthorized');

    const adapter = getAdapterForProvider(provider);
    const capabilities = adapter.capabilities();
    const ctx: ProviderContext = { accessToken, provider };

    const execList = async (): Promise<ListResult> => {
      // 1) ID-first if provided
      if (query.folderId) {
        if (!capabilities.supportsId) throw new ApiError('Provider does not support id addressing', 400, 'capability/not-supported');
        return adapter.listFoldersById(ctx, query.containerId || '', query.folderId, query.cursor);
      }
      // 2) Path-first if provided and supported (including non-root)
      if (query.path && capabilities.supportsPath) {
        if (!capabilities.supportsPath) throw new ApiError('Provider does not support path addressing', 400, 'capability/not-supported');
        return adapter.listFoldersByPath(ctx, query.containerId, query.path, query.cursor);
      }
      // 3) Root resolution when no folderId/path provided
      if (capabilities.supportsContainers) {
        const containers = await adapter.listContainers(ctx, query.cursor);
        containers.items = containers.items.map(i => ({ ...i, isContainer: true }));
        return containers;
      }
      if (capabilities.supportsPath) {
        return adapter.listFoldersByPath(ctx, query.containerId, '/', query.cursor);
      }
      throw new ApiError('Provider does not support path addressing', 400, 'capability/not-supported');
    };

    let result: ListResult | undefined;
    try {
      result = await execList();
    } catch (err: any) {
      // Try one-time refresh on 401/403 auth errors
      const status = (err instanceof ApiError ? (err as any).statusCode : undefined) || err?.status;
      const isAuthError = status === 401 || status === 403;
      if (isAuthError && refreshToken) {
        try {
          const tokenResp = await oauthService.refreshTokens(refreshToken, provider);
          await cloudIntegrationsService.updateTokens(
            integrationId,
            tenantId,
            tokenResp.accessToken,
            tokenResp.refreshToken || '',
            tokenResp.expiresIn,
            user.sub,
            tokenResp.scopesGranted
          );
          const ctxRefreshed: ProviderContext = { accessToken: tokenResp.accessToken, provider };
          // Re-run with new token
          const rerun = async (): Promise<ListResult> => {
            if (query.folderId) {
              if (!capabilities.supportsId) throw new ApiError('Provider does not support id addressing', 400, 'capability/not-supported');
              return adapter.listFoldersById(ctxRefreshed, query.containerId || '', query.folderId, query.cursor);
            }
            if (query.path && capabilities.supportsPath) {
              return adapter.listFoldersByPath(ctxRefreshed, query.containerId, query.path, query.cursor);
            }
            if (capabilities.supportsContainers) {
              const containers = await adapter.listContainers(ctxRefreshed, query.cursor);
              containers.items = containers.items.map(i => ({ ...i, isContainer: true }));
              return containers;
            }
            if (capabilities.supportsPath) {
              return adapter.listFoldersByPath(ctxRefreshed, query.containerId, '/', query.cursor);
            }
            throw new ApiError('Provider does not support path addressing', 400, 'capability/not-supported');
          };
          result = await rerun();
        } catch (refreshErr) {
          throw err; // fall back to original error mapping
        }
      } else {
        throw err;
      }
    }

    return res.status(200).json({
      success: true,
      data: result.items.map(i => ({ ...i, isFolder: true, isContainer: Boolean(i.isContainer) })),
      nextCursor: result.nextCursor ?? null,
      hasMore: Boolean(result.nextCursor),
      capabilities
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      const status = (error as any).statusCode || 500;
      const code = error.code || (status >= 500 ? 'server/error' : 'client/error');
      const message = status >= 500 ? 'Upstream provider error' : error.message;
      return res.status(status).json({ success: false, error: { code, message } });
    }
    logError('Folder browsing failed', error);
    return res.status(500).json({ success: false, error: { code: 'server/error', message: 'Unexpected server error' } });
  }
}