import { z } from 'zod';

// Base schema for project type validation
export const projectTypeSchema = z.object({
  _id: z.any(),
  name: z.string().min(3).max(50),
  description: z.string().max(500),
  configSchema: z.record(z.unknown()),
  isActive: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().optional() // Auth0 sub
});

// Schema for updating project types (partial, no configSchema changes allowed)
export const projectTypeUpdateSchema = projectTypeSchema
  .partial()
  .omit({ configSchema: true });

// Response schema for project type data
export const projectTypeResponseSchema = projectTypeSchema.extend({
  _id: z.string()
});

// Schema for creating a new project type
export const createProjectTypeSchema = projectTypeSchema
  .omit({ _id: true, createdAt: true, updatedAt: true, createdBy: true });

// Error codes for project type operations
export const ProjectTypeErrorCodes = {
  NOT_FOUND: 'project-type/not-found',
  NAME_EXISTS: 'project-type/name-exists',
  IN_USE: 'project-type/in-use',
  INVALID_CONFIG_SCHEMA: 'project-type/invalid-schema'
} as const;

// Types based on schemas
export type ProjectType = z.infer<typeof projectTypeSchema>;
export type ProjectTypeResponse = z.infer<typeof projectTypeResponseSchema>;
export type CreateProjectTypeRequest = z.infer<typeof createProjectTypeSchema>;
export type UpdateProjectTypeRequest = z.infer<typeof projectTypeUpdateSchema>;