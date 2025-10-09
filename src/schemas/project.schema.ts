import { z } from 'zod';
import { ObjectId } from 'mongodb';
// Project roles are now defined inline
import { sanitizeString } from '../utils/validate.js';

// Schema for project member
export const projectMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['OWNER', 'DEPUTY', 'MEMBER'])
});

const objectIdSchema = z
  .string()
  .refine((val) => ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
  });

// Base schema for project validation
export const projectSchema = z.object({
  _id: objectIdSchema,
  tenantId: objectIdSchema,
  projectTypeId: objectIdSchema,
  cloudIntegrationId: objectIdSchema,
  folderpath: z.string().min(1).transform(sanitizeString),
  name: z.string().min(1).max(100).transform(sanitizeString),
  description: z.string().max(500).transform(sanitizeString).optional(),
  archived: z.boolean().default(false),
  members: z.array(projectMemberSchema).max(10).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string() // Auth0 sub
});

// Schema for creating a new project
export const createProjectSchema = projectSchema
  .omit({ 
    _id: true, 
    createdAt: true, 
    updatedAt: true, 
    createdBy: true 
  });

// Schema for updating a project (partial)
export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).transform(sanitizeString).optional(),
  description: z.string().max(500).transform(sanitizeString).optional(),
  archived: z.boolean().optional()
});

// Schema for project member operations
export const projectMemberOperationSchema = z.object({
  userId: z.string(),
  role: z.enum(['OWNER', 'DEPUTY', 'MEMBER'])
});

// Schema for updating a project member's role
export const updateProjectMemberSchema = z.object({
  role: z.enum(['OWNER', 'DEPUTY', 'MEMBER'])
});

// Response schema for project data
export const projectResponseSchema = projectSchema
  .extend({
    _id: z.string(),
    tenantId: z.string(),
    projectTypeId: z.string(),
    cloudIntegrationId: z.string()
  });

// Error codes for project operations
export const ProjectErrorCodes = {
  NOT_FOUND: 'project/not-found',
  TENANT_NOT_FOUND: 'project/tenant-not-found',
  PROJECT_TYPE_NOT_FOUND: 'project/project-type-not-found',
  CLOUD_INTEGRATION_NOT_FOUND: 'project/cloud-integration-not-found',
  INVALID_INPUT: 'project/invalid-input',
  UNAUTHORIZED: 'project/unauthorized',
  MEMBER_NOT_FOUND: 'project/member-not-found',
  MEMBER_ALREADY_EXISTS: 'project/member-already-exists',
  OWNER_REQUIRED: 'project/owner-required',
  MAX_MEMBERS_REACHED: 'project/max-members-reached',
  IMMUTABLE_FIELD: 'project/immutable-field'
} as const;

// Types based on schemas
export type Project = z.infer<typeof projectSchema>;
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectSchema>;
export type UpdateProjectRequest = z.infer<typeof updateProjectSchema>;
export type ProjectMember = z.infer<typeof projectMemberSchema>;
export type ProjectMemberOperation = z.infer<typeof projectMemberOperationSchema>;
export type UpdateProjectMemberRequest = z.infer<typeof updateProjectMemberSchema>;