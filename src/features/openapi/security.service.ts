/**
 * OpenAPI Security Service
 * 
 * Provides security hardening, schema sanitization, and audit logging
 * for OpenAPI documentation endpoints
 */

import { logInfo, logError, logAudit } from '../../utils/logger.js';
import { openAPIService } from '../../services/openapi/index.js';

export interface SecurityAuditResult {
  secure: boolean;
  vulnerabilities: SecurityVulnerability[];
  warnings: SecurityWarning[];
  sanitizationApplied: boolean;
  timestamp: string;
}

export interface SecurityVulnerability {
  type: 'sensitive_data' | 'schema_exposure' | 'auth_bypass' | 'injection_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  recommendation: string;
}

export interface SecurityWarning {
  type: string;
  description: string;
  location: string;
  recommendation: string;
}

export interface SanitizationConfig {
  removeSensitiveFields: boolean;
  maskInternalIds: boolean;
  removeExamples: boolean;
  sanitizeDescriptions: boolean;
  removeInternalEndpoints: boolean;
}

export interface AccessAuditEntry {
  userId: string;
  userEmail: string;
  endpoint: string;
  method: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  errorCode?: string;
}

/**
 * OpenAPI Security Service
 */
export class OpenAPISecurityService {
  private accessAuditLog: AccessAuditEntry[] = [];
  private readonly maxAuditLogSize = 10000;
  private sanitizationConfig: SanitizationConfig;

  // Sensitive field patterns to remove from documentation
  private readonly sensitiveFieldPatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /credential/i,
    /auth/i,
    /session/i,
    /cookie/i,
    /jwt/i,
    /bearer/i,
    /api[_-]?key/i,
    /access[_-]?token/i,
    /refresh[_-]?token/i,
    /private[_-]?key/i,
    /client[_-]?secret/i
  ];

  // Internal field patterns to mask
  private readonly internalFieldPatterns = [
    /^_id$/,
    /^__v$/,
    /^_.*$/,
    /internal/i,
    /system/i,
    /admin/i,
    /debug/i
  ];

  // Sensitive endpoints to exclude from public documentation
  private readonly sensitiveEndpointPatterns = [
    /\/admin\//i,
    /\/internal\//i,
    /\/debug\//i,
    /\/system\//i,
    /\/health\//i,
    /\/metrics\//i
  ];

  constructor() {
    this.sanitizationConfig = {
      removeSensitiveFields: true,
      maskInternalIds: true,
      removeExamples: process.env.NODE_ENV === 'production',
      sanitizeDescriptions: true,
      removeInternalEndpoints: process.env.NODE_ENV === 'production'
    };
  }

  /**
   * Perform comprehensive security audit
   */
  async performSecurityAudit(): Promise<SecurityAuditResult> {
    logInfo('Starting OpenAPI security audit');

    const result: SecurityAuditResult = {
      secure: true,
      vulnerabilities: [],
      warnings: [],
      sanitizationApplied: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Get the raw OpenAPI document
      const document = await openAPIService.generateDocument();

      // Check for sensitive data exposure
      await this.auditSensitiveDataExposure(document, result);

      // Check schema security
      await this.auditSchemasSecurity(document, result);

      // Check authentication enforcement
      await this.auditAuthenticationEnforcement(document, result);

      // Check for injection risks
      await this.auditInjectionRisks(document, result);

      // Check endpoint security
      await this.auditEndpointSecurity(document, result);

      // Determine overall security status
      result.secure = result.vulnerabilities.filter(v => v.severity === 'high' || v.severity === 'critical').length === 0;

      logInfo('Security audit completed', {
        secure: result.secure,
        vulnerabilityCount: result.vulnerabilities.length,
        warningCount: result.warnings.length
      });

      // Audit log the security check
      logAudit('OpenAPI security audit performed', 'system', 'OpenAPI security audit performed', {
        secure: result.secure,
        vulnerabilityCount: result.vulnerabilities.length,
        criticalVulnerabilities: result.vulnerabilities.filter(v => v.severity === 'critical').length,
        highVulnerabilities: result.vulnerabilities.filter(v => v.severity === 'high').length
      });

      return result;

    } catch (error) {
      logError('Security audit failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      result.secure = false;
      result.vulnerabilities.push({
        type: 'schema_exposure',
        severity: 'critical',
        description: 'Security audit failed - unable to verify security',
        location: 'audit_system',
        recommendation: 'Investigate audit system failure and ensure security checks are working'
      });

      return result;
    }
  }

  /**
   * Sanitize OpenAPI document for public consumption
   */
  async sanitizeDocument(document: any): Promise<any> {
    logInfo('Sanitizing OpenAPI document for security');

    const sanitizedDocument = JSON.parse(JSON.stringify(document)); // Deep clone

    try {
      // Remove sensitive fields from schemas
      if (this.sanitizationConfig.removeSensitiveFields) {
        this.sanitizeSchemas(sanitizedDocument);
      }

      // Mask internal IDs
      if (this.sanitizationConfig.maskInternalIds) {
        this.maskInternalFields(sanitizedDocument);
      }

      // Remove examples in production
      if (this.sanitizationConfig.removeExamples) {
        this.removeExamples(sanitizedDocument);
      }

      // Sanitize descriptions
      if (this.sanitizationConfig.sanitizeDescriptions) {
        this.sanitizeDescriptions(sanitizedDocument);
      }

      // Remove internal endpoints
      if (this.sanitizationConfig.removeInternalEndpoints) {
        this.removeInternalEndpoints(sanitizedDocument);
      }

      logInfo('Document sanitization completed');

      return sanitizedDocument;

    } catch (error) {
      logError('Document sanitization failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      // Return original document if sanitization fails
      return document;
    }
  }

  /**
   * Log access to documentation endpoints
   */
  logDocumentationAccess(
    userId: string,
    userEmail: string,
    endpoint: string,
    method: string,
    ip: string,
    userAgent: string,
    success: boolean,
    errorCode?: string
  ): void {
    const auditEntry: AccessAuditEntry = {
      userId,
      userEmail,
      endpoint,
      method,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      success,
      errorCode
    };

    // Add to audit log
    this.accessAuditLog.unshift(auditEntry);

    // Maintain log size
    if (this.accessAuditLog.length > this.maxAuditLogSize) {
      this.accessAuditLog = this.accessAuditLog.slice(0, this.maxAuditLogSize);
    }

    // Log to system audit
    logAudit('OpenAPI documentation access', auditEntry);

    // Alert on suspicious activity
    this.detectSuspiciousActivity(auditEntry);
  }

  /**
   * Validate JWT authentication enforcement
   */
  async validateJWTEnforcement(): Promise<boolean> {
    try {
      const document = await openAPIService.generateDocument();

      // Check if security schemes include JWT
      const securitySchemes = document.components?.securitySchemes || {};
      const hasJWTAuth = Object.values(securitySchemes).some((scheme: any) => 
        scheme.type === 'http' && scheme.scheme === 'bearer'
      );

      if (!hasJWTAuth) {
        logError('JWT authentication scheme not found in OpenAPI document');
        return false;
      }

      // Check if global security is defined or all operations have security
      const hasGlobalSecurity = document.security && document.security.length > 0;
      const allOperationsSecured = this.checkAllOperationsSecured(document);

      if (!hasGlobalSecurity && !allOperationsSecured) {
        logError('Not all operations are secured with JWT authentication');
        return false;
      }

      logInfo('JWT authentication enforcement validated successfully');
      return true;

    } catch (error) {
      logError('JWT enforcement validation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Get access audit log
   */
  getAccessAuditLog(limit: number = 100): AccessAuditEntry[] {
    return this.accessAuditLog.slice(0, limit);
  }

  /**
   * Get sanitization configuration
   */
  getSanitizationConfig(): SanitizationConfig {
    return { ...this.sanitizationConfig };
  }

  /**
   * Update sanitization configuration
   */
  updateSanitizationConfig(config: Partial<SanitizationConfig>): void {
    this.sanitizationConfig = { ...this.sanitizationConfig, ...config };
    
    logInfo('Sanitization configuration updated', {
      newConfig: this.sanitizationConfig
    });
  }

  /**
   * Audit sensitive data exposure
   */
  private async auditSensitiveDataExposure(document: any, result: SecurityAuditResult): Promise<void> {
    const schemas = document.components?.schemas || {};

    for (const [schemaName, schema] of Object.entries(schemas)) {
      this.auditSchemaForSensitiveData(schemaName, schema as any, result);
    }

    // Check examples for sensitive data
    this.auditExamplesForSensitiveData(document, result);
  }

  /**
   * Audit individual schema for sensitive data
   */
  private auditSchemaForSensitiveData(schemaName: string, schema: any, result: SecurityAuditResult): void {
    if (schema.properties) {
      for (const [propertyName, property] of Object.entries(schema.properties)) {
        // Check if property name matches sensitive patterns
        const isSensitive = this.sensitiveFieldPatterns.some(pattern => pattern.test(propertyName));
        
        if (isSensitive) {
          result.vulnerabilities.push({
            type: 'sensitive_data',
            severity: 'high',
            description: `Sensitive field '${propertyName}' exposed in schema '${schemaName}'`,
            location: `components.schemas.${schemaName}.properties.${propertyName}`,
            recommendation: 'Remove sensitive fields from public API documentation or mark as internal'
          });
        }

        // Check property description for sensitive information
        const prop = property as any;
        if (prop.description && this.containsSensitiveInfo(prop.description)) {
          result.warnings.push({
            type: 'sensitive_description',
            description: `Property description may contain sensitive information in '${schemaName}.${propertyName}'`,
            location: `components.schemas.${schemaName}.properties.${propertyName}.description`,
            recommendation: 'Review and sanitize property descriptions'
          });
        }
      }
    }
  }

  /**
   * Audit examples for sensitive data
   */
  private auditExamplesForSensitiveData(document: any, result: SecurityAuditResult): void {
    // This would recursively check all examples in the document
    // Implementation would traverse the entire document structure
    // For brevity, showing the concept
    
    if (document.components?.examples) {
      for (const [exampleName, example] of Object.entries(document.components.examples)) {
        const exampleValue = (example as any).value;
        if (exampleValue && this.containsSensitiveData(exampleValue)) {
          result.vulnerabilities.push({
            type: 'sensitive_data',
            severity: 'medium',
            description: `Example '${exampleName}' contains sensitive data`,
            location: `components.examples.${exampleName}`,
            recommendation: 'Remove or sanitize sensitive data from examples'
          });
        }
      }
    }
  }

  /**
   * Audit schemas security
   */
  private async auditSchemasSecurity(document: any, result: SecurityAuditResult): Promise<void> {
    const schemas = document.components?.schemas || {};

    for (const [schemaName, schema] of Object.entries(schemas)) {
      const schemaObj = schema as any;

      // Check for overly permissive schemas
      if (schemaObj.additionalProperties === true) {
        result.warnings.push({
          type: 'permissive_schema',
          description: `Schema '${schemaName}' allows additional properties`,
          location: `components.schemas.${schemaName}`,
          recommendation: 'Consider restricting additional properties for better security'
        });
      }

      // Check for missing validation
      if (schemaObj.type === 'string' && !schemaObj.pattern && !schemaObj.enum && !schemaObj.format) {
        result.warnings.push({
          type: 'missing_validation',
          description: `String property in schema '${schemaName}' lacks validation`,
          location: `components.schemas.${schemaName}`,
          recommendation: 'Add pattern, enum, or format validation for string properties'
        });
      }
    }
  }

  /**
   * Audit authentication enforcement
   */
  private async auditAuthenticationEnforcement(document: any, result: SecurityAuditResult): Promise<void> {
    const securitySchemes = document.components?.securitySchemes || {};
    
    // Check if JWT authentication is properly configured
    const hasJWTAuth = Object.values(securitySchemes).some((scheme: any) => 
      scheme.type === 'http' && scheme.scheme === 'bearer'
    );

    if (!hasJWTAuth) {
      result.vulnerabilities.push({
        type: 'auth_bypass',
        severity: 'critical',
        description: 'No JWT authentication scheme found',
        location: 'components.securitySchemes',
        recommendation: 'Add JWT bearer authentication scheme'
      });
    }

    // Check if all operations are secured
    if (!this.checkAllOperationsSecured(document)) {
      result.vulnerabilities.push({
        type: 'auth_bypass',
        severity: 'high',
        description: 'Some operations are not secured with authentication',
        location: 'paths',
        recommendation: 'Ensure all operations require authentication'
      });
    }
  }

  /**
   * Audit injection risks
   */
  private async auditInjectionRisks(document: any, result: SecurityAuditResult): Promise<void> {
    // Check for SQL injection risks in parameter descriptions
    for (const [path, pathItem] of Object.entries(document.paths || {})) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (typeof operation === 'object' && operation.parameters) {
          for (const parameter of operation.parameters) {
            if (parameter.description && this.containsInjectionRisk(parameter.description)) {
              result.warnings.push({
                type: 'injection_risk',
                description: `Parameter description may indicate injection risk in ${method.toUpperCase()} ${path}`,
                location: `paths.${path}.${method}.parameters`,
                recommendation: 'Review parameter validation and sanitization'
              });
            }
          }
        }
      }
    }
  }

  /**
   * Audit endpoint security
   */
  private async auditEndpointSecurity(document: any, result: SecurityAuditResult): Promise<void> {
    for (const [path, pathItem] of Object.entries(document.paths || {})) {
      // Check for sensitive endpoints that should be internal
      if (this.sensitiveEndpointPatterns.some(pattern => pattern.test(path))) {
        result.warnings.push({
          type: 'sensitive_endpoint',
          description: `Potentially sensitive endpoint exposed: ${path}`,
          location: `paths.${path}`,
          recommendation: 'Consider making this endpoint internal or adding additional security'
        });
      }

      // Check for missing rate limiting documentation
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (typeof operation === 'object') {
          const op = operation as any;
          if (!op.responses?.['429']) {
            result.warnings.push({
              type: 'missing_rate_limit',
              description: `No rate limiting response documented for ${method.toUpperCase()} ${path}`,
              location: `paths.${path}.${method}.responses`,
              recommendation: 'Document rate limiting responses (429 Too Many Requests)'
            });
          }
        }
      }
    }
  }

  /**
   * Check if all operations are secured
   */
  private checkAllOperationsSecured(document: any): boolean {
    const hasGlobalSecurity = document.security && document.security.length > 0;
    
    if (hasGlobalSecurity) {
      return true; // Global security covers all operations
    }

    // Check each operation individually
    for (const pathItem of Object.values(document.paths || {})) {
      for (const operation of Object.values(pathItem as any)) {
        if (typeof operation === 'object' && !operation.security) {
          return false; // Found unsecured operation
        }
      }
    }

    return true;
  }

  /**
   * Sanitize schemas by removing sensitive fields
   */
  private sanitizeSchemas(document: any): void {
    const schemas = document.components?.schemas || {};

    for (const [schemaName, schema] of Object.entries(schemas)) {
      const schemaObj = schema as any;
      
      if (schemaObj.properties) {
        for (const propertyName of Object.keys(schemaObj.properties)) {
          const isSensitive = this.sensitiveFieldPatterns.some(pattern => pattern.test(propertyName));
          
          if (isSensitive) {
            delete schemaObj.properties[propertyName];
            
            // Remove from required array if present
            if (schemaObj.required) {
              schemaObj.required = schemaObj.required.filter((req: string) => req !== propertyName);
            }
          }
        }
      }
    }
  }

  /**
   * Mask internal fields
   */
  private maskInternalFields(document: any): void {
    const schemas = document.components?.schemas || {};

    for (const [schemaName, schema] of Object.entries(schemas)) {
      const schemaObj = schema as any;
      
      if (schemaObj.properties) {
        for (const [propertyName, property] of Object.entries(schemaObj.properties)) {
          const isInternal = this.internalFieldPatterns.some(pattern => pattern.test(propertyName));
          
          if (isInternal) {
            const prop = property as any;
            prop.description = '[Internal field - details hidden]';
            prop.example = undefined;
            
            // Mark as read-only
            prop.readOnly = true;
          }
        }
      }
    }
  }

  /**
   * Remove examples from document
   */
  private removeExamples(document: any): void {
    // Recursively remove examples from the entire document
    this.removeExamplesRecursive(document);
  }

  /**
   * Recursively remove examples
   */
  private removeExamplesRecursive(obj: any): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach(item => this.removeExamplesRecursive(item));
      return;
    }

    // Remove example and examples properties
    delete obj.example;
    delete obj.examples;

    // Recurse into nested objects
    for (const value of Object.values(obj)) {
      this.removeExamplesRecursive(value);
    }
  }

  /**
   * Sanitize descriptions
   */
  private sanitizeDescriptions(document: any): void {
    this.sanitizeDescriptionsRecursive(document);
  }

  /**
   * Recursively sanitize descriptions
   */
  private sanitizeDescriptionsRecursive(obj: any): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach(item => this.sanitizeDescriptionsRecursive(item));
      return;
    }

    // Sanitize description if present
    if (obj.description && typeof obj.description === 'string') {
      obj.description = this.sanitizeText(obj.description);
    }

    // Recurse into nested objects
    for (const value of Object.values(obj)) {
      this.sanitizeDescriptionsRecursive(value);
    }
  }

  /**
   * Remove internal endpoints
   */
  private removeInternalEndpoints(document: any): void {
    if (!document.paths) return;

    for (const path of Object.keys(document.paths)) {
      const isInternal = this.sensitiveEndpointPatterns.some(pattern => pattern.test(path));
      
      if (isInternal) {
        delete document.paths[path];
      }
    }
  }

  /**
   * Check if text contains sensitive information
   */
  private containsSensitiveInfo(text: string): boolean {
    return this.sensitiveFieldPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Check if object contains sensitive data
   */
  private containsSensitiveData(obj: any): boolean {
    if (typeof obj === 'string') {
      return this.containsSensitiveInfo(obj);
    }

    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (this.containsSensitiveInfo(key) || this.containsSensitiveData(value)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if text contains injection risk indicators
   */
  private containsInjectionRisk(text: string): boolean {
    const injectionPatterns = [
      /sql/i,
      /query/i,
      /injection/i,
      /script/i,
      /eval/i,
      /exec/i
    ];

    return injectionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Sanitize text content
   */
  private sanitizeText(text: string): string {
    // Remove potential sensitive information from text
    let sanitized = text;

    // Remove URLs that might contain sensitive info
    sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '[URL removed]');

    // Remove email addresses
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email removed]');

    // Remove potential API keys or tokens
    sanitized = sanitized.replace(/[a-zA-Z0-9]{32,}/g, '[token removed]');

    return sanitized;
  }

  /**
   * Detect suspicious activity
   */
  private detectSuspiciousActivity(auditEntry: AccessAuditEntry): void {
    // Check for rapid successive requests from same IP
    const recentEntries = this.accessAuditLog
      .filter(entry => entry.ip === auditEntry.ip)
      .slice(0, 10);

    if (recentEntries.length >= 10) {
      const timeWindow = 60000; // 1 minute
      const oldestEntry = recentEntries[recentEntries.length - 1];
      const timeDiff = new Date(auditEntry.timestamp).getTime() - new Date(oldestEntry.timestamp).getTime();

      if (timeDiff < timeWindow) {
        logError('Suspicious activity detected: Rapid requests', {
          ip: auditEntry.ip,
          requestCount: recentEntries.length,
          timeWindow: timeDiff
        });
      }
    }

    // Check for failed authentication attempts
    if (!auditEntry.success && auditEntry.errorCode === '401') {
      const failedAttempts = this.accessAuditLog
        .filter(entry => 
          entry.ip === auditEntry.ip && 
          !entry.success && 
          entry.errorCode === '401'
        )
        .slice(0, 5);

      if (failedAttempts.length >= 5) {
        logError('Suspicious activity detected: Multiple failed authentication attempts', {
          ip: auditEntry.ip,
          failedAttempts: failedAttempts.length,
          userId: auditEntry.userId
        });
      }
    }
  }
}

// Export singleton instance
export const openAPISecurityService = new OpenAPISecurityService();