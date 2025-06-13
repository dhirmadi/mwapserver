import { z } from 'zod';

// Schema for project role
export const projectRoleSchema = z.object({
  projectId: z.string(),
  role: z.enum(['OWNER', 'DEPUTY', 'MEMBER'])
});

// Schema for user roles response
export const userRolesResponseSchema = z.object({
  userId: z.string(),
  isSuperAdmin: z.boolean(),
  isTenantOwner: z.boolean(),
  tenantId: z.string().nullable(),
  projectRoles: z.array(projectRoleSchema)
});

// Types based on schemas
export type ProjectRole = z.infer<typeof projectRoleSchema>;
export type UserRolesResponse = z.infer<typeof userRolesResponseSchema>;