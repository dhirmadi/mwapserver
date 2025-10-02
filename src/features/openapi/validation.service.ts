/**
 * OpenAPI Validation Service
 * 
 * Provides comprehensive validation for OpenAPI specifications
 * including schema completeness, CI/CD integration, and monitoring
 */

import { logInfo, logError, logAudit } from '../../utils/logger.js';
import { openAPIService } from '../../services/openapi/index.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metrics: ValidationMetrics;
  timestamp: string;
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
  recommendation?: string;
}

export interface ValidationMetrics {
  totalPaths: number;
  totalOperations: number;
  documentedOperations: number;
  schemasCount: number;
  securitySchemesCount: number;
  coveragePercentage: number;
  validationTime: number;
  specificationSize: number;
}

export interface CIValidationConfig {
  enabled: boolean;
  failOnErrors: boolean;
  failOnWarnings: boolean;
  outputFormat: 'json' | 'junit' | 'text';
  reportPath?: string;
}

/**
 * OpenAPI Validation Service
 */
export class OpenAPIValidationService {
  private validationHistory: ValidationResult[] = [];
  private readonly maxHistorySize = 100;

  /**
   * Validate OpenAPI specification with comprehensive checks
   */
  async validateSpecification(): Promise<ValidationResult> {
    const startTime = Date.now();
    
    logInfo('Starting comprehensive OpenAPI validation');

    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      metrics: {
        totalPaths: 0,
        totalOperations: 0,
        documentedOperations: 0,
        schemasCount: 0,
        securitySchemesCount: 0,
        coveragePercentage: 0,
        validationTime: 0,
        specificationSize: 0
      },
      timestamp: new Date().toISOString()
    };

    try {
      // Generate the OpenAPI document
      const document = await openAPIService.generateDocument();
      const documentString = JSON.stringify(document);
      result.metrics.specificationSize = documentString.length;

      // Basic structure validation
      await this.validateBasicStructure(document, result);
      
      // Schema validation
      await this.validateSchemas(document, result);
      
      // Security validation
      await this.validateSecurity(document, result);
      
      // Path and operation validation
      await this.validatePathsAndOperations(document, result);
      
      // Performance validation
      await this.validatePerformance(document, result);
      
      // Calculate metrics
      this.calculateMetrics(document, result);
      
      // Determine overall validity
      result.valid = result.errors.length === 0;
      result.metrics.validationTime = Date.now() - startTime;

      // Store in history
      this.addToHistory(result);

      logInfo('OpenAPI validation completed', {
        valid: result.valid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        validationTime: result.metrics.validationTime,
        coveragePercentage: result.metrics.coveragePercentage
      });

      // Audit log for monitoring
      logAudit('OpenAPI specification validated', 'system', 'OpenAPI specification validated', {
        valid: result.valid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        coveragePercentage: result.metrics.coveragePercentage
      });

    } catch (error) {
      result.valid = false;
      result.errors.push({
        code: 'VALIDATION_FAILED',
        message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'critical'
      });
      
      logError('OpenAPI validation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return result;
  }

  /**
   * Validate basic OpenAPI document structure
   */
  private async validateBasicStructure(document: any, result: ValidationResult): Promise<void> {
    // OpenAPI version validation
    if (!document.openapi) {
      result.errors.push({
        code: 'MISSING_OPENAPI_VERSION',
        message: 'Missing OpenAPI version field',
        severity: 'critical'
      });
    } else if (!document.openapi.startsWith('3.')) {
      result.errors.push({
        code: 'INVALID_OPENAPI_VERSION',
        message: `Unsupported OpenAPI version: ${document.openapi}`,
        severity: 'error'
      });
    }

    // Info section validation
    if (!document.info) {
      result.errors.push({
        code: 'MISSING_INFO_SECTION',
        message: 'Missing info section',
        severity: 'critical'
      });
    } else {
      if (!document.info.title) {
        result.errors.push({
          code: 'MISSING_API_TITLE',
          message: 'Missing API title in info section',
          path: 'info.title',
          severity: 'error'
        });
      }
      
      if (!document.info.version) {
        result.errors.push({
          code: 'MISSING_API_VERSION',
          message: 'Missing API version in info section',
          path: 'info.version',
          severity: 'error'
        });
      }
      
      if (!document.info.description) {
        result.warnings.push({
          code: 'MISSING_API_DESCRIPTION',
          message: 'Missing API description in info section',
          path: 'info.description',
          recommendation: 'Add a comprehensive API description'
        });
      }
    }

    // Servers validation
    if (!document.servers || document.servers.length === 0) {
      result.warnings.push({
        code: 'MISSING_SERVERS',
        message: 'No servers defined',
        recommendation: 'Add server configurations for different environments'
      });
    }

    // Paths validation
    if (!document.paths) {
      result.errors.push({
        code: 'MISSING_PATHS_SECTION',
        message: 'Missing paths section',
        severity: 'critical'
      });
    } else if (Object.keys(document.paths).length === 0) {
      result.errors.push({
        code: 'NO_PATHS_DEFINED',
        message: 'No API paths defined',
        severity: 'critical'
      });
    }
  }

  /**
   * Validate schemas and components
   */
  private async validateSchemas(document: any, result: ValidationResult): Promise<void> {
    if (!document.components) {
      result.errors.push({
        code: 'MISSING_COMPONENTS_SECTION',
        message: 'Missing components section',
        severity: 'error'
      });
      return;
    }

    // Schema validation
    if (!document.components.schemas) {
      result.errors.push({
        code: 'MISSING_SCHEMAS',
        message: 'Missing schemas in components section',
        path: 'components.schemas',
        severity: 'error'
      });
    } else {
      const schemas = document.components.schemas;
      
      // Check for essential schemas
      const essentialSchemas = [
        'SuccessResponse',
        'ErrorResponse',
        'Tenant',
        'Project',
        'ProjectType',
        'CloudProvider'
      ];
      
      for (const schemaName of essentialSchemas) {
        if (!schemas[schemaName]) {
          result.warnings.push({
            code: 'MISSING_ESSENTIAL_SCHEMA',
            message: `Missing essential schema: ${schemaName}`,
            path: `components.schemas.${schemaName}`,
            recommendation: `Add ${schemaName} schema definition`
          });
        }
      }
      
      // Validate schema structure
      for (const [schemaName, schema] of Object.entries(schemas)) {
        this.validateSchemaStructure(schemaName, schema as any, result);
      }
    }

    // Response validation
    if (!document.components.responses) {
      result.warnings.push({
        code: 'MISSING_RESPONSE_COMPONENTS',
        message: 'Missing response components',
        path: 'components.responses',
        recommendation: 'Add reusable response components'
      });
    }
  }

  /**
   * Validate individual schema structure
   */
  private validateSchemaStructure(schemaName: string, schema: any, result: ValidationResult): void {
    if (!schema.type && !schema.$ref && !schema.allOf && !schema.oneOf && !schema.anyOf) {
      result.warnings.push({
        code: 'SCHEMA_MISSING_TYPE',
        message: `Schema ${schemaName} missing type definition`,
        path: `components.schemas.${schemaName}`,
        recommendation: 'Add explicit type definition'
      });
    }

    if (schema.type === 'object' && !schema.properties && !schema.additionalProperties) {
      result.warnings.push({
        code: 'OBJECT_SCHEMA_NO_PROPERTIES',
        message: `Object schema ${schemaName} has no properties defined`,
        path: `components.schemas.${schemaName}`,
        recommendation: 'Define object properties or allow additional properties'
      });
    }
  }

  /**
   * Validate security configuration
   */
  private async validateSecurity(document: any, result: ValidationResult): Promise<void> {
    if (!document.components?.securitySchemes) {
      result.errors.push({
        code: 'MISSING_SECURITY_SCHEMES',
        message: 'Missing security schemes in components',
        path: 'components.securitySchemes',
        severity: 'error'
      });
      return;
    }

    const securitySchemes = document.components.securitySchemes;
    
    // Check for JWT authentication
    if (!securitySchemes.bearerAuth) {
      result.errors.push({
        code: 'MISSING_JWT_AUTH',
        message: 'Missing JWT bearer authentication scheme',
        path: 'components.securitySchemes.bearerAuth',
        severity: 'error'
      });
    }

    // Validate security scheme structure
    for (const [schemeName, scheme] of Object.entries(securitySchemes)) {
      this.validateSecurityScheme(schemeName, scheme as any, result);
    }

    // Check global security
    if (!document.security && !this.hasOperationSecurity(document)) {
      result.warnings.push({
        code: 'NO_GLOBAL_SECURITY',
        message: 'No global security defined and not all operations have security',
        recommendation: 'Define global security or ensure all operations have security requirements'
      });
    }
  }

  /**
   * Validate security scheme structure
   */
  private validateSecurityScheme(schemeName: string, scheme: any, result: ValidationResult): void {
    if (!scheme.type) {
      result.errors.push({
        code: 'SECURITY_SCHEME_MISSING_TYPE',
        message: `Security scheme ${schemeName} missing type`,
        path: `components.securitySchemes.${schemeName}.type`,
        severity: 'error'
      });
    }

    if (scheme.type === 'http' && !scheme.scheme) {
      result.errors.push({
        code: 'HTTP_SECURITY_MISSING_SCHEME',
        message: `HTTP security scheme ${schemeName} missing scheme`,
        path: `components.securitySchemes.${schemeName}.scheme`,
        severity: 'error'
      });
    }
  }

  /**
   * Check if operations have security defined
   */
  private hasOperationSecurity(document: any): boolean {
    for (const path of Object.values(document.paths || {})) {
      for (const operation of Object.values(path as any)) {
        const op: any = operation as any;
        if (op && typeof op === 'object' && op.security) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Validate paths and operations
   */
  private async validatePathsAndOperations(document: any, result: ValidationResult): Promise<void> {
    if (!document.paths) return;

    for (const [pathName, pathItem] of Object.entries(document.paths)) {
      this.validatePath(pathName, pathItem as any, result);
    }
  }

  /**
   * Validate individual path
   */
  private validatePath(pathName: string, pathItem: any, result: ValidationResult): void {
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    
    for (const method of httpMethods) {
      if (pathItem[method]) {
        this.validateOperation(pathName, method, pathItem[method], result);
      }
    }
  }

  /**
   * Validate individual operation
   */
  private validateOperation(pathName: string, method: string, operation: any, result: ValidationResult): void {
    const operationId = `${method.toUpperCase()} ${pathName}`;
    
    // Summary validation
    if (!operation.summary && !operation.description) {
      result.warnings.push({
        code: 'OPERATION_MISSING_SUMMARY',
        message: `Operation ${operationId} missing summary or description`,
        path: `paths.${pathName}.${method}`,
        recommendation: 'Add operation summary or description'
      });
    }

    // Response validation
    if (!operation.responses) {
      result.errors.push({
        code: 'OPERATION_MISSING_RESPONSES',
        message: `Operation ${operationId} missing responses`,
        path: `paths.${pathName}.${method}.responses`,
        severity: 'error'
      });
    } else {
      this.validateOperationResponses(operationId, operation.responses, result);
    }

    // Tags validation
    if (!operation.tags || operation.tags.length === 0) {
      result.warnings.push({
        code: 'OPERATION_MISSING_TAGS',
        message: `Operation ${operationId} missing tags`,
        path: `paths.${pathName}.${method}.tags`,
        recommendation: 'Add appropriate tags for operation grouping'
      });
    }

    // Request body validation for POST/PUT/PATCH
    if (['post', 'put', 'patch'].includes(method) && !operation.requestBody) {
      result.warnings.push({
        code: 'OPERATION_MISSING_REQUEST_BODY',
        message: `Operation ${operationId} missing request body`,
        path: `paths.${pathName}.${method}.requestBody`,
        recommendation: 'Add request body schema for data operations'
      });
    }

    // Parameter validation for parameterized paths
    if (pathName.includes('{') && (!operation.parameters || operation.parameters.length === 0)) {
      result.warnings.push({
        code: 'PARAMETERIZED_PATH_MISSING_PARAMS',
        message: `Parameterized path ${operationId} missing parameter definitions`,
        path: `paths.${pathName}.${method}.parameters`,
        recommendation: 'Add parameter definitions for path parameters'
      });
    }
  }

  /**
   * Validate operation responses
   */
  private validateOperationResponses(operationId: string, responses: any, result: ValidationResult): void {
    // Check for success responses
    const successCodes = ['200', '201', '202', '204'];
    const hasSuccessResponse = successCodes.some(code => responses[code]);
    
    if (!hasSuccessResponse) {
      result.warnings.push({
        code: 'OPERATION_MISSING_SUCCESS_RESPONSE',
        message: `Operation ${operationId} missing success response`,
        recommendation: 'Add appropriate success response (200, 201, 202, or 204)'
      });
    }

    // Check for error responses
    const errorCodes = ['400', '401', '403', '404', '500'];
    const missingErrorCodes = errorCodes.filter(code => !responses[code]);
    
    if (missingErrorCodes.length > 0) {
      result.warnings.push({
        code: 'OPERATION_MISSING_ERROR_RESPONSES',
        message: `Operation ${operationId} missing error responses: ${missingErrorCodes.join(', ')}`,
        recommendation: 'Add comprehensive error response documentation'
      });
    }
  }

  /**
   * Validate performance characteristics
   */
  private async validatePerformance(document: any, result: ValidationResult): Promise<void> {
    const documentSize = JSON.stringify(document).length;
    
    // Size validation
    if (documentSize > 1024 * 1024) { // 1MB
      result.warnings.push({
        code: 'LARGE_SPECIFICATION_SIZE',
        message: `OpenAPI specification is large (${Math.round(documentSize / 1024)}KB)`,
        recommendation: 'Consider splitting into multiple specifications or optimizing schema definitions'
      });
    }

    // Complexity validation
    const pathCount = Object.keys(document.paths || {}).length;
    const schemaCount = Object.keys(document.components?.schemas || {}).length;
    
    if (pathCount > 100) {
      result.warnings.push({
        code: 'HIGH_PATH_COUNT',
        message: `High number of paths (${pathCount})`,
        recommendation: 'Consider API versioning or modularization'
      });
    }

    if (schemaCount > 200) {
      result.warnings.push({
        code: 'HIGH_SCHEMA_COUNT',
        message: `High number of schemas (${schemaCount})`,
        recommendation: 'Consider schema optimization or modularization'
      });
    }
  }

  /**
   * Calculate validation metrics
   */
  private calculateMetrics(document: any, result: ValidationResult): void {
    result.metrics.totalPaths = Object.keys(document.paths || {}).length;
    result.metrics.schemasCount = Object.keys(document.components?.schemas || {}).length;
    result.metrics.securitySchemesCount = Object.keys(document.components?.securitySchemes || {}).length;

    // Count operations
    let totalOperations = 0;
    let documentedOperations = 0;

    for (const pathItem of Object.values(document.paths || {})) {
      const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
      
      for (const method of httpMethods) {
        if ((pathItem as any)[method]) {
          totalOperations++;
          
          const operation = (pathItem as any)[method];
          if (operation.summary || operation.description) {
            documentedOperations++;
          }
        }
      }
    }

    result.metrics.totalOperations = totalOperations;
    result.metrics.documentedOperations = documentedOperations;
    result.metrics.coveragePercentage = totalOperations > 0 
      ? Math.round((documentedOperations / totalOperations) * 100)
      : 0;
  }

  /**
   * Add validation result to history
   */
  private addToHistory(result: ValidationResult): void {
    this.validationHistory.unshift(result);
    
    // Keep only the most recent results
    if (this.validationHistory.length > this.maxHistorySize) {
      this.validationHistory = this.validationHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get validation history
   */
  getValidationHistory(limit: number = 10): ValidationResult[] {
    return this.validationHistory.slice(0, limit);
  }

  /**
   * Generate CI/CD validation report
   */
  async generateCIReport(config: CIValidationConfig): Promise<string> {
    const validation = await this.validateSpecification();
    
    switch (config.outputFormat) {
      case 'json':
        return JSON.stringify(validation, null, 2);
      
      case 'junit':
        return this.generateJUnitReport(validation);
      
      case 'text':
      default:
        return this.generateTextReport(validation);
    }
  }

  /**
   * Generate JUnit XML report
   */
  private generateJUnitReport(validation: ValidationResult): string {
    const testCount = validation.errors.length + validation.warnings.length;
    const failureCount = validation.errors.length;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="OpenAPI Validation" tests="${testCount}" failures="${failureCount}" time="${validation.metrics.validationTime / 1000}">`;

    // Add error tests
    for (const error of validation.errors) {
      xml += `
  <testcase name="${error.code}" classname="OpenAPI.Validation">
    <failure message="${error.message}" type="${error.severity}">
      Path: ${error.path || 'N/A'}
      Message: ${error.message}
    </failure>
  </testcase>`;
    }

    // Add warning tests
    for (const warning of validation.warnings) {
      xml += `
  <testcase name="${warning.code}" classname="OpenAPI.Validation">
    <system-out>
      Path: ${warning.path || 'N/A'}
      Message: ${warning.message}
      Recommendation: ${warning.recommendation || 'N/A'}
    </system-out>
  </testcase>`;
    }

    xml += `
</testsuite>`;

    return xml;
  }

  /**
   * Generate text report
   */
  private generateTextReport(validation: ValidationResult): string {
    let report = `OpenAPI Validation Report
========================

Status: ${validation.valid ? 'PASSED' : 'FAILED'}
Timestamp: ${validation.timestamp}
Validation Time: ${validation.metrics.validationTime}ms

Metrics:
- Total Paths: ${validation.metrics.totalPaths}
- Total Operations: ${validation.metrics.totalOperations}
- Documented Operations: ${validation.metrics.documentedOperations}
- Coverage: ${validation.metrics.coveragePercentage}%
- Schemas: ${validation.metrics.schemasCount}
- Security Schemes: ${validation.metrics.securitySchemesCount}
- Specification Size: ${Math.round(validation.metrics.specificationSize / 1024)}KB

`;

    if (validation.errors.length > 0) {
      report += `Errors (${validation.errors.length}):
`;
      validation.errors.forEach((error, index) => {
        report += `${index + 1}. [${error.code}] ${error.message}`;
        if (error.path) report += ` (${error.path})`;
        report += '\n';
      });
      report += '\n';
    }

    if (validation.warnings.length > 0) {
      report += `Warnings (${validation.warnings.length}):
`;
      validation.warnings.forEach((warning, index) => {
        report += `${index + 1}. [${warning.code}] ${warning.message}`;
        if (warning.path) report += ` (${warning.path})`;
        if (warning.recommendation) report += `\n   Recommendation: ${warning.recommendation}`;
        report += '\n';
      });
    }

    return report;
  }

  /**
   * Monitor validation errors
   */
  async monitorValidation(): Promise<void> {
    try {
      const validation = await this.validateSpecification();
      
      // Log critical errors
      const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
      if (criticalErrors.length > 0) {
        logError('Critical OpenAPI validation errors detected', {
          errorCount: criticalErrors.length,
          errors: criticalErrors.map(e => ({ code: e.code, message: e.message }))
        });
      }

      // Log performance issues
      if (validation.metrics.validationTime > 5000) { // 5 seconds
        logError('OpenAPI validation performance issue', {
          validationTime: validation.metrics.validationTime,
          specificationSize: validation.metrics.specificationSize
        });
      }

      // Log coverage issues
      if (validation.metrics.coveragePercentage < 80) {
        logError('Low OpenAPI documentation coverage', {
          coveragePercentage: validation.metrics.coveragePercentage,
          totalOperations: validation.metrics.totalOperations,
          documentedOperations: validation.metrics.documentedOperations
        });
      }

    } catch (error) {
      logError('OpenAPI validation monitoring failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Export singleton instance
export const openAPIValidationService = new OpenAPIValidationService();