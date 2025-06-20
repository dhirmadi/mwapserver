import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { logAudit } from '../../utils/logger.js';
import { 
  CloudProviderIntegration, 
  CreateCloudProviderIntegrationRequest, 
  UpdateCloudProviderIntegrationRequest, 
  CloudProviderIntegrationErrorCodes 
} from '../../schemas/cloudProviderIntegration.schema.js';

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
      
      return this.collection.find({ tenantId: tenantObjectId }).toArray();
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
        tenantId: tenantObjectId
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
      logInfo(`DEBUG SERVICE: Creating integration for tenant ${tenantId} with data: ${JSON.stringify(data)}`);
      
      const tenantObjectId = new ObjectId(tenantId);
      const providerObjectId = new ObjectId(data.providerId);
      
      // Verify tenant exists
      const tenant = await getDB().collection('tenants').findOne({ _id: tenantObjectId });
      if (!tenant) {
        logInfo(`DEBUG SERVICE: Tenant not found: ${tenantId}`);
        throw new ApiError('Tenant not found', 404, CloudProviderIntegrationErrorCodes.TENANT_NOT_FOUND);
      }
      
      // Verify cloud provider exists
      const provider = await getDB().collection('cloudProviders').findOne({ _id: providerObjectId });
      if (!provider) {
        logInfo(`DEBUG SERVICE: Cloud provider not found: ${data.providerId}`);
        throw new ApiError('Cloud provider not found', 404, CloudProviderIntegrationErrorCodes.PROVIDER_NOT_FOUND);
      }
      
      // Check if integration already exists for this tenant and provider
      const existingIntegration = await this.collection.findOne({ 
        tenantId: tenantObjectId,
        providerId: providerObjectId
      });
      
      if (existingIntegration) {
        logInfo(`DEBUG SERVICE: Integration already exists for tenant ${tenantId} and provider ${data.providerId}`);
        logInfo(`DEBUG SERVICE: Existing integration ID: ${existingIntegration._id}`);
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
        tenantId: tenantObjectId,
        providerId: providerObjectId,
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
      
      logInfo(`DEBUG SERVICE: About to insert integration with ID: ${integration._id}`);
      await this.collection.insertOne(integration as CloudProviderIntegration);
      logInfo(`DEBUG SERVICE: Integration inserted successfully`);
      
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
}