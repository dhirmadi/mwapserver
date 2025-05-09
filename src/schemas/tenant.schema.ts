import { z } from 'zod';
import { ObjectId } from 'mongodb';

// Tenant settings schema
export const tenantSettingsSchema = z.object({
  allowPublicProjects: z.boolean().default(false),
  maxProjects: z.number().int().min(1).max(100).default(10)
});

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;

// Base tenant schema
export const tenantSchema = z.object({
  _id: z.instanceof(ObjectId),
  name: z.string().min(3).max(50),
  ownerId: z.string(), // Auth0 sub
  settings: tenantSettingsSchema.default({
    allowPublicProjects: false,
    maxProjects: 10
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  archived: z.boolean().default(false)
});

export type Tenant = z.infer<typeof tenantSchema>;

// Create tenant request schema
export const createTenantSchema = z.object({
  name: z.string().min(3).max(50),
  settings: z.object({
    allowPublicProjects: z.boolean().optional(),
    maxProjects: z.number().int().min(1).max(100).optional()
  }).optional()
});

export type CreateTenantRequest = z.infer<typeof createTenantSchema>;

// Update tenant request schema
export const updateTenantSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  settings: tenantSettingsSchema.partial().optional(),
  archived: z.boolean().optional()
});

export type UpdateTenantRequest = z.infer<typeof updateTenantSchema>;

// Tenant response schema (for API responses)
export const tenantResponseSchema = tenantSchema.transform((tenant) => ({
  id: tenant._id.toString(),
  name: tenant.name,
  ownerId: tenant.ownerId,
  settings: tenant.settings,
  createdAt: tenant.createdAt.toISOString(),
  updatedAt: tenant.updatedAt.toISOString(),
  archived: tenant.archived
}));

export type TenantResponse = z.infer<typeof tenantResponseSchema>;