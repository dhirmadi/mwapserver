/**
 * OpenAPI Endpoint Schemas
 * 
 * Zod validation schemas for OpenAPI documentation endpoints
 */

import { z } from 'zod';

// Schema for OpenAPI info response
export const openAPIInfoSchema = z.object({
  title: z.string(),
  version: z.string(),
  description: z.string(),
  contact: z.object({
    name: z.string(),
    url: z.string(),
    email: z.string()
  }),
  license: z.object({
    name: z.string(),
    url: z.string()
  }),
  servers: z.array(z.object({
    url: z.string(),
    description: z.string()
  })),
  pathCount: z.number(),
  schemaCount: z.number(),
  tagCount: z.number()
});

// Schema for OpenAPI specification response
export const openAPISpecSchema = z.object({
  openapi: z.string(),
  info: z.object({
    title: z.string(),
    version: z.string(),
    description: z.string(),
    contact: z.object({
      name: z.string(),
      url: z.string(),
      email: z.string()
    }),
    license: z.object({
      name: z.string(),
      url: z.string()
    }),
    termsOfService: z.string()
  }),
  servers: z.array(z.object({
    url: z.string(),
    description: z.string()
  })),
  paths: z.record(z.any()),
  components: z.object({
    schemas: z.record(z.any()),
    securitySchemes: z.record(z.any()),
    responses: z.record(z.any()).optional(),
    parameters: z.record(z.any()).optional()
  }),
  security: z.array(z.record(z.array(z.string()))),
  tags: z.array(z.object({
    name: z.string(),
    description: z.string()
  }))
});

// Schema for cache status response
export const cacheStatusSchema = z.object({
  cached: z.boolean(),
  age: z.number(),
  ttl: z.number(),
  lastGenerated: z.string().optional()
});

// Query parameters for OpenAPI endpoints
export const openAPIQuerySchema = z.object({
  format: z.enum(['json', 'yaml']).optional().default('json'),
  includeExamples: z.boolean().optional().default(false),
  minify: z.boolean().optional().default(false)
});

// Types based on schemas
export type OpenAPIInfo = z.infer<typeof openAPIInfoSchema>;
export type OpenAPISpec = z.infer<typeof openAPISpecSchema>;
export type CacheStatus = z.infer<typeof cacheStatusSchema>;
export type OpenAPIQuery = z.infer<typeof openAPIQuerySchema>;