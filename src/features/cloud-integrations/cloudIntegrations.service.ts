import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { logAudit, logInfo, logError } from '../../utils/logger.js';
import { 
  CloudProviderIntegration, 
  CreateCloudProviderIntegrationRequest, 
  UpdateCloudProviderIntegrationRequest, 
  CloudProviderIntegrationErrorCodes 
} from '../../schemas/cloudProviderIntegration.schema.js';
import axios from 'axios';

export class CloudIntegrationsService {
  private collection: Collection<CloudProviderIntegration>;

  constructor() {
    this.collection = getDB().collection<CloudProviderIntegration>('cloudProviderIntegrations');
  }

  async findByTenantId(tenantId: string): Promise<CloudProviderIntegration[]> {
    try {
      const tenantObjectId = new ObjectId(tenantId);
      
      // Verify tenant exists
      const tenant = await getDB().collection('tenants').findOne({ _id: tenantObjectId });
      if (!tenant) {
        throw new ApiError('Tenant not found', 404, CloudProviderIntegrationErrorCodes.TENANT_NOT_FOUND);
      }
      
      return this.collection.find({ tenantId: tenantObjectId.toString() }).toArray();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Invalid tenant ID', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
  }

  async findById(id: string, tenantId: string): Promise<CloudProviderIntegration> {
    try {
      const integrationObjectId = new ObjectId(id);
      const tenantObjectId = new ObjectId(tenantId);
      
      const integration = await this.collection.findOne({ 
        _id: integrationObjectId,
        tenantId: tenantObjectId.toString()
      });
      
      if (!integration) {
        throw new ApiError('Cloud provider integration not found', 404, CloudProviderIntegrationErrorCodes.NOT_FOUND);
      }
      
      return integration;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Invalid integration ID', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
  }

  async create(
    tenantId: string, 
    data: CreateCloudProviderIntegrationRequest, 
    userId: string
  ): Promise<CloudProviderIntegration> {
    try {
      const tenantObjectId = new ObjectId(tenantId);
      const providerObjectId = new ObjectId(data.providerId);
      
      // Verify tenant exists
      const tenant = await getDB().collection('tenants').findOne({ _id: tenantObjectId });
      if (!tenant) {
        throw new ApiError('Tenant not found', 404, CloudProviderIntegrationErrorCodes.TENANT_NOT_FOUND);
      }
      
      // Verify cloud provider exists
      const provider = await getDB().collection('cloudProviders').findOne({ _id: providerObjectId });
      if (!provider) {
        throw new ApiError('Cloud provider not found', 404, CloudProviderIntegrationErrorCodes.PROVIDER_NOT_FOUND);
      }
      
      // Check if integration already exists for this tenant and provider
      const existingIntegration = await this.collection.findOne({ 
        tenantId: tenantObjectId.toString(),
        providerId: providerObjectId.toString()
      });
      
      if (existingIntegration) {
        throw new ApiError(
          'Integration already exists for this tenant and provider', 
          409, 
          CloudProviderIntegrationErrorCodes.ALREADY_EXISTS
        );
      }
      
      const now = new Date();
      
      // Create integration object with all required fields
      const integration: Partial<CloudProviderIntegration> = {
        _id: new ObjectId(),
        tenantId: tenantObjectId.toString(),
        providerId: providerObjectId.toString(),
        status: data.status || 'active',
        createdAt: now,
        updatedAt: now,
        createdBy: userId
      };
      
      // Add optional fields if they exist in the data
      if (data.metadata) integration.metadata = data.metadata;
      if (data.accessToken) integration.accessToken = data.accessToken;
      if (data.refreshToken) integration.refreshToken = data.refreshToken;
      if (data.tokenExpiresAt) integration.tokenExpiresAt = data.tokenExpiresAt;
      if (data.scopesGranted) integration.scopesGranted = data.scopesGranted;
      if (data.connectedAt) integration.connectedAt = data.connectedAt;
      
      await this.collection.insertOne(integration as CloudProviderIntegration);
      
      logAudit('cloud-integration.create', userId, integration._id.toString(), {
        tenantId,
        providerId: data.providerId
      });
      
      return integration as CloudProviderIntegration;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('ObjectId')) {
        throw new ApiError('Invalid ID format', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
      }
      throw new ApiError('Failed to create integration', 500, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
  }

  async update(
    id: string, 
    tenantId: string, 
    data: UpdateCloudProviderIntegrationRequest, 
    userId: string
  ): Promise<CloudProviderIntegration> {
    const integration = await this.findById(id, tenantId);
    
    const updates = {
      ...data,
      updatedAt: new Date()
    };
    
    const result = await this.collection.findOneAndUpdate(
      { _id: integration._id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      throw new ApiError(
        'Failed to update integration', 
        500, 
        CloudProviderIntegrationErrorCodes.NOT_FOUND
      );
    }
    
    logAudit('cloud-integration.update', userId, id, {
      tenantId,
      updates: Object.keys(data)
    });
    
    return result;
  }

  async delete(id: string, tenantId: string, userId: string): Promise<void> {
    const integration = await this.findById(id, tenantId);
    
    // Check if integration is in use by any projects
    const projectsUsingIntegration = await getDB().collection('projects').countDocuments({ 
      cloudIntegrationId: integration._id 
    });
    
    if (projectsUsingIntegration > 0) {
      throw new ApiError(
        'Integration is in use by existing projects', 
        409, 
        CloudProviderIntegrationErrorCodes.IN_USE
      );
    }
    
    await this.collection.deleteOne({ _id: integration._id });
    
    logAudit('cloud-integration.delete', userId, id, {
      tenantId,
      providerId: integration.providerId.toString()
    });
  }

  // Method to update OAuth tokens after successful authentication
  async updateTokens(
    id: string,
    tenantId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    userId: string,
    scopesGranted?: string[]
  ): Promise<CloudProviderIntegration> {
    const integration = await this.findById(id, tenantId);
    
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expiresIn);
    const now = new Date();
    
    const updates: Record<string, any> = {
      accessToken,
      refreshToken,
      tokenExpiresAt,
      status: 'active',
      connectedAt: now,
      updatedAt: now
    };
    
    if (scopesGranted && scopesGranted.length > 0) {
      updates.scopesGranted = scopesGranted;
    }
    
    const result = await this.collection.findOneAndUpdate(
      { _id: integration._id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      throw new ApiError(
        'Failed to update integration tokens', 
        500, 
        CloudProviderIntegrationErrorCodes.NOT_FOUND
      );
    }
    
    logAudit('cloud-integration.update-tokens', userId, id, {
      tenantId,
      tokenExpiresAt,
      status: 'active'
    });
    
    return result;
  }

  /**
   * Check the health status of an integration by testing token validity
   */
  async checkIntegrationHealth(id: string, tenantId: string): Promise<{
    status: 'healthy' | 'expired' | 'unauthorized' | 'error';
    lastChecked: string;
    message?: string;
  }> {
    try {
      const integration = await this.findById(id, tenantId);
      const now = new Date();
      
      // Check if we have an access token
      if (!integration.accessToken) {
        return {
          status: 'unauthorized',
          lastChecked: now.toISOString(),
          message: 'No access token available'
        };
      }
      
      // Check if token is expired based on stored expiration time
      if (integration.tokenExpiresAt && integration.tokenExpiresAt <= now) {
        return {
          status: 'expired',
          lastChecked: now.toISOString(),
          message: 'Access token has expired'
        };
      }
      
      // Get the provider to determine how to test the token
      const provider = await getDB().collection('cloudProviders').findOne({ 
        _id: new ObjectId(integration.providerId.toString())
      });
      
      if (!provider) {
        return {
          status: 'error',
          lastChecked: now.toISOString(),
          message: 'Cloud provider not found'
        };
      }
      
      // Test the token by making a simple API call to the provider
      try {
        await this.testTokenWithProvider(integration.accessToken, provider);
        
        // Update the integration status to healthy if the test passes
        await this.collection.updateOne(
          { _id: integration._id },
          { 
            $set: { 
              status: 'active',
              updatedAt: now
            }
          }
        );
        
        return {
          status: 'healthy',
          lastChecked: now.toISOString(),
          message: 'Token is valid and working'
        };
      } catch (tokenError) {
        logError('Token validation failed during health check', tokenError);
        
        // Update integration status based on the error
        let status: 'expired' | 'unauthorized' | 'error' = 'error';
        let message = 'Token validation failed';
        
        if (axios.isAxiosError(tokenError)) {
          if (tokenError.response?.status === 401) {
            status = 'unauthorized';
            message = 'Token is invalid or revoked';
          } else if (tokenError.response?.status === 403) {
            status = 'expired';
            message = 'Token has expired or insufficient permissions';
          }
        }
        
        // Update the integration status
        await this.collection.updateOne(
          { _id: integration._id },
          { 
            $set: { 
              status: status === 'unauthorized' ? 'revoked' : status,
              updatedAt: now
            }
          }
        );
        
        return {
          status,
          lastChecked: now.toISOString(),
          message
        };
      }
    } catch (error) {
      logError('Health check failed', error);
      return {
        status: 'error',
        lastChecked: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Test a token with the cloud provider by making a simple API call
   */
  private async testTokenWithProvider(accessToken: string, provider: any): Promise<void> {
    // Define test endpoints for different providers
    const testEndpoints: Record<string, string> = {
      'aws': 'https://sts.amazonaws.com/',
      'azure': 'https://management.azure.com/subscriptions?api-version=2020-01-01',
      'gcp': 'https://cloudresourcemanager.googleapis.com/v1/projects',
      'github': 'https://api.github.com/user',
      'gitlab': 'https://gitlab.com/api/v4/user'
    };
    
    // Get the test endpoint for this provider
    const testUrl = testEndpoints[provider.name?.toLowerCase()] || provider.apiBaseUrl;
    
    if (!testUrl) {
      throw new Error(`No test endpoint configured for provider: ${provider.name}`);
    }
    
    // Make a simple GET request to test the token
    const response = await axios.get(testUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    // If we get here without an exception, the token is valid
    logInfo(`Token validation successful for provider ${provider.name}`);
  }
}