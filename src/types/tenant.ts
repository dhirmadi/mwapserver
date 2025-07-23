/**
 * Tenant Type Definitions
 * 
 * TypeScript interfaces for tenant-related data structures
 */

export interface Tenant {
  _id: string;
  name: string;
  ownerId: string;
  settings: {
    allowPublicProjects: boolean;
    maxProjects: number;
  };
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
}

export interface TenantMember {
  tenantId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  addedAt: Date;
  addedBy: string;
  active: boolean;
}

export interface TenantSettings {
  allowPublicProjects: boolean;
  maxProjects: number;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  enableAuditLogging?: boolean;
  defaultProjectType?: string;
}

export interface CreateTenantData {
  name: string;
  ownerId: string;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantData {
  name?: string;
  settings?: Partial<TenantSettings>;
  archived?: boolean;
} 