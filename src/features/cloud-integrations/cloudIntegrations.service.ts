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
      console.log('DEBUG - Service create method called with:');
      console.log('DEBUG - tenantId:', tenantId);
      console.log('DEBUG - data:', JSON.stringify(data, null, 2));
      console.log('DEBUG - userId:', userId);
      
      try {
        const tenantObjectId = new ObjectId(tenantId);
        console.log('DEBUG - Valid tenantObjectId:', tenantObjectId.toString());
        
        try {
          const providerObjectId = new ObjectId(data.providerId);
          console.log('DEBUG - Valid providerObjectId:', providerObjectId.toString());
          
          // Verify tenant exists
          const tenant = await getDB().collection('tenants').findOne({ _id: tenantObjectId });
          console.log('DEBUG - Tenant found:', tenant ? 'Yes' : 'No');
          if (!tenant) {
            throw new ApiError('Tenant not found', 404, CloudProviderIntegrationErrorCodes.TENANT_NOT_FOUND);
          }
          
          // Verify cloud provider exists
          const provider = await getDB().collection('cloudProviders').findOne({ _id: providerObjectId });
          console.log('DEBUG - Provider found:', provider ? 'Yes' : 'No');
          if (!provider) {
            throw new ApiError('Cloud provider not found', 404, CloudProviderIntegrationErrorCodes.PROVIDER_NOT_FOUND);
          }
          console.log('DEBUG - Provider details:', JSON.stringify(provider, null, 2));
          
          // Check if integration already exists for this tenant and provider
          const existingIntegration = await this.collection.findOne({ 
            tenantId: tenantObjectId,
            providerId: providerObjectId
          });
          
          console.log('DEBUG - Existing integration found:', existingIntegration ? 'Yes' : 'No');
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
          
          console.log('DEBUG - Integration object to insert:', JSON.stringify({
            ...integration,
            accessToken: integration.accessToken ? '[REDACTED]' : undefined,
            refreshToken: integration.refreshToken ? '[REDACTED]' : undefined
          }, null, 2));
          
          await this.collection.insertOne(integration as CloudProviderIntegration);
          
          logAudit('cloud-integration.create', userId, integration._id.toString(), {
            tenantId,
            providerId: data.providerId
          });
          
          return integration as CloudProviderIntegration;
        } catch (providerIdError) {
          console.log('DEBUG - Error with providerId:', providerIdError);
          throw new ApiError('Invalid provider ID', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
        }
      } catch (tenantIdError) {
        console.log('DEBUG - Error with tenantId:', tenantIdError);
        throw new ApiError('Invalid tenant ID', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
      }
    } catch (error) {
      console.log('DEBUG - Error in create method:', error);
      if (error instanceof ApiError) {
        throw error;
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
    userId: string
  ): Promise<CloudProviderIntegration> {
    const integration = await this.findById(id, tenantId);
    
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expiresIn);
    
    const updates = {
      accessToken,
      refreshToken,
      tokenExpiresAt,
      status: 'active',
      connectedAt: new Date(),
      updatedAt: new Date()
    };
    
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
      tokenExpiresAt
    });
    
    return result;
  }
}