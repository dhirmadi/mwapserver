import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { logAudit, logError } from '../../utils/logger.js';
import { safeEncrypt, safeDecrypt } from '../../utils/encryption.js';
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
      
      // Get integrations with provider details using aggregation
      const integrations = await this.collection.aggregate([
        { $match: { tenantId: tenantObjectId } },
        {
          $lookup: {
            from: 'cloudProviders',
            localField: 'providerId',
            foreignField: '_id',
            as: 'providerDetails'
          }
        },
        { $unwind: { path: '$providerDetails', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            tenantId: 1,
            providerId: 1,
            status: 1,
            scopesGranted: 1,
            connectedAt: 1,
            tokenExpiresAt: 1,
            metadata: 1,
            createdAt: 1,
            updatedAt: 1,
            createdBy: 1,
            provider: {
              name: '$providerDetails.name',
              slug: '$providerDetails.slug',
              metadata: '$providerDetails.metadata'
            }
          }
        }
      ]).toArray();
      
      return integrations;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logError('Error finding integrations by tenant ID', error);
      throw new ApiError('Invalid tenant ID', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
  }

  async findById(id: string, tenantId: string, decryptSecrets: boolean = false): Promise<CloudProviderIntegration> {
    try {
      const integrationObjectId = new ObjectId(id);
      const tenantObjectId = new ObjectId(tenantId);
      
      // Get integration with provider details using aggregation
      const [integration] = await this.collection.aggregate([
        { 
          $match: { 
            _id: integrationObjectId,
            tenantId: tenantObjectId
          } 
        },
        {
          $lookup: {
            from: 'cloudProviders',
            localField: 'providerId',
            foreignField: '_id',
            as: 'providerDetails'
          }
        },
        { $unwind: { path: '$providerDetails', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            tenantId: 1,
            providerId: 1,
            accessToken: 1,
            refreshToken: 1,
            tokenExpiresAt: 1,
            scopesGranted: 1,
            status: 1,
            connectedAt: 1,
            metadata: 1,
            createdAt: 1,
            updatedAt: 1,
            createdBy: 1,
            provider: {
              name: '$providerDetails.name',
              slug: '$providerDetails.slug',
              metadata: '$providerDetails.metadata'
            }
          }
        }
      ]).toArray();
      
      if (!integration) {
        throw new ApiError('Cloud provider integration not found', 404, CloudProviderIntegrationErrorCodes.NOT_FOUND);
      }
      
      // If decryption is requested (for internal use only, never for API responses)
      if (decryptSecrets) {
        if (integration.accessToken) {
          integration.accessToken = safeDecrypt(integration.accessToken);
        }
        if (integration.refreshToken) {
          integration.refreshToken = safeDecrypt(integration.refreshToken);
        }
      }
      
      return integration;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logError('Error finding integration by ID', error);
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
        tenantId: tenantObjectId,
        providerId: providerObjectId
      });
      
      if (existingIntegration) {
        throw new ApiError(
          'Integration already exists for this tenant and provider', 
          409, 
          CloudProviderIntegrationErrorCodes.ALREADY_EXISTS
        );
      }
      
      const now = new Date();
      const integration: CloudProviderIntegration = {
        _id: new ObjectId(),
        tenantId: tenantObjectId,
        providerId: providerObjectId,
        status: 'active',
        connectedAt: now,
        metadata: data.metadata,
        createdAt: now,
        updatedAt: now,
        createdBy: userId
      };
      
      await this.collection.insertOne(integration);
      
      logAudit('cloud-integration.create', userId, integration._id.toString(), {
        tenantId,
        providerId: data.providerId
      });
      
      return integration;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logError('Failed to create cloud integration', error);
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
    refreshToken: string | null,
    expiresIn: number,
    scopesGranted: string[],
    userId: string
  ): Promise<CloudProviderIntegration> {
    try {
      const integration = await this.findById(id, tenantId);
      
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expiresIn);
      
      // Encrypt tokens before storing
      const encryptedAccessToken = safeEncrypt(accessToken);
      const encryptedRefreshToken = refreshToken ? safeEncrypt(refreshToken) : null;
      
      const updates = {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        scopesGranted,
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
        tokenExpiresAt,
        scopesGranted
      });
      
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logError('Failed to update integration tokens', error);
      throw new ApiError('Failed to update integration tokens', 500, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
  }
}