/**
 * OpenAPI Services
 * 
 * Centralized exports for all OpenAPI generation services
 */

export * from './types.js';
export { routeDiscoveryService } from './RouteDiscoveryService.js';
export { schemaGenerationService } from './SchemaGenerationService.js';
export { openAPIDocumentBuilder } from './OpenAPIDocumentBuilder.js';

// Main service orchestrator
import { routeDiscoveryService } from './RouteDiscoveryService.js';
import { openAPIDocumentBuilder } from './OpenAPIDocumentBuilder.js';
import { logInfo, logError } from '../../utils/logger.js';

/**
 * Main OpenAPI generation service that orchestrates all other services
 */
export class OpenAPIService {
  private cachedDocument: any = null;
  private cacheTimestamp: number = 0;
  private readonly cacheTTL = process.env.NODE_ENV === 'production' ? 3600000 : 300000; // 1 hour prod, 5 min dev

  /**
   * Generate complete OpenAPI document
   */
  async generateDocument(): Promise<any> {
    const now = Date.now();
    
    // Return cached document if still valid
    if (this.cachedDocument && (now - this.cacheTimestamp) < this.cacheTTL) {
      logInfo('Returning cached OpenAPI document');
      return this.cachedDocument;
    }

    try {
      logInfo('Generating fresh OpenAPI document');
      
      // Discover all routes
      const routes = await routeDiscoveryService.scanRoutes();
      
      // Build complete document
      const document = await openAPIDocumentBuilder.buildDocument(routes);
      
      // Cache the result
      this.cachedDocument = document;
      this.cacheTimestamp = now;
      
      logInfo('OpenAPI document generated and cached successfully', {
        routeCount: routes.length,
        pathCount: Object.keys(document.paths || {}).length
      });
      
      return document;
    } catch (error) {
      logError('Failed to generate OpenAPI document', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Generate API info summary
   */
  async generateInfo(): Promise<any> {
    const document = await this.generateDocument();
    return {
      title: document.info.title,
      version: document.info.version,
      description: document.info.description,
      contact: document.info.contact,
      license: document.info.license,
      servers: document.servers,
      pathCount: Object.keys(document.paths || {}).length,
      schemaCount: Object.keys(document.components?.schemas || {}).length,
      tagCount: (document.tags || []).length
    };
  }

  /**
   * Invalidate cache (useful for development or when schemas change)
   */
  invalidateCache(): void {
    this.cachedDocument = null;
    this.cacheTimestamp = 0;
    logInfo('OpenAPI document cache invalidated');
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { cached: boolean; age: number; ttl: number } {
    const now = Date.now();
    const age = now - this.cacheTimestamp;
    
    return {
      cached: this.cachedDocument !== null && age < this.cacheTTL,
      age,
      ttl: this.cacheTTL
    };
  }
}

// Export singleton instance
export const openAPIService = new OpenAPIService();