/**
 * Route Validation and Monitoring Service
 * 
 * Provides comprehensive validation and monitoring for public routes,
 * with special focus on OAuth callback security compliance.
 * 
 * FEATURES:
 * - Startup validation of public route configurations
 * - Runtime monitoring of route access patterns
 * - Security compliance verification
 * - Route performance and availability tracking
 * - Automated security reporting
 */

import { logInfo, logError, logAudit } from '../utils/logger.js';
import { 
  validatePublicRoutesSecurity, 
  getPublicRoutesSecurityReport,
  PUBLIC_ROUTES,
  PublicRouteConfig 
} from './publicRoutes.js';

export interface RouteValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalRoutes: number;
    validRoutes: number;
    securityIssues: number;
    performanceIssues: number;
  };
}

export interface RouteMonitoringMetrics {
  routePath: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastAccessTime: Date;
  securityIssues: number;
  commonErrors: Record<string, number>;
}

export interface SecurityValidationConfig {
  enforceHttps: boolean;
  requireSecurityControls: boolean;
  minimumSecurityControls: number;
  requireApprovalDate: boolean;
  requireExternalCallerDocumentation: boolean;
  maxRouteAge: number; // days
}

export class RouteValidationService {
  private readonly securityConfig: SecurityValidationConfig;
  private readonly routeMetrics: Map<string, RouteMonitoringMetrics>;
  private readonly monitoringStartTime: Date;

  constructor(config?: Partial<SecurityValidationConfig>) {
    this.securityConfig = {
      enforceHttps: true,
      requireSecurityControls: true,
      minimumSecurityControls: 3,
      requireApprovalDate: true,
      requireExternalCallerDocumentation: true,
      maxRouteAge: 365, // 1 year
      ...config
    };

    this.routeMetrics = new Map();
    this.monitoringStartTime = new Date();

    // Initialize metrics for all public routes
    this.initializeRouteMetrics();
  }

  /**
   * Validate all public routes at startup
   * 
   * Performs comprehensive validation of public route configurations
   * to ensure security compliance and proper documentation.
   */
  async validatePublicRoutesAtStartup(): Promise<RouteValidationResult> {
    logInfo('Starting public route validation', {
      component: 'route_validation',
      totalRoutes: PUBLIC_ROUTES.length,
      timestamp: new Date().toISOString()
    });

    const result: RouteValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalRoutes: PUBLIC_ROUTES.length,
        validRoutes: 0,
        securityIssues: 0,
        performanceIssues: 0
      }
    };

    try {
      // 1. Basic security validation
      const basicValidation = validatePublicRoutesSecurity();
      if (!basicValidation.valid) {
        result.errors.push(...basicValidation.issues);
        result.summary.securityIssues += basicValidation.issues.length;
      }

      // 2. Enhanced security compliance validation
      for (const route of PUBLIC_ROUTES) {
        const routeValidation = await this.validateIndividualRoute(route);
        
        if (!routeValidation.isValid) {
          result.errors.push(...routeValidation.errors);
          result.warnings.push(...routeValidation.warnings);
          result.summary.securityIssues += routeValidation.errors.length;
        } else {
          result.summary.validRoutes++;
        }

        // Add warnings for potential issues
        if (routeValidation.warnings.length > 0) {
          result.warnings.push(...routeValidation.warnings);
        }
      }

      // 3. OAuth-specific validation
      const oauthValidation = this.validateOAuthCallbackRoute();
      if (!oauthValidation.isValid) {
        result.errors.push(...oauthValidation.errors);
        result.summary.securityIssues += oauthValidation.errors.length;
      }

      // 4. Security configuration validation
      const configValidation = this.validateSecurityConfiguration();
      if (!configValidation.isValid) {
        result.warnings.push(...configValidation.warnings);
      }

      // Determine overall validation result
      result.isValid = result.errors.length === 0;

      // Log validation results
      if (result.isValid) {
        logInfo('Public route validation completed successfully', {
          summary: result.summary,
          warnings: result.warnings.length,
          component: 'route_validation'
        });
      } else {
        logError('Public route validation failed', {
          errors: result.errors,
          warnings: result.warnings,
          summary: result.summary,
          component: 'route_validation'
        });
      }

      // Generate security audit
      logAudit('route.validation.completed', 'system', 'route_validation', {
        validationResult: result.isValid ? 'PASSED' : 'FAILED',
        totalRoutes: result.summary.totalRoutes,
        validRoutes: result.summary.validRoutes,
        securityIssues: result.summary.securityIssues,
        errors: result.errors,
        warnings: result.warnings,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      logError('Route validation error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: 'route_validation'
      });

      result.isValid = false;
      result.errors.push('Internal validation error occurred');
      return result;
    }
  }

  /**
   * Validate individual route configuration
   */
  private async validateIndividualRoute(route: PublicRouteConfig): Promise<RouteValidationResult> {
    const result: RouteValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: { totalRoutes: 1, validRoutes: 0, securityIssues: 0, performanceIssues: 0 }
    };

    // Security controls validation
    if (this.securityConfig.requireSecurityControls) {
      if (!route.securityControls || route.securityControls.length < this.securityConfig.minimumSecurityControls) {
        result.errors.push(`Route ${route.path} has insufficient security controls (${route.securityControls?.length || 0} < ${this.securityConfig.minimumSecurityControls})`);
      }
    }

    // Approval date validation
    if (this.securityConfig.requireApprovalDate) {
      if (!route.approvedDate) {
        result.errors.push(`Route ${route.path} missing approval date`);
      } else {
        const approvalDate = new Date(route.approvedDate);
        const ageInDays = (Date.now() - approvalDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (ageInDays > this.securityConfig.maxRouteAge) {
          result.warnings.push(`Route ${route.path} approval is ${Math.round(ageInDays)} days old (exceeds ${this.securityConfig.maxRouteAge} days)`);
        }
      }
    }

    // External caller documentation
    if (this.securityConfig.requireExternalCallerDocumentation) {
      if (!route.externalCallers || route.externalCallers.length === 0) {
        result.errors.push(`Route ${route.path} missing external caller documentation`);
      }
    }

    // HTTPS enforcement check
    if (this.securityConfig.enforceHttps && !route.path.includes('health')) {
      // This is a configuration check - actual HTTPS is enforced at server level
      if (!route.securityControls?.some(control => control.toLowerCase().includes('https'))) {
        result.warnings.push(`Route ${route.path} should document HTTPS requirement in security controls`);
      }
    }

    // Data exposure validation
    if (route.exposesData && !route.dataExposed) {
      result.errors.push(`Route ${route.path} exposes data but doesn't specify what data`);
    }

    // Path security validation
    if (!route.path.startsWith('/api/v') && !route.path.includes('health')) {
      result.warnings.push(`Route ${route.path} should follow API versioning convention (/api/v1/...)`);
    }

    // Set validation result
    result.isValid = result.errors.length === 0;
    if (result.isValid) {
      result.summary.validRoutes = 1;
    } else {
      result.summary.securityIssues = result.errors.length;
    }

    return result;
  }

  /**
   * OAuth callback route specific validation
   */
  private validateOAuthCallbackRoute(): RouteValidationResult {
    const result: RouteValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: { totalRoutes: 0, validRoutes: 0, securityIssues: 0, performanceIssues: 0 }
    };

    const oauthRoute = PUBLIC_ROUTES.find(route => route.path.includes('/oauth/callback'));
    
    if (!oauthRoute) {
      result.errors.push('OAuth callback route not found in public routes registry');
      result.isValid = false;
      return result;
    }

    // OAuth-specific security requirements
    const requiredSecurityControls = [
      'state parameter',
      'ownership verification',
      'timestamp validation',
      'audit logging',
      'error responses'
    ];

    for (const requiredControl of requiredSecurityControls) {
      const hasControl = oauthRoute.securityControls?.some(control => 
        control.toLowerCase().includes(requiredControl.toLowerCase())
      );
      
      if (!hasControl) {
        result.errors.push(`OAuth callback route missing security control: ${requiredControl}`);
      }
    }

    // OAuth-specific validation
    if (!oauthRoute.externalCallers?.some(caller => caller.toLowerCase().includes('oauth'))) {
      result.errors.push('OAuth callback route should document OAuth providers as external callers');
    }

    if (oauthRoute.exposesData) {
      result.errors.push('OAuth callback route should not expose data - only redirects');
    }

    result.isValid = result.errors.length === 0;
    result.summary.securityIssues = result.errors.length;

    return result;
  }

  /**
   * Validate security configuration
   */
  private validateSecurityConfiguration(): RouteValidationResult {
    const result: RouteValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: { totalRoutes: 0, validRoutes: 0, securityIssues: 0, performanceIssues: 0 }
    };

    // Check if security controls are too permissive
    if (this.securityConfig.minimumSecurityControls < 3) {
      result.warnings.push('Minimum security controls requirement is low (< 3)');
    }

    if (this.securityConfig.maxRouteAge > 365) {
      result.warnings.push('Maximum route age is high (> 1 year) - consider requiring more frequent reviews');
    }

    if (!this.securityConfig.enforceHttps) {
      result.warnings.push('HTTPS enforcement is disabled');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Record route access for monitoring
   */
  recordRouteAccess(
    routePath: string, 
    success: boolean, 
    responseTime: number,
    errorCode?: string
  ): void {
    const metrics = this.routeMetrics.get(routePath) || this.createDefaultMetrics(routePath);
    
    metrics.totalRequests++;
    metrics.lastAccessTime = new Date();
    
    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
      
      if (errorCode) {
        metrics.commonErrors[errorCode] = (metrics.commonErrors[errorCode] || 0) + 1;
      }
    }
    
    // Update average response time (rolling average)
    metrics.averageResponseTime = (
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / 
      metrics.totalRequests
    );
    
    this.routeMetrics.set(routePath, metrics);
    
    // Log monitoring data
    logInfo('Route access recorded', {
      routePath,
      success,
      responseTime,
      errorCode,
      totalRequests: metrics.totalRequests,
      successRate: (metrics.successfulRequests / metrics.totalRequests * 100).toFixed(2),
      component: 'route_monitoring'
    });
  }

  /**
   * Record security issue for route
   */
  recordSecurityIssue(routePath: string, issueDescription: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'): void {
    const metrics = this.routeMetrics.get(routePath) || this.createDefaultMetrics(routePath);
    metrics.securityIssues++;
    
    this.routeMetrics.set(routePath, metrics);
    
    logError('Route security issue recorded', {
      routePath,
      issueDescription,
      severity,
      totalSecurityIssues: metrics.securityIssues,
      component: 'route_monitoring'
    });
    
    logAudit('route.security.issue', 'system', routePath, {
      issueDescription,
      severity,
      timestamp: new Date().toISOString(),
      component: 'route_monitoring'
    });
  }

  /**
   * Get monitoring report for all routes
   */
  getMonitoringReport(): {
    summary: {
      totalRoutes: number;
      totalRequests: number;
      overallSuccessRate: number;
      averageResponseTime: number;
      totalSecurityIssues: number;
      monitoringDuration: number; // hours
    };
    routeMetrics: RouteMonitoringMetrics[];
    securityReport: ReturnType<typeof getPublicRoutesSecurityReport>;
  } {
    const routeMetrics = Array.from(this.routeMetrics.values());
    const totalRequests = routeMetrics.reduce((sum, metrics) => sum + metrics.totalRequests, 0);
    const totalSuccessful = routeMetrics.reduce((sum, metrics) => sum + metrics.successfulRequests, 0);
    const totalSecurityIssues = routeMetrics.reduce((sum, metrics) => sum + metrics.securityIssues, 0);
    const totalResponseTime = routeMetrics.reduce((sum, metrics) => sum + (metrics.averageResponseTime * metrics.totalRequests), 0);

    const monitoringDuration = (Date.now() - this.monitoringStartTime.getTime()) / (1000 * 60 * 60);

    return {
      summary: {
        totalRoutes: routeMetrics.length,
        totalRequests,
        overallSuccessRate: totalRequests > 0 ? (totalSuccessful / totalRequests * 100) : 0,
        averageResponseTime: totalRequests > 0 ? (totalResponseTime / totalRequests) : 0,
        totalSecurityIssues,
        monitoringDuration
      },
      routeMetrics,
      securityReport: getPublicRoutesSecurityReport()
    };
  }

  /**
   * Generate security compliance report
   */
  async generateSecurityComplianceReport(): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
    routeStatus: Array<{
      path: string;
      compliant: boolean;
      issues: string[];
    }>;
  }> {
    const report = {
      compliant: true,
      issues: [] as string[],
      recommendations: [] as string[],
      routeStatus: [] as Array<{ path: string; compliant: boolean; issues: string[]; }>
    };

    // Validate each route for compliance
    for (const route of PUBLIC_ROUTES) {
      const routeValidation = await this.validateIndividualRoute(route);
      const routeCompliant = routeValidation.isValid;
      
      if (!routeCompliant) {
        report.compliant = false;
      }

      report.routeStatus.push({
        path: route.path,
        compliant: routeCompliant,
        issues: routeValidation.errors
      });

      report.issues.push(...routeValidation.errors);
      report.recommendations.push(...routeValidation.warnings);
    }

    return report;
  }

  /**
   * Initialize metrics for all public routes
   */
  private initializeRouteMetrics(): void {
    for (const route of PUBLIC_ROUTES) {
      this.routeMetrics.set(route.path, this.createDefaultMetrics(route.path));
    }
  }

  /**
   * Create default metrics object for a route
   */
  private createDefaultMetrics(routePath: string): RouteMonitoringMetrics {
    return {
      routePath,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastAccessTime: new Date(),
      securityIssues: 0,
      commonErrors: {}
    };
  }
}

// Global instance for route validation and monitoring
export const routeValidator = new RouteValidationService({
  enforceHttps: true,
  requireSecurityControls: true,
  minimumSecurityControls: 5, // Higher requirement for OAuth callback security
  requireApprovalDate: true,
  requireExternalCallerDocumentation: true,
  maxRouteAge: 365
});

/**
 * Startup validation function to be called during application initialization
 */
export async function validateRoutesAtStartup(): Promise<boolean> {
  logInfo('Performing startup route validation', {
    component: 'route_validation',
    timestamp: new Date().toISOString()
  });

  try {
    const validationResult = await routeValidator.validatePublicRoutesAtStartup();
    
    if (!validationResult.isValid) {
      logError('Route validation failed - application startup aborted', {
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        component: 'route_validation'
      });
      
      return false;
    }

    if (validationResult.warnings.length > 0) {
      logInfo('Route validation completed with warnings', {
        warnings: validationResult.warnings,
        component: 'route_validation'
      });
    }

    logInfo('Route validation completed successfully', {
      summary: validationResult.summary,
      component: 'route_validation'
    });

    return true;

  } catch (error) {
    logError('Route validation failed with error', {
      error: error instanceof Error ? error.message : String(error),
      component: 'route_validation'
    });
    
    return false;
  }
}

/**
 * Export monitoring functions for use in route handlers
 */
export function recordOAuthCallbackAccess(success: boolean, responseTime: number, errorCode?: string): void {
  routeValidator.recordRouteAccess('/api/v1/oauth/callback', success, responseTime, errorCode);
}

export function recordOAuthSecurityIssue(issueDescription: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'): void {
  routeValidator.recordSecurityIssue('/api/v1/oauth/callback', issueDescription, severity);
} 