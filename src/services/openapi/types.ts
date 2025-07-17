/**
 * OpenAPI Route Discovery Types
 * 
 * Defines interfaces and types for automatic OpenAPI documentation generation
 * from Express routes and Zod schemas.
 */

export interface RouteMetadata {
  /** Full path pattern (e.g., '/api/v1/tenants/:id') */
  path: string;
  
  /** HTTP method (GET, POST, PATCH, DELETE, etc.) */
  method: string;
  
  /** Feature module name (tenants, projects, users, etc.) */
  feature: string;
  
  /** Applied middleware names */
  middleware: string[];
  
  /** Controller handler function name */
  handler: string;
  
  /** Extracted Swagger/JSDoc documentation */
  swaggerDoc?: any;
  
  /** Route-specific parameters */
  parameters?: RouteParameter[];
  
  /** Security requirements */
  security?: SecurityRequirement[];
}

export interface RouteParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  schema: any;
  description?: string;
}

export interface SecurityRequirement {
  type: 'jwt' | 'role' | 'tenant-owner' | 'super-admin';
  value?: string;
}

export interface FeatureRoutes {
  feature: string;
  basePath: string;
  routes: RouteMetadata[];
}

/**
 * Service interface for discovering and analyzing Express routes
 */
export interface RouteDiscoveryService {
  /**
   * Scan all feature routes and extract metadata
   */
  scanRoutes(): Promise<RouteMetadata[]>;
  
  /**
   * Extract middleware information from a route
   */
  extractMiddleware(route: any): string[];
  
  /**
   * Group routes by feature module
   */
  groupByFeature(routes: RouteMetadata[]): Record<string, RouteMetadata[]>;
  
  /**
   * Extract route parameters from path pattern
   */
  extractParameters(path: string): RouteParameter[];
  
  /**
   * Analyze security requirements from middleware
   */
  extractSecurity(middleware: string[]): SecurityRequirement[];
}

/**
 * Service interface for converting Zod schemas to OpenAPI schemas
 */
export interface SchemaGenerationService {
  /**
   * Convert a Zod schema to OpenAPI schema format
   */
  zodToOpenAPI(zodSchema: any, name?: string): any;
  
  /**
   * Generate request/response schemas for a route
   */
  generateRouteSchemas(route: RouteMetadata): {
    requestBody?: any;
    responses: Record<string, any>;
  };
  
  /**
   * Get all available Zod schemas from the schemas directory
   */
  getAllSchemas(): Promise<Record<string, any>>;
}

/**
 * Service interface for building complete OpenAPI documents
 */
export interface OpenAPIDocumentBuilder {
  /**
   * Build complete OpenAPI 3.1.0 specification
   */
  buildDocument(routes: RouteMetadata[]): Promise<any>;
  
  /**
   * Generate paths section from routes
   */
  generatePaths(routes: RouteMetadata[]): any;
  
  /**
   * Generate components section with schemas
   */
  generateComponents(): Promise<any>;
  
  /**
   * Generate security schemes
   */
  generateSecuritySchemes(): any;
}

/**
 * Cache configuration for OpenAPI generation
 */
export interface CacheConfig {
  /** Time-to-live in milliseconds */
  ttl: number;
  
  /** Maximum cache size */
  maxSize: number;
  
  /** Enable/disable caching */
  enabled: boolean;
}

/**
 * OpenAPI generation options
 */
export interface OpenAPIGenerationOptions {
  /** Include development-only endpoints */
  includeDev?: boolean;
  
  /** Filter by specific features */
  features?: string[];
  
  /** Cache configuration */
  cache?: CacheConfig;
  
  /** Validation options */
  validate?: boolean;
}