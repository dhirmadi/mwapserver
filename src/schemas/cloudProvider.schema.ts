import { z } from 'zod';
import { ObjectId } from 'mongodb';

// Base schema for cloud provider validation
export const cloudProviderSchema = z.object({
  _id: z.instanceof(ObjectId),
  name: z.string().min(3).max(50),
  displayName: z.string().min(3).max(50).optional(), // Human-readable name for UI display
  slug: z.string().min(2).max(20).regex(/^[a-z0-9-]+$/),
  scopes: z.array(z.string()),
  authUrl: z.string().url(),
  tokenUrl: z.string().url(),
  // OAuth-specific fields
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  grantType: z.string().default("authorization_code"),
  tokenMethod: z.string().default("POST"),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string() // Auth0 sub
});

// Schema for creating a new cloud provider
export const createCloudProviderSchema = cloudProviderSchema
  .omit({ _id: true, createdAt: true, updatedAt: true, createdBy: true });

// Schema for updating cloud provider (partial)
export const updateCloudProviderSchema = cloudProviderSchema
  .partial()
  .omit({ _id: true, createdAt: true, updatedAt: true, createdBy: true });

// Response schema for cloud provider data
export const cloudProviderResponseSchema = cloudProviderSchema.extend({
  _id: z.string()
});

// Error codes for cloud provider operations
export const CloudProviderErrorCodes = {
  NOT_FOUND: 'cloud-provider/not-found',
  NAME_EXISTS: 'cloud-provider/name-exists',
  SLUG_EXISTS: 'cloud-provider/slug-exists',
  IN_USE: 'cloud-provider/in-use',
  INVALID_INPUT: 'cloud-provider/invalid-input'
} as const;

// Types based on schemas
export type CloudProvider = z.infer<typeof cloudProviderSchema>;
export type CloudProviderResponse = z.infer<typeof cloudProviderResponseSchema>;
export type CreateCloudProviderRequest = z.infer<typeof createCloudProviderSchema>;
export type UpdateCloudProviderRequest = z.infer<typeof updateCloudProviderSchema>;