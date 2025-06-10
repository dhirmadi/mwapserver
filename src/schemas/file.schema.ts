import { z } from 'zod';

// File status enum
export const FileStatus = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  ERROR: 'error'
} as const;

// Schema for virtual file validation
export const fileSchema = z.object({
  fileId: z.string(),
  name: z.string(),
  mimeType: z.string(),
  path: z.string(),
  status: z.enum([FileStatus.PENDING, FileStatus.PROCESSED, FileStatus.ERROR]),
  size: z.number().optional(),
  createdAt: z.string().or(z.date()).optional(),
  modifiedAt: z.string().or(z.date()).optional(),
  metadata: z.record(z.any()).optional()
});

// Schema for file query parameters
export const fileQuerySchema = z.object({
  folder: z.string().optional(),
  recursive: z.boolean().optional().default(false),
  fileTypes: z.array(z.string()).optional(),
  limit: z.number().optional().default(100),
  page: z.number().optional().default(1)
});

// Error codes for file operations
export const FileErrorCodes = {
  NOT_FOUND: 'file/not-found',
  PROJECT_NOT_FOUND: 'file/project-not-found',
  CLOUD_INTEGRATION_NOT_FOUND: 'file/cloud-integration-not-found',
  CLOUD_PROVIDER_ERROR: 'file/cloud-provider-error',
  UNAUTHORIZED: 'file/unauthorized',
  INVALID_PATH: 'file/invalid-path',
  INVALID_QUERY: 'file/invalid-query',
  INTEGRATION_ERROR: 'file/integration-error',
  TOKEN_EXPIRED: 'file/token-expired'
} as const;

// Types based on schemas
export type File = z.infer<typeof fileSchema>;
export type FileQuery = z.infer<typeof fileQuerySchema>;