/**
 * OpenAPI Service
 * 
 * Business logic for OpenAPI documentation endpoints
 */

import { openAPIService } from '../../services/openapi/index.js';
import { logInfo, logError } from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';
import { ERROR_CODES } from '../../utils/constants.js';
import { OpenAPIInfo, CacheStatus, OpenAPIQuery } from './openapi.schemas.js';

export class OpenAPIFeatureService {
  /**
   * Get complete OpenAPI specification
   */
  async getOpenAPISpecification(query: OpenAPIQuery): Promise<any> {
    try {
      logInfo('Generating OpenAPI specification', { 
        format: query.format,
        includeExamples: query.includeExamples,
        minify: query.minify
      });

      const document = await openAPIService.generateDocument();

      // Apply query parameters
      let result = document;

      if (!query.includeExamples) {
        // Remove examples from the document if not requested
        result = this.removeExamples(document);
      }

      if (query.minify) {
        // Minify the document by removing descriptions and other verbose fields
        result = this.minifyDocument(result);
      }

      if (query.format === 'yaml') {
        // Convert to YAML format
        const yaml = await import('yaml');
        return yaml.stringify(result);
      }

      return result;
    } catch (error) {
      logError('Failed to generate OpenAPI specification', {
        error: error instanceof Error ? error.message : String(error),
        query
      });
      
      throw new ApiError(
        'Failed to generate OpenAPI specification',
        500,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  }

  /**
   * Get OpenAPI information summary
   */
  async getOpenAPIInfo(): Promise<OpenAPIInfo> {
    try {
      logInfo('Generating OpenAPI information summary');
      
      const info = await openAPIService.generateInfo();
      
      logInfo('OpenAPI information generated successfully', {
        pathCount: info.pathCount,
        schemaCount: info.schemaCount,
        tagCount: info.tagCount
      });

      return info;
    } catch (error) {
      logError('Failed to generate OpenAPI information', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new ApiError(
        'Failed to generate OpenAPI information',
        500,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  }

  /**
   * Get cache status
   */
  getCacheStatus(): CacheStatus {
    try {
      const status = openAPIService.getCacheStatus();
      
      return {
        cached: status.cached,
        age: status.age,
        ttl: status.ttl,
        lastGenerated: status.cached ? new Date(Date.now() - status.age).toISOString() : undefined
      };
    } catch (error) {
      logError('Failed to get cache status', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new ApiError(
        'Failed to get cache status',
        500,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  }

  /**
   * Invalidate OpenAPI cache
   */
  invalidateCache(): void {
    try {
      logInfo('Invalidating OpenAPI cache');
      openAPIService.invalidateCache();
      logInfo('OpenAPI cache invalidated successfully');
    } catch (error) {
      logError('Failed to invalidate cache', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new ApiError(
        'Failed to invalidate cache',
        500,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  }

  /**
   * Remove examples from OpenAPI document
   */
  private removeExamples(document: any): any {
    const result = JSON.parse(JSON.stringify(document));
    
    const removeExamplesRecursive = (obj: any) => {
      if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          obj.forEach(removeExamplesRecursive);
        } else {
          // Remove example and examples fields
          delete obj.example;
          delete obj.examples;
          
          // Recursively process nested objects
          Object.values(obj).forEach(removeExamplesRecursive);
        }
      }
    };

    removeExamplesRecursive(result);
    return result;
  }

  /**
   * Minify OpenAPI document by removing verbose fields
   */
  private minifyDocument(document: any): any {
    const result = JSON.parse(JSON.stringify(document));
    
    const minifyRecursive = (obj: any) => {
      if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          obj.forEach(minifyRecursive);
        } else {
          // Remove verbose fields
          delete obj.description;
          delete obj.summary;
          delete obj.example;
          delete obj.examples;
          
          // Keep only essential fields for paths
          if (obj.operationId) {
            const essential = {
              operationId: obj.operationId,
              tags: obj.tags,
              parameters: obj.parameters,
              requestBody: obj.requestBody,
              responses: obj.responses,
              security: obj.security
            };
            Object.keys(obj).forEach(key => {
              if (!essential.hasOwnProperty(key)) {
                delete obj[key];
              }
            });
          }
          
          // Recursively process nested objects
          Object.values(obj).forEach(minifyRecursive);
        }
      }
    };

    minifyRecursive(result);
    return result;
  }

  /**
   * Validate OpenAPI specification
   */
  async validateSpecification(): Promise<{ valid: boolean; errors: string[] }> {
    try {
      logInfo('Validating OpenAPI specification');
      
      const document = await openAPIService.generateDocument();
      
      // Basic validation checks
      const errors: string[] = [];
      
      if (!document.openapi) {
        errors.push('Missing openapi version');
      }
      
      if (!document.info) {
        errors.push('Missing info section');
      }
      
      if (!document.paths || Object.keys(document.paths).length === 0) {
        errors.push('No paths defined');
      }
      
      if (!document.components?.schemas || Object.keys(document.components.schemas).length === 0) {
        errors.push('No schemas defined');
      }

      // Check for required security schemes
      if (!document.components?.securitySchemes?.bearerAuth) {
        errors.push('Missing bearerAuth security scheme');
      }

      const valid = errors.length === 0;
      
      logInfo('OpenAPI specification validation completed', {
        valid,
        errorCount: errors.length
      });

      return { valid, errors };
    } catch (error) {
      logError('Failed to validate OpenAPI specification', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        valid: false,
        errors: ['Validation failed due to generation error']
      };
    }
  }
}