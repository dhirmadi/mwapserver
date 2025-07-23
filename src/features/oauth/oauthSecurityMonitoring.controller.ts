/**
 * OAuth Security Monitoring Controller
 * 
 * Provides API endpoints for accessing OAuth security monitoring data:
 * - Security metrics and statistics
 * - Active security alerts
 * - Suspicious pattern detection
 * - Security validation reports
 * - Attack vector analysis
 * 
 * Security Note: These endpoints require admin-level access and should not
 * expose sensitive user data or system internals.
 */

import { Request, Response } from 'express';
import { OAuthSecurityMonitoringService } from './oauthSecurityMonitoring.service.js';
import { jsonResponse } from '../../utils/response.js';
import { logInfo, logAudit } from '../../utils/logger.js';
import { getUserFromToken } from '../../utils/auth.js';

const oauthMonitoringService = new OAuthSecurityMonitoringService();

/**
 * Get OAuth security metrics
 * 
 * Route: GET /api/v1/oauth/security/metrics
 * Access: PROTECTED (Admin only)
 */
export async function getSecurityMetrics(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const timeWindow = req.query.timeWindow ? parseInt(req.query.timeWindow as string) : undefined;
    
    logInfo('OAuth security metrics requested', {
      userId: user.sub,
      timeWindow,
      ip: req.ip
    });
    
    const metrics = oauthMonitoringService.getSecurityMetrics(timeWindow);
    
    logAudit('oauth.security.metrics.accessed', user.sub, 'security_metrics', {
      timeWindow: metrics.timeWindow,
      totalAttempts: metrics.totalAttempts,
      successRate: metrics.successRate,
      ip: req.ip
    });
    
    return jsonResponse(res, 200, {
      metrics,
      timestamp: new Date().toISOString(),
      timeWindow: metrics.timeWindow
    });
    
  } catch (error) {
    throw error;
  }
}

/**
 * Get active security alerts
 * 
 * Route: GET /api/v1/oauth/security/alerts
 * Access: PROTECTED (Admin only)
 */
export async function getSecurityAlerts(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logInfo('OAuth security alerts requested', {
      userId: user.sub,
      ip: req.ip
    });
    
    const alerts = oauthMonitoringService.getActiveSecurityAlerts();
    
    logAudit('oauth.security.alerts.accessed', user.sub, 'security_alerts', {
      alertCount: alerts.length,
      ip: req.ip
    });
    
    return jsonResponse(res, 200, {
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    throw error;
  }
}

/**
 * Get suspicious patterns
 * 
 * Route: GET /api/v1/oauth/security/patterns
 * Access: PROTECTED (Admin only)
 */
export async function getSuspiciousPatterns(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const timeWindow = req.query.timeWindow ? parseInt(req.query.timeWindow as string) : undefined;
    
    logInfo('OAuth suspicious patterns requested', {
      userId: user.sub,
      timeWindow,
      ip: req.ip
    });
    
    const patterns = oauthMonitoringService.getRecentSuspiciousPatterns(timeWindow);
    
    logAudit('oauth.security.patterns.accessed', user.sub, 'suspicious_patterns', {
      patternCount: patterns.length,
      timeWindow,
      ip: req.ip
    });
    
    return jsonResponse(res, 200, {
      patterns,
      count: patterns.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    throw error;
  }
}

/**
 * Get comprehensive security report
 * 
 * Route: GET /api/v1/oauth/security/report
 * Access: PROTECTED (Admin only)
 */
export async function getSecurityReport(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logInfo('OAuth security report requested', {
      userId: user.sub,
      ip: req.ip
    });
    
    const report = oauthMonitoringService.generateSecurityReport();
    
    logAudit('oauth.security.report.accessed', user.sub, 'security_report', {
      alertCount: report.alerts.length,
      patternCount: report.patterns.length,
      successRate: report.metrics.successRate,
      riskLevel: report.attackVectors.riskLevel,
      ip: req.ip
    });
    
    return jsonResponse(res, 200, {
      ...report,
      timestamp: new Date().toISOString(),
      generatedBy: user.sub
    });
    
  } catch (error) {
    throw error;
  }
}

/**
 * Validate public route data exposure
 * 
 * Route: GET /api/v1/oauth/security/validate/data-exposure
 * Access: PROTECTED (Admin only)
 */
export async function validateDataExposure(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logInfo('OAuth data exposure validation requested', {
      userId: user.sub,
      ip: req.ip
    });
    
    const validation = oauthMonitoringService.validatePublicRouteDataExposure();
    
    logAudit('oauth.security.validation.data_exposure', user.sub, 'data_exposure_validation', {
      isSecure: validation.isSecure,
      issueCount: validation.issues.length,
      recommendationCount: validation.recommendations.length,
      ip: req.ip
    });
    
    return jsonResponse(res, 200, {
      validation,
      timestamp: new Date().toISOString(),
      validatedBy: user.sub
    });
    
  } catch (error) {
    throw error;
  }
}

/**
 * Validate against attack vectors
 * 
 * Route: GET /api/v1/oauth/security/validate/attack-vectors
 * Access: PROTECTED (Admin only)
 */
export async function validateAttackVectors(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logInfo('OAuth attack vector validation requested', {
      userId: user.sub,
      ip: req.ip
    });
    
    const validation = oauthMonitoringService.validateAgainstAttackVectors();
    
    logAudit('oauth.security.validation.attack_vectors', user.sub, 'attack_vector_validation', {
      riskLevel: validation.riskLevel,
      vulnerabilityCount: validation.vulnerabilities.length,
      mitigationCount: validation.mitigations.length,
      ip: req.ip
    });
    
    return jsonResponse(res, 200, {
      validation,
      timestamp: new Date().toISOString(),
      validatedBy: user.sub
    });
    
  } catch (error) {
    throw error;
  }
}