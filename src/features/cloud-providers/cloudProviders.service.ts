import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { logAudit, logError } from '../../utils/logger.js';
import { safeEncrypt, safeDecrypt } from '../../utils/encryption.js';
import { 
  CloudProvider, 
  CreateCloudProviderRequest, 
  UpdateCloudProviderRequest, 
  CloudProviderErrorCodes 
} from '../../schemas/cloudProvider.schema.js';

export class CloudProviderService {
  private collection: Collection<CloudProvider>;

  constructor() {
    this.collection = getDB().collection<CloudProvider>('cloudProviders');
  }

  async findAll(): Promise<CloudProvider[]> {
    return this.collection.find().toArray();
  }

  async findById(id: string, decryptSecrets: boolean = false): Promise<CloudProvider> {
    try {
      const cloudProvider = await this.collection.findOne({ _id: new ObjectId(id) });
      if (!cloudProvider) {
        throw new ApiError('Cloud provider not found', 404, CloudProviderErrorCodes.NOT_FOUND);
      }
      
      // If decryption is requested (for internal use only, never for API responses)
      if (decryptSecrets && cloudProvider.clientSecret) {
        return {
          ...cloudProvider,
          clientSecret: safeDecrypt(cloudProvider.clientSecret)
        };
      }
      
      return cloudProvider;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logError('Error finding cloud provider', error);
      throw new ApiError('Invalid cloud provider ID', 400, CloudProviderErrorCodes.INVALID_INPUT);
    }
  }

  async create(data: CreateCloudProviderRequest, userId: string): Promise<CloudProvider> {
    try {
      // Check for existing name
      const nameExists = await this.collection.findOne({ name: data.name });
      if (nameExists) {
        throw new ApiError('Cloud provider name already exists', 409, CloudProviderErrorCodes.NAME_EXISTS);
      }

      // Check for existing slug
      const slugExists = await this.collection.findOne({ slug: data.slug });
      if (slugExists) {
        throw new ApiError('Cloud provider slug already exists', 409, CloudProviderErrorCodes.SLUG_EXISTS);
      }

      // Encrypt sensitive data
      const encryptedData = {
        ...data,
        clientSecret: safeEncrypt(data.clientSecret)
      };

      const now = new Date();
      const cloudProvider: CloudProvider = {
        _id: new ObjectId(),
        ...encryptedData,
        createdAt: now,
        updatedAt: now,
        createdBy: userId
      };

      await this.collection.insertOne(cloudProvider);
      
      logAudit('cloud-provider.create', userId, cloudProvider._id.toString(), {
        name: data.name,
        slug: data.slug
      });

      return cloudProvider;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logError('Failed to create cloud provider', error);
      throw new ApiError('Failed to create cloud provider', 500, CloudProviderErrorCodes.INVALID_INPUT);
    }
  }

  async update(id: string, data: UpdateCloudProviderRequest, userId: string): Promise<CloudProvider> {
    try {
      const cloudProvider = await this.findById(id);

      // Check name uniqueness if name is being updated
      if (data.name && data.name !== cloudProvider.name) {
        const nameExists = await this.collection.findOne({ 
          _id: { $ne: cloudProvider._id }, 
          name: data.name 
        });
        if (nameExists) {
          throw new ApiError('Cloud provider name already exists', 409, CloudProviderErrorCodes.NAME_EXISTS);
        }
      }

      // Check slug uniqueness if slug is being updated
      if (data.slug && data.slug !== cloudProvider.slug) {
        const slugExists = await this.collection.findOne({ 
          _id: { $ne: cloudProvider._id }, 
          slug: data.slug 
        });
        if (slugExists) {
          throw new ApiError('Cloud provider slug already exists', 409, CloudProviderErrorCodes.SLUG_EXISTS);
        }
      }

      // Encrypt sensitive data if provided
      const encryptedData = { ...data };
      if (data.clientSecret) {
        encryptedData.clientSecret = safeEncrypt(data.clientSecret);
      }

      const updates = {
        ...encryptedData,
        updatedAt: new Date()
      };

      const result = await this.collection.findOneAndUpdate(
        { _id: cloudProvider._id },
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new ApiError('Failed to update cloud provider', 500, CloudProviderErrorCodes.NOT_FOUND);
      }

      logAudit('cloud-provider.update', userId, id, {
        updates: Object.keys(data)
      });

      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logError('Failed to update cloud provider', error);
      throw new ApiError('Failed to update cloud provider', 500, CloudProviderErrorCodes.INVALID_INPUT);
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    const cloudProvider = await this.findById(id);

    // Check if provider is in use by any integrations
    const integrationsUsingProvider = await getDB().collection('cloudProviderIntegrations').countDocuments({ providerId: id });
    if (integrationsUsingProvider > 0) {
      throw new ApiError('Cloud provider is in use by existing integrations', 409, CloudProviderErrorCodes.IN_USE);
    }

    await this.collection.deleteOne({ _id: cloudProvider._id });

    logAudit('cloud-provider.delete', userId, id, {
      name: cloudProvider.name,
      slug: cloudProvider.slug
    });
  }
}