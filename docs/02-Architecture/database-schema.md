# 🗄️ MWAP Database Schema Documentation

## 🎯 Overview

This document provides comprehensive documentation of the MWAP database schema, including collection structures, relationships, indexes, and data access patterns. The schema is designed for MongoDB Atlas with multi-tenant architecture and security-first principles.

## 🏗️ Database Architecture

### **Multi-Tenant Data Isolation**
```typescript
// Tenant isolation strategy
interface TenantIsolation {
  strategy: 'Row-Level Security';
  implementation: 'tenantId field in all collections';
  enforcement: 'Application-level filtering';
  indexing: 'Compound indexes with tenantId as first field';
}

// Example tenant-aware query
const projects = await Project.find({
  tenantId: new ObjectId(userTenantId),
  status: 'active'
}).lean();
```

### **Database Connection Configuration**
```typescript
// MongoDB connection with security settings
const mongoConfig = {
  uri: process.env.MONGODB_URI,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    retryWrites: true,
    w: 'majority',
    readPreference: 'primary',
    authSource: 'admin'
  }
};
```

## 📊 Core Collections

### **Tenants Collection**
```typescript
interface ITenant extends Document {
  _id: ObjectId;
  name: string;                    // Tenant display name
  domain: string;                  // Unique domain identifier
  subdomain?: string;              // Optional subdomain
  status: 'active' | 'suspended' | 'archived';
  settings: {
    maxUsers: number;              // User limit
    maxProjects: number;           // Project limit
    maxStorage: number;            // Storage limit in bytes
    features: string[];            // Enabled features
    branding?: {
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
  };
  billing: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    subscriptionId?: string;
    billingEmail: string;
    nextBillingDate?: Date;
  };
  ownerId: string;                 // Auth0 user ID of tenant owner
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const TenantSchema = new Schema<ITenant>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
    maxlength: 50
  },
  subdomain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
    maxlength: 30
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'archived'],
    default: 'active',
    index: true
  },
  settings: {
    maxUsers: { type: Number, default: 10 },
    maxProjects: { type: Number, default: 5 },
    maxStorage: { type: Number, default: 1073741824 }, // 1GB
    features: [{ type: String }],
    branding: {
      logo: String,
      primaryColor: { type: String, match: /^#[0-9A-F]{6}$/i },
      secondaryColor: { type: String, match: /^#[0-9A-F]{6}$/i }
    }
  },
  billing: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    subscriptionId: String,
    billingEmail: {
      type: String,
      required: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    nextBillingDate: Date
  },
  ownerId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
TenantSchema.index({ domain: 1 }, { unique: true });
TenantSchema.index({ subdomain: 1 }, { unique: true, sparse: true });
TenantSchema.index({ status: 1 });
TenantSchema.index({ ownerId: 1 });
TenantSchema.index({ 'billing.plan': 1 });
TenantSchema.index({ createdAt: -1 });
```

### **Users Collection**
```typescript
interface IUser extends Document {
  auth0Id: string;                 // Primary key from Auth0
  email: string;
  name: string;
  avatar?: string;
  role: 'superadmin' | 'tenant_owner' | 'project_member';
  tenantId: ObjectId;              // Reference to tenant
  permissions: string[];           // Specific permissions
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
  };
  profile: {
    firstName?: string;
    lastName?: string;
    title?: string;
    department?: string;
    phone?: string;
    bio?: string;
  };
  security: {
    mfaEnabled: boolean;
    lastPasswordChange?: Date;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    lastLoginIP?: string;
    lastLoginUserAgent?: string;
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  auth0Id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  avatar: String,
  role: {
    type: String,
    enum: ['superadmin', 'tenant_owner', 'project_member'],
    default: 'project_member',
    index: true
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  permissions: [{ type: String }],
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  },
  profile: {
    firstName: { type: String, trim: true, maxlength: 50 },
    lastName: { type: String, trim: true, maxlength: 50 },
    title: { type: String, trim: true, maxlength: 100 },
    department: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20 },
    bio: { type: String, trim: true, maxlength: 500 }
  },
  security: {
    mfaEnabled: { type: Boolean, default: false },
    lastPasswordChange: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    lastLoginIP: String,
    lastLoginUserAgent: String
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for multi-tenant queries
UserSchema.index({ tenantId: 1, isActive: 1 });
UserSchema.index({ tenantId: 1, role: 1 });
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ auth0Id: 1 }, { unique: true });
UserSchema.index({ email: 1 });
UserSchema.index({ lastLogin: -1 });
```

### **Projects Collection**
```typescript
interface IProject extends Document {
  _id: ObjectId;
  name: string;
  description?: string;
  tenantId: ObjectId;              // Tenant isolation
  projectTypeId: ObjectId;         // Reference to project type
  status: 'active' | 'archived' | 'draft';
  visibility: 'private' | 'team' | 'public';
  settings: {
    allowFileUploads: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    requireApproval: boolean;
    autoArchive: boolean;
    archiveAfterDays?: number;
  };
  metadata: {
    tags: string[];
    category?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: Date;
    budget?: number;
    currency?: string;
  };
  stats: {
    memberCount: number;
    fileCount: number;
    totalSize: number;
    lastActivity?: Date;
  };
  createdBy: string;               // Auth0 user ID
  updatedBy?: string;              // Auth0 user ID
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  projectTypeId: {
    type: Schema.Types.ObjectId,
    ref: 'ProjectType',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'draft'],
    default: 'active',
    index: true
  },
  visibility: {
    type: String,
    enum: ['private', 'team', 'public'],
    default: 'team'
  },
  settings: {
    allowFileUploads: { type: Boolean, default: true },
    maxFileSize: { type: Number, default: 104857600 }, // 100MB
    allowedFileTypes: [{ type: String }],
    requireApproval: { type: Boolean, default: false },
    autoArchive: { type: Boolean, default: false },
    archiveAfterDays: Number
  },
  metadata: {
    tags: [{ type: String, trim: true, maxlength: 50 }],
    category: { type: String, trim: true, maxlength: 50 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    dueDate: Date,
    budget: Number,
    currency: { type: String, default: 'USD', maxlength: 3 }
  },
  stats: {
    memberCount: { type: Number, default: 1 },
    fileCount: { type: Number, default: 0 },
    totalSize: { type: Number, default: 0 },
    lastActivity: Date
  },
  createdBy: {
    type: String,
    required: true,
    index: true
  },
  updatedBy: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
ProjectSchema.index({ tenantId: 1, status: 1 });
ProjectSchema.index({ tenantId: 1, name: 1 }, { unique: true });
ProjectSchema.index({ tenantId: 1, createdBy: 1 });
ProjectSchema.index({ tenantId: 1, projectTypeId: 1 });
ProjectSchema.index({ tenantId: 1, 'metadata.tags': 1 });
ProjectSchema.index({ tenantId: 1, updatedAt: -1 });

// Text search index
ProjectSchema.index({
  name: 'text',
  description: 'text',
  'metadata.tags': 'text'
}, {
  name: 'project_search_index',
  weights: {
    name: 10,
    description: 5,
    'metadata.tags': 3
  }
});
```

### **Project Types Collection**
```typescript
interface IProjectType extends Document {
  _id: ObjectId;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  schema: {
    fields: ProjectTypeField[];
    validation: any;                // JSON schema for validation
  };
  settings: {
    defaultVisibility: 'private' | 'team' | 'public';
    allowCustomFields: boolean;
    requiredFields: string[];
    workflow?: {
      states: string[];
      transitions: WorkflowTransition[];
    };
  };
  isSystem: boolean;               // System-defined vs custom
  isActive: boolean;
  createdBy?: string;              // Auth0 user ID (null for system types)
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectTypeField {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'file';
  label: string;
  description?: string;
  required: boolean;
  options?: string[];              // For select/multiselect
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface WorkflowTransition {
  from: string;
  to: string;
  label: string;
  requiredRole?: string;
}

const ProjectTypeSchema = new Schema<IProjectType>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  icon: {
    type: String,
    trim: true,
    maxlength: 50
  },
  color: {
    type: String,
    match: /^#[0-9A-F]{6}$/i
  },
  schema: {
    fields: [{
      name: { type: String, required: true, trim: true },
      type: {
        type: String,
        enum: ['text', 'number', 'date', 'boolean', 'select', 'multiselect', 'file'],
        required: true
      },
      label: { type: String, required: true, trim: true },
      description: { type: String, trim: true },
      required: { type: Boolean, default: false },
      options: [{ type: String, trim: true }],
      validation: {
        min: Number,
        max: Number,
        pattern: String
      }
    }],
    validation: Schema.Types.Mixed
  },
  settings: {
    defaultVisibility: {
      type: String,
      enum: ['private', 'team', 'public'],
      default: 'team'
    },
    allowCustomFields: { type: Boolean, default: true },
    requiredFields: [{ type: String }],
    workflow: {
      states: [{ type: String }],
      transitions: [{
        from: { type: String, required: true },
        to: { type: String, required: true },
        label: { type: String, required: true },
        requiredRole: String
      }]
    }
  },
  isSystem: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ProjectTypeSchema.index({ name: 1 });
ProjectTypeSchema.index({ isSystem: 1, isActive: 1 });
ProjectTypeSchema.index({ createdBy: 1 });
```

### **Project Members Collection**
```typescript
interface IProjectMember extends Document {
  _id: ObjectId;
  projectId: ObjectId;
  userId: string;                  // Auth0 user ID
  tenantId: ObjectId;              // For tenant isolation
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];           // Specific permissions
  status: 'active' | 'invited' | 'suspended';
  invitedBy?: string;              // Auth0 user ID
  invitedAt?: Date;
  joinedAt?: Date;
  lastActivity?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectMemberSchema = new Schema<IProjectMember>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'viewer'],
    default: 'member',
    index: true
  },
  permissions: [{ type: String }],
  status: {
    type: String,
    enum: ['active', 'invited', 'suspended'],
    default: 'active',
    index: true
  },
  invitedBy: String,
  invitedAt: Date,
  joinedAt: Date,
  lastActivity: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
ProjectMemberSchema.index({ tenantId: 1, projectId: 1, userId: 1 }, { unique: true });
ProjectMemberSchema.index({ tenantId: 1, userId: 1 });
ProjectMemberSchema.index({ projectId: 1, status: 1 });
ProjectMemberSchema.index({ projectId: 1, role: 1 });
```

### **Virtual Files Collection**
```typescript
interface IVirtualFile extends Document {
  _id: ObjectId;
  name: string;
  originalName: string;
  path: string;                    // Virtual path in project
  projectId: ObjectId;
  tenantId: ObjectId;              // Tenant isolation
  cloudProvider: 'aws' | 'google' | 'dropbox' | 'local';
  cloudFileId: string;             // ID in cloud storage
  cloudPath: string;               // Path in cloud storage
  metadata: {
    size: number;
    mimeType: string;
    encoding?: string;
    checksum: string;               // File integrity check
    thumbnail?: string;             // Thumbnail URL for images
    duration?: number;              // For video/audio files
    dimensions?: {
      width: number;
      height: number;
    };
  };
  permissions: {
    public: boolean;
    allowDownload: boolean;
    allowShare: boolean;
    expiresAt?: Date;
  };
  versions: FileVersion[];         // File version history
  tags: string[];
  status: 'active' | 'archived' | 'deleted';
  uploadedBy: string;              // Auth0 user ID
  createdAt: Date;
  updatedAt: Date;
}

interface FileVersion {
  version: number;
  cloudFileId: string;
  size: number;
  checksum: string;
  uploadedBy: string;
  uploadedAt: Date;
  comment?: string;
}

const VirtualFileSchema = new Schema<IVirtualFile>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
    index: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  path: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  cloudProvider: {
    type: String,
    enum: ['aws', 'google', 'dropbox', 'local'],
    required: true,
    index: true
  },
  cloudFileId: {
    type: String,
    required: true,
    index: true
  },
  cloudPath: {
    type: String,
    required: true
  },
  metadata: {
    size: { type: Number, required: true, min: 0 },
    mimeType: { type: String, required: true },
    encoding: String,
    checksum: { type: String, required: true },
    thumbnail: String,
    duration: Number,
    dimensions: {
      width: Number,
      height: Number
    }
  },
  permissions: {
    public: { type: Boolean, default: false },
    allowDownload: { type: Boolean, default: true },
    allowShare: { type: Boolean, default: true },
    expiresAt: Date
  },
  versions: [{
    version: { type: Number, required: true },
    cloudFileId: { type: String, required: true },
    size: { type: Number, required: true },
    checksum: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, required: true },
    comment: String
  }],
  tags: [{ type: String, trim: true, maxlength: 50 }],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  },
  uploadedBy: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
VirtualFileSchema.index({ tenantId: 1, projectId: 1, status: 1 });
VirtualFileSchema.index({ tenantId: 1, projectId: 1, name: 1 });
VirtualFileSchema.index({ tenantId: 1, uploadedBy: 1 });
VirtualFileSchema.index({ cloudProvider: 1, cloudFileId: 1 });
VirtualFileSchema.index({ 'metadata.mimeType': 1 });
VirtualFileSchema.index({ tags: 1 });

// Text search index
VirtualFileSchema.index({
  name: 'text',
  originalName: 'text',
  tags: 'text'
}, {
  name: 'file_search_index',
  weights: {
    name: 10,
    originalName: 8,
    tags: 5
  }
});
```

### **Cloud Providers Collection**
```typescript
interface ICloudProvider extends Document {
  _id: ObjectId;
  name: string;
  type: 'aws' | 'google' | 'dropbox' | 'azure';
  tenantId: ObjectId;              // Tenant-specific configuration
  config: {
    // AWS S3
    accessKeyId?: string;
    secretAccessKey?: string;       // Encrypted
    region?: string;
    bucket?: string;
    
    // Google Drive
    clientId?: string;
    clientSecret?: string;          // Encrypted
    refreshToken?: string;          // Encrypted
    
    // Dropbox
    accessToken?: string;           // Encrypted
    
    // Azure Blob Storage
    connectionString?: string;      // Encrypted
    containerName?: string;
  };
  settings: {
    isDefault: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    autoBackup: boolean;
    encryptionEnabled: boolean;
  };
  status: 'active' | 'inactive' | 'error';
  lastSync?: Date;
  errorMessage?: string;
  createdBy: string;               // Auth0 user ID
  createdAt: Date;
  updatedAt: Date;
}

const CloudProviderSchema = new Schema<ICloudProvider>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['aws', 'google', 'dropbox', 'azure'],
    required: true,
    index: true
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  config: {
    // AWS S3
    accessKeyId: String,
    secretAccessKey: String,        // Encrypted in application
    region: String,
    bucket: String,
    
    // Google Drive
    clientId: String,
    clientSecret: String,           // Encrypted in application
    refreshToken: String,           // Encrypted in application
    
    // Dropbox
    accessToken: String,            // Encrypted in application
    
    // Azure Blob Storage
    connectionString: String,       // Encrypted in application
    containerName: String
  },
  settings: {
    isDefault: { type: Boolean, default: false },
    maxFileSize: { type: Number, default: 104857600 }, // 100MB
    allowedFileTypes: [{ type: String }],
    autoBackup: { type: Boolean, default: false },
    encryptionEnabled: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'active',
    index: true
  },
  lastSync: Date,
  errorMessage: String,
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
CloudProviderSchema.index({ tenantId: 1, type: 1 });
CloudProviderSchema.index({ tenantId: 1, status: 1 });
CloudProviderSchema.index({ tenantId: 1, 'settings.isDefault': 1 });
```

## 🔍 Query Patterns & Optimization

### **Common Query Patterns**
```typescript
// Tenant-aware query patterns
class DatabaseQueries {
  // Get user's projects with pagination
  static async getUserProjects(
    tenantId: string,
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    
    return Project.aggregate([
      // Tenant isolation filter
      { $match: { tenantId: new ObjectId(tenantId) } },
      
      // Join with project members
      {
        $lookup: {
          from: 'projectmembers',
          let: { projectId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$projectId', '$$projectId'] },
                    { $eq: ['$userId', userId] },
                    { $eq: ['$status', 'active'] }
                  ]
                }
              }
            }
          ],
          as: 'membership'
        }
      },
      
      // Filter only projects where user is a member
      { $match: { membership: { $ne: [] } } },
      
      // Add member role to project
      {
        $addFields: {
          userRole: { $arrayElemAt: ['$membership.role', 0] }
        }
      },
      
      // Remove membership array
      { $unset: 'membership' },
      
      // Sort by last activity
      { $sort: { 'stats.lastActivity': -1, updatedAt: -1 } },
      
      // Pagination
      { $skip: skip },
      { $limit: limit },
      
      // Populate project type
      {
        $lookup: {
          from: 'projecttypes',
          localField: 'projectTypeId',
          foreignField: '_id',
          as: 'projectType'
        }
      },
      {
        $addFields: {
          projectType: { $arrayElemAt: ['$projectType', 0] }
        }
      }
    ]);
  }

  // Search files across projects
  static async searchFiles(
    tenantId: string,
    userId: string,
    searchTerm: string,
    filters: FileSearchFilters = {}
  ) {
    const pipeline: any[] = [
      // Tenant isolation
      { $match: { tenantId: new ObjectId(tenantId), status: 'active' } }
    ];

    // Text search
    if (searchTerm) {
      pipeline.push({
        $match: { $text: { $search: searchTerm } }
      });
      pipeline.push({
        $addFields: { score: { $meta: 'textScore' } }
      });
    }

    // File type filter
    if (filters.fileType) {
      pipeline.push({
        $match: { 'metadata.mimeType': { $regex: filters.fileType, $options: 'i' } }
      });
    }

    // Size filter
    if (filters.minSize || filters.maxSize) {
      const sizeMatch: any = {};
      if (filters.minSize) sizeMatch.$gte = filters.minSize;
      if (filters.maxSize) sizeMatch.$lte = filters.maxSize;
      pipeline.push({
        $match: { 'metadata.size': sizeMatch }
      });
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const dateMatch: any = {};
      if (filters.dateFrom) dateMatch.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateMatch.$lte = new Date(filters.dateTo);
      pipeline.push({
        $match: { createdAt: dateMatch }
      });
    }

    // Check user access to projects
    pipeline.push({
      $lookup: {
        from: 'projectmembers',
        let: { projectId: '$projectId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$projectId', '$$projectId'] },
                  { $eq: ['$userId', userId] },
                  { $eq: ['$status', 'active'] }
                ]
              }
            }
          }
        ],
        as: 'access'
      }
    });

    // Filter only accessible files
    pipeline.push({
      $match: { access: { $ne: [] } }
    });

    // Sort by relevance and date
    if (searchTerm) {
      pipeline.push({ $sort: { score: { $meta: 'textScore' }, updatedAt: -1 } });
    } else {
      pipeline.push({ $sort: { updatedAt: -1 } });
    }

    // Populate project info
    pipeline.push({
      $lookup: {
        from: 'projects',
        localField: 'projectId',
        foreignField: '_id',
        as: 'project',
        pipeline: [{ $project: { name: 1, status: 1 } }]
      }
    });

    pipeline.push({
      $addFields: {
        project: { $arrayElemAt: ['$project', 0] }
      }
    });

    // Remove access array
    pipeline.push({ $unset: 'access' });

    return VirtualFile.aggregate(pipeline);
  }

  // Get tenant statistics
  static async getTenantStats(tenantId: string) {
    const [
      userStats,
      projectStats,
      fileStats,
      storageStats
    ] = await Promise.all([
      // User statistics
      User.aggregate([
        { $match: { tenantId: new ObjectId(tenantId) } },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            lastLogin: { $max: '$lastLogin' }
          }
        }
      ]),

      // Project statistics
      Project.aggregate([
        { $match: { tenantId: new ObjectId(tenantId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalMembers: { $sum: '$stats.memberCount' },
            totalFiles: { $sum: '$stats.fileCount' }
          }
        }
      ]),

      // File statistics
      VirtualFile.aggregate([
        { $match: { tenantId: new ObjectId(tenantId), status: 'active' } },
        {
          $group: {
            _id: '$metadata.mimeType',
            count: { $sum: 1 },
            totalSize: { $sum: '$metadata.size' }
          }
        }
      ]),

      // Storage usage
      VirtualFile.aggregate([
        { $match: { tenantId: new ObjectId(tenantId), status: 'active' } },
        {
          $group: {
            _id: null,
            totalFiles: { $sum: 1 },
            totalSize: { $sum: '$metadata.size' },
            avgFileSize: { $avg: '$metadata.size' }
          }
        }
      ])
    ]);

    return {
      users: userStats[0] || { totalUsers: 0, activeUsers: 0 },
      projects: projectStats,
      files: fileStats,
      storage: storageStats[0] || { totalFiles: 0, totalSize: 0, avgFileSize: 0 }
    };
  }
}
```

### **Index Optimization Strategy**
```typescript
// Index creation for optimal performance
const indexCreationScript = {
  // Compound indexes for multi-tenant queries
  tenantBasedIndexes: [
    // Users
    { collection: 'users', index: { tenantId: 1, isActive: 1 } },
    { collection: 'users', index: { tenantId: 1, role: 1 } },
    { collection: 'users', index: { tenantId: 1, email: 1 }, options: { unique: true } },
    
    // Projects
    { collection: 'projects', index: { tenantId: 1, status: 1 } },
    { collection: 'projects', index: { tenantId: 1, name: 1 }, options: { unique: true } },
    { collection: 'projects', index: { tenantId: 1, createdBy: 1 } },
    { collection: 'projects', index: { tenantId: 1, updatedAt: -1 } },
    
    // Project Members
    { collection: 'projectmembers', index: { tenantId: 1, projectId: 1, userId: 1 }, options: { unique: true } },
    { collection: 'projectmembers', index: { tenantId: 1, userId: 1 } },
    { collection: 'projectmembers', index: { projectId: 1, status: 1 } },
    
    // Virtual Files
    { collection: 'virtualfiles', index: { tenantId: 1, projectId: 1, status: 1 } },
    { collection: 'virtualfiles', index: { tenantId: 1, uploadedBy: 1 } },
    { collection: 'virtualfiles', index: { cloudProvider: 1, cloudFileId: 1 } }
  ],

  // Text search indexes
  textSearchIndexes: [
    {
      collection: 'projects',
      index: { name: 'text', description: 'text', 'metadata.tags': 'text' },
      options: {
        name: 'project_search_index',
        weights: { name: 10, description: 5, 'metadata.tags': 3 }
      }
    },
    {
      collection: 'virtualfiles',
      index: { name: 'text', originalName: 'text', tags: 'text' },
      options: {
        name: 'file_search_index',
        weights: { name: 10, originalName: 8, tags: 5 }
      }
    }
  ],

  // Performance monitoring indexes
  performanceIndexes: [
    { collection: 'users', index: { lastLogin: -1 } },
    { collection: 'projects', index: { 'stats.lastActivity': -1 } },
    { collection: 'virtualfiles', index: { updatedAt: -1 } },
    { collection: 'tenants', index: { createdAt: -1 } }
  ]
};
```

## 🔐 Security & Data Protection

### **Data Encryption Strategy**
```typescript
// Field-level encryption for sensitive data
const encryptionConfig = {
  // Encrypt sensitive fields
  encryptedFields: [
    'cloudproviders.config.secretAccessKey',
    'cloudproviders.config.clientSecret',
    'cloudproviders.config.refreshToken',
    'cloudproviders.config.accessToken',
    'cloudproviders.config.connectionString'
  ],

  // Encryption implementation
  encryptField: (value: string): string => {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  },

  decryptField: (encryptedValue: string): string => {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
    let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
};

// Pre-save middleware for encryption
CloudProviderSchema.pre('save', function(next) {
  if (this.isModified('config.secretAccessKey') && this.config.secretAccessKey) {
    this.config.secretAccessKey = encryptionConfig.encryptField(this.config.secretAccessKey);
  }
  if (this.isModified('config.clientSecret') && this.config.clientSecret) {
    this.config.clientSecret = encryptionConfig.encryptField(this.config.clientSecret);
  }
  // ... encrypt other sensitive fields
  next();
});
```

### **Audit Trail Implementation**
```typescript
// Audit log collection
interface IAuditLog extends Document {
  _id: ObjectId;
  tenantId: ObjectId;
  userId: string;                  // Auth0 user ID
  action: string;                  // CRUD operation
  resource: string;                // Collection name
  resourceId: string;              // Document ID
  changes: {
    before?: any;
    after?: any;
  };
  metadata: {
    ip: string;
    userAgent: string;
    timestamp: Date;
    sessionId?: string;
  };
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    index: true
  },
  resource: {
    type: String,
    required: true,
    index: true
  },
  resourceId: {
    type: String,
    required: true,
    index: true
  },
  changes: {
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed
  },
  metadata: {
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    sessionId: String
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  capped: { size: 100000000, max: 1000000 } // 100MB cap, 1M documents max
});

// Compound indexes for audit queries
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, resource: 1, resourceId: 1 });
AuditLogSchema.index({ tenantId: 1, action: 1, createdAt: -1 });
```

## 📊 Performance Monitoring

### **Database Performance Metrics**
```typescript
// Performance monitoring collection
interface IPerformanceMetric extends Document {
  _id: ObjectId;
  type: 'query' | 'connection' | 'index' | 'aggregation';
  operation: string;
  collection: string;
  duration: number;                // Milliseconds
  documentsExamined: number;
  documentsReturned: number;
  indexUsed: boolean;
  indexName?: string;
  queryPlan?: any;
  timestamp: Date;
  metadata: {
    tenantId?: ObjectId;
    userId?: string;
    endpoint?: string;
  };
}

// Performance monitoring middleware
const performanceMonitoring = {
  // Monitor slow queries
  logSlowQuery: (operation: string, collection: string, duration: number, stats: any) => {
    if (duration > 1000) { // Log queries slower than 1 second
      PerformanceMetric.create({
        type: 'query',
        operation,
        collection,
        duration,
        documentsExamined: stats.totalDocsExamined || 0,
        documentsReturned: stats.totalDocsReturned || 0,
        indexUsed: stats.indexUsed || false,
        indexName: stats.indexName,
        queryPlan: stats.executionStats,
        timestamp: new Date()
      });
    }
  },

  // Monitor connection pool
  monitorConnections: () => {
    const connections = mongoose.connection.db.serverConfig.connections();
    PerformanceMetric.create({
      type: 'connection',
      operation: 'pool_status',
      collection: 'system',
      duration: 0,
      documentsExamined: connections.available,
      documentsReturned: connections.inUse,
      indexUsed: false,
      timestamp: new Date()
    });
  }
};
```

## 📚 Related Documentation

- [🏗️ System Architecture](./diagrams/system-architecture.md) - Visual system architecture
- [🧩 Component Structure](./component-structure.md) - Component relationships
- [👥 User Flows](./user-flows.md) - User interaction patterns
- [🔒 Security Architecture](../04-Backend/security-architecture.md) - Security implementation

---

*This database schema documentation provides comprehensive information about MWAP's data structure, relationships, and optimization strategies, ensuring efficient and secure data management in a multi-tenant environment.*