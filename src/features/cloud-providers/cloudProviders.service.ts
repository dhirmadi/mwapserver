import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { logAudit } from '../../utils/logger.js';
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

  async findById(id: string): Promise<CloudProvider> {
    try {
      const cloudProvider = await this.collection.findOne({ _id: new ObjectId(id) });
      if (!cloudProvider) {
        throw new ApiError('Cloud provider not found', 404, CloudProviderErrorCodes.NOT_FOUND);
      }
      return cloudProvider;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Invalid cloud provider ID', 400, CloudProviderErrorCodes.INVALID_INPUT);
    }
  }

  async create(data: CreateCloudProviderRequest, userId: string): Promise<CloudProvider> {
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

    const now = new Date();
    const cloudProvider: CloudProvider = {
      _id: new ObjectId(),
      ...data,
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
  }

  async update(id: string, data: UpdateCloudProviderRequest, userId: string): Promise<CloudProvider> {
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

    const updates = {
      ...data,
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
      updates: data
    });

    return result;
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