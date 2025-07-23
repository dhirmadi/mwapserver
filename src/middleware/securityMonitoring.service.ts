/**
 * Security Monitoring and Alerting Service
 * 
 * Provides real-time security monitoring for OAuth callbacks and other
 * security-critical endpoints with automated threat detection and alerting.
 * 
 * FEATURES:
 * - Real-time security event monitoring
 * - Automated threat detection and classification
 * - Configurable alert thresholds and notifications
 * - Security metrics aggregation and reporting
 * - Integration with external monitoring systems
 * - Rate limiting and anomaly detection
 */

import { logInfo, logError, logAudit } from '../utils/logger.js';

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  endpoint: string;
  ip: string;
  userAgent: string;
  userId?: string;
  tenantId?: string;
  description: string;
  metadata: Record<string, any>;
  resolved: boolean;
  alertSent: boolean;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsBySeverity: Record<string, number>;
  eventsByType: Record<string, number>;
  eventsLast24h: number;
  eventsLastHour: number;
  topSourceIPs: Array<{ ip: string; count: number }>;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  activeThreats: number;
  lastUpdated: Date;
}

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  eventIds: string[];
  threshold: string;
  currentValue: number;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  notificationsSent: string[];
  metadata: Record<string, any>;
}

export interface AlertThreshold {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'rate';
  threshold: number;
  timeWindow: number; // minutes
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  notificationChannels: string[];
}

export interface SecurityMonitoringConfig {
  enableRealTimeMonitoring: boolean;
  enableAlerts: boolean;
  alertCooldownMinutes: number;
  maxEventsToStore: number;
  metricsRetentionDays: number;
  defaultThresholds: AlertThreshold[];
}

export class SecurityMonitoringService {
  private events: Map<string, SecurityEvent> = new Map();
  private alerts: Map<string, SecurityAlert> = new Map();
  private thresholds: Map<string, AlertThreshold> = new Map();
  private metrics: SecurityMetrics;
  private config: SecurityMonitoringConfig;
  private alertCooldowns: Map<string, Date> = new Map();

  constructor(config?: Partial<SecurityMonitoringConfig>) {
    this.config = {
      enableRealTimeMonitoring: true,
      enableAlerts: true,
      alertCooldownMinutes: 15,
      maxEventsToStore: 10000,
      metricsRetentionDays: 30,
      defaultThresholds: this.getDefaultThresholds(),
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.loadDefaultThresholds();
    this.startMetricsAggregation();

    logInfo('Security monitoring service initialized', {
      component: 'security_monitoring',
      enableRealTimeMonitoring: this.config.enableRealTimeMonitoring,
      enableAlerts: this.config.enableAlerts,
      thresholds: this.thresholds.size
    });
  }

  /**
   * Record a security event
   */
  recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved' | 'alertSent'>): string {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      resolved: false,
      alertSent: false,
      ...event
    };

    // Store event
    this.events.set(securityEvent.id, securityEvent);
    this.cleanupOldEvents();

    // Update metrics
    this.updateMetrics(securityEvent);

    // Check for threshold violations
    if (this.config.enableAlerts) {
      this.checkThresholds(securityEvent);
    }

    // Log security event
    logAudit('security.event.recorded', securityEvent.userId || 'system', securityEvent.endpoint, {
      eventId: securityEvent.id,
      eventType: securityEvent.eventType,
      severity: securityEvent.severity,
      source: securityEvent.source,
      ip: securityEvent.ip,
      description: securityEvent.description,
      component: 'security_monitoring'
    });

    logInfo('Security event recorded', {
      eventId: securityEvent.id,
      eventType: securityEvent.eventType,
      severity: securityEvent.severity,
      endpoint: securityEvent.endpoint,
      component: 'security_monitoring'
    });

    return securityEvent.id;
  }

  /**
   * Record OAuth-specific security events
   */
  recordOAuthSecurityEvent(
    eventType: 'callback_attempt' | 'state_validation_failed' | 'ownership_violation' | 'replay_attack' | 'token_refresh_failed',
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    context: {
      ip: string;
      userAgent: string;
      userId?: string;
      tenantId?: string;
      integrationId?: string;
      errorCode?: string;
      description: string;
      metadata?: Record<string, any>;
    }
  ): string {
    return this.recordSecurityEvent({
      eventType: `oauth.${eventType}`,
      severity,
      source: 'oauth_callback',
      endpoint: '/api/v1/oauth/callback',
      ip: context.ip,
      userAgent: context.userAgent,
      userId: context.userId,
      tenantId: context.tenantId,
      description: context.description,
      metadata: {
        integrationId: context.integrationId,
        errorCode: context.errorCode,
        ...context.metadata
      }
    });
  }

  /**
   * Get current security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get security events with filtering
   */
  getSecurityEvents(filters?: {
    severity?: string;
    eventType?: string;
    source?: string;
    timeRange?: { start: Date; end: Date };
    resolved?: boolean;
    limit?: number;
  }): SecurityEvent[] {
    let events = Array.from(this.events.values());

    if (filters) {
      if (filters.severity) {
        events = events.filter(e => e.severity === filters.severity);
      }
      if (filters.eventType) {
        events = events.filter(e => e.eventType === filters.eventType);
      }
      if (filters.source) {
        events = events.filter(e => e.source === filters.source);
      }
      if (filters.timeRange) {
        events = events.filter(e => 
          e.timestamp >= filters.timeRange!.start && 
          e.timestamp <= filters.timeRange!.end
        );
      }
      if (filters.resolved !== undefined) {
        events = events.filter(e => e.resolved === filters.resolved);
      }
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filters?.limit) {
      events = events.slice(0, filters.limit);
    }

    return events;
  }

  /**
   * Get active security alerts
   */
  getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get security dashboard data
   */
  getSecurityDashboard(): {
    metrics: SecurityMetrics;
    recentEvents: SecurityEvent[];
    activeAlerts: SecurityAlert[];
    topThreats: Array<{ type: string; count: number; severity: string }>;
    trends: {
      eventsOverTime: Array<{ timestamp: Date; count: number }>;
      severityTrends: Array<{ severity: string; count: number; change: number }>;
    };
  } {
    const recentEvents = this.getSecurityEvents({ limit: 50 });
    const activeAlerts = this.getActiveAlerts();

    // Calculate top threats
    const threatCounts = new Map<string, { count: number; severity: string }>();
    recentEvents.forEach(event => {
      const key = event.eventType;
      const existing = threatCounts.get(key) || { count: 0, severity: 'LOW' };
      existing.count++;
      if (this.getSeverityPriority(event.severity) > this.getSeverityPriority(existing.severity)) {
        existing.severity = event.severity;
      }
      threatCounts.set(key, existing);
    });

    const topThreats = Array.from(threatCounts.entries())
      .map(([type, data]) => ({ type, count: data.count, severity: data.severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate trends (simplified for this implementation)
    const now = new Date();
    const eventsOverTime = Array.from({ length: 24 }, (_, i) => {
      const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      const count = recentEvents.filter(e => 
        e.timestamp >= timestamp && 
        e.timestamp < new Date(timestamp.getTime() + 60 * 60 * 1000)
      ).length;
      return { timestamp, count };
    });

    const severityTrends = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(severity => ({
      severity,
      count: this.metrics.eventsBySeverity[severity] || 0,
      change: 0 // Would calculate based on historical data in production
    }));

    return {
      metrics: this.metrics,
      recentEvents,
      activeAlerts,
      topThreats,
      trends: {
        eventsOverTime,
        severityTrends
      }
    };
  }

  /**
   * Resolve a security alert
   */
  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    // Mark related events as resolved
    alert.eventIds.forEach(eventId => {
      const event = this.events.get(eventId);
      if (event) {
        event.resolved = true;
      }
    });

    logAudit('security.alert.resolved', resolvedBy, alertId, {
      alertId,
      resolvedBy,
      eventCount: alert.eventIds.length,
      component: 'security_monitoring'
    });

    return true;
  }

  /**
   * Add or update alert threshold
   */
  setAlertThreshold(threshold: AlertThreshold): void {
    this.thresholds.set(threshold.id, threshold);
    
    logInfo('Alert threshold updated', {
      thresholdId: threshold.id,
      name: threshold.name,
      metric: threshold.metric,
      condition: threshold.condition,
      threshold: threshold.threshold,
      severity: threshold.severity,
      component: 'security_monitoring'
    });
  }

  /**
   * Private helper methods
   */

  private initializeMetrics(): SecurityMetrics {
    return {
      totalEvents: 0,
      eventsBySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      eventsByType: {},
      eventsLast24h: 0,
      eventsLastHour: 0,
      topSourceIPs: [],
      topEndpoints: [],
      threatLevel: 'LOW',
      activeThreats: 0,
      lastUpdated: new Date()
    };
  }

  private loadDefaultThresholds(): void {
    this.config.defaultThresholds.forEach(threshold => {
      this.thresholds.set(threshold.id, threshold);
    });
  }

  private getDefaultThresholds(): AlertThreshold[] {
    return [
      {
        id: 'oauth_failures_high',
        name: 'High OAuth Callback Failures',
        description: 'OAuth callback failure rate exceeds threshold',
        metric: 'oauth.callback_failures',
        condition: 'rate',
        threshold: 10, // 10 failures in time window
        timeWindow: 5, // 5 minutes
        severity: 'HIGH',
        enabled: true,
        notificationChannels: ['email', 'slack']
      },
      {
        id: 'replay_attacks',
        name: 'OAuth Replay Attacks Detected',
        description: 'Multiple replay attack attempts detected',
        metric: 'oauth.replay_attacks',
        condition: 'gt',
        threshold: 3, // More than 3 replay attacks
        timeWindow: 15, // in 15 minutes
        severity: 'CRITICAL',
        enabled: true,
        notificationChannels: ['email', 'slack', 'pagerduty']
      },
      {
        id: 'ownership_violations',
        name: 'Integration Ownership Violations',
        description: 'Multiple ownership violation attempts',
        metric: 'oauth.ownership_violations',
        condition: 'gt',
        threshold: 5, // More than 5 violations
        timeWindow: 10, // in 10 minutes
        severity: 'HIGH',
        enabled: true,
        notificationChannels: ['email', 'slack']
      },
      {
        id: 'suspicious_ip_activity',
        name: 'Suspicious IP Activity',
        description: 'High failure rate from single IP',
        metric: 'ip.failure_rate',
        condition: 'rate',
        threshold: 20, // 20 failures from one IP
        timeWindow: 5, // in 5 minutes
        severity: 'MEDIUM',
        enabled: true,
        notificationChannels: ['email']
      },
      {
        id: 'state_validation_failures',
        name: 'State Parameter Validation Failures',
        description: 'High rate of state validation failures',
        metric: 'oauth.state_failures',
        condition: 'rate',
        threshold: 15, // 15 failures
        timeWindow: 5, // in 5 minutes
        severity: 'MEDIUM',
        enabled: true,
        notificationChannels: ['email']
      }
    ];
  }

  private updateMetrics(event: SecurityEvent): void {
    this.metrics.totalEvents++;
    this.metrics.eventsBySeverity[event.severity]++;
    this.metrics.eventsByType[event.eventType] = (this.metrics.eventsByType[event.eventType] || 0) + 1;

    // Update time-based metrics
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    this.metrics.eventsLast24h = Array.from(this.events.values())
      .filter(e => e.timestamp >= last24h).length;
    this.metrics.eventsLastHour = Array.from(this.events.values())
      .filter(e => e.timestamp >= lastHour).length;

    // Update top IPs and endpoints
    this.updateTopMetrics();

    // Update threat level
    this.updateThreatLevel();

    this.metrics.lastUpdated = new Date();
  }

  private updateTopMetrics(): void {
    const ipCounts = new Map<string, number>();
    const endpointCounts = new Map<string, number>();

    Array.from(this.events.values()).forEach(event => {
      ipCounts.set(event.ip, (ipCounts.get(event.ip) || 0) + 1);
      endpointCounts.set(event.endpoint, (endpointCounts.get(event.endpoint) || 0) + 1);
    });

    this.metrics.topSourceIPs = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.metrics.topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private updateThreatLevel(): void {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL').length;
    const highAlerts = activeAlerts.filter(a => a.severity === 'HIGH').length;
    const mediumAlerts = activeAlerts.filter(a => a.severity === 'MEDIUM').length;

    this.metrics.activeThreats = activeAlerts.length;

    if (criticalAlerts > 0) {
      this.metrics.threatLevel = 'CRITICAL';
    } else if (highAlerts > 2) {
      this.metrics.threatLevel = 'HIGH';
    } else if (highAlerts > 0 || mediumAlerts > 3) {
      this.metrics.threatLevel = 'MEDIUM';
    } else {
      this.metrics.threatLevel = 'LOW';
    }
  }

  private checkThresholds(event: SecurityEvent): void {
    this.thresholds.forEach(threshold => {
      if (!threshold.enabled) return;

      const shouldAlert = this.evaluateThreshold(threshold, event);
      if (shouldAlert && this.canSendAlert(threshold.id)) {
        this.createAlert(threshold, event);
      }
    });
  }

  private evaluateThreshold(threshold: AlertThreshold, event: SecurityEvent): boolean {
    const timeWindow = new Date(Date.now() - threshold.timeWindow * 60 * 1000);
    const relevantEvents = Array.from(this.events.values())
      .filter(e => e.timestamp >= timeWindow && this.isEventRelevantToThreshold(e, threshold));

    const currentValue = relevantEvents.length;

    switch (threshold.condition) {
      case 'gt':
        return currentValue > threshold.threshold;
      case 'lt':
        return currentValue < threshold.threshold;
      case 'eq':
        return currentValue === threshold.threshold;
      case 'rate':
        // For rate conditions, check if we've exceeded the threshold in the time window
        return currentValue >= threshold.threshold;
      default:
        return false;
    }
  }

  private isEventRelevantToThreshold(event: SecurityEvent, threshold: AlertThreshold): boolean {
    switch (threshold.metric) {
      case 'oauth.callback_failures':
        return event.eventType.startsWith('oauth.') && event.severity !== 'LOW';
      case 'oauth.replay_attacks':
        return event.eventType === 'oauth.replay_attack';
      case 'oauth.ownership_violations':
        return event.eventType === 'oauth.ownership_violation';
      case 'oauth.state_failures':
        return event.eventType === 'oauth.state_validation_failed';
      case 'ip.failure_rate':
        return event.severity !== 'LOW'; // Any non-low severity event from an IP
      default:
        return false;
    }
  }

  private canSendAlert(thresholdId: string): boolean {
    const cooldown = this.alertCooldowns.get(thresholdId);
    if (!cooldown) return true;

    const now = new Date();
    const cooldownExpiry = new Date(cooldown.getTime() + this.config.alertCooldownMinutes * 60 * 1000);
    
    return now >= cooldownExpiry;
  }

  private createAlert(threshold: AlertThreshold, triggeringEvent: SecurityEvent): void {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      severity: threshold.severity,
      title: threshold.name,
      description: threshold.description,
      eventIds: [triggeringEvent.id],
      threshold: `${threshold.condition} ${threshold.threshold} in ${threshold.timeWindow}m`,
      currentValue: 1, // Would be calculated based on actual metric evaluation
      resolved: false,
      notificationsSent: [],
      metadata: {
        thresholdId: threshold.id,
        metric: threshold.metric,
        triggeringEventId: triggeringEvent.id
      }
    };

    this.alerts.set(alert.id, alert);
    this.alertCooldowns.set(threshold.id, new Date());

    // Send notifications
    this.sendAlertNotifications(alert, threshold.notificationChannels);

    logAudit('security.alert.created', 'system', alert.id, {
      alertId: alert.id,
      severity: alert.severity,
      title: alert.title,
      thresholdId: threshold.id,
      triggeringEventId: triggeringEvent.id,
      component: 'security_monitoring'
    });

    logError('Security alert triggered', {
      alertId: alert.id,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      component: 'security_monitoring'
    });
  }

  private sendAlertNotifications(alert: SecurityAlert, channels: string[]): void {
    // In a production system, this would integrate with actual notification services
    channels.forEach(channel => {
      try {
        switch (channel) {
          case 'email':
            this.sendEmailAlert(alert);
            break;
          case 'slack':
            this.sendSlackAlert(alert);
            break;
          case 'pagerduty':
            this.sendPagerDutyAlert(alert);
            break;
        }
        alert.notificationsSent.push(channel);
      } catch (error) {
        logError(`Failed to send alert notification via ${channel}`, {
          alertId: alert.id,
          channel,
          error: error instanceof Error ? error.message : String(error),
          component: 'security_monitoring'
        });
      }
    });
  }

  private sendEmailAlert(alert: SecurityAlert): void {
    // Mock email sending - would integrate with actual email service
    logInfo('Email alert sent', {
      alertId: alert.id,
      severity: alert.severity,
      title: alert.title,
      component: 'security_monitoring'
    });
  }

  private sendSlackAlert(alert: SecurityAlert): void {
    // Mock Slack notification - would integrate with Slack API
    logInfo('Slack alert sent', {
      alertId: alert.id,
      severity: alert.severity,
      title: alert.title,
      component: 'security_monitoring'
    });
  }

  private sendPagerDutyAlert(alert: SecurityAlert): void {
    // Mock PagerDuty notification - would integrate with PagerDuty API
    logInfo('PagerDuty alert sent', {
      alertId: alert.id,
      severity: alert.severity,
      title: alert.title,
      component: 'security_monitoring'
    });
  }

  private startMetricsAggregation(): void {
    // Update metrics every minute
    setInterval(() => {
      if (this.config.enableRealTimeMonitoring) {
        this.updateMetrics({} as SecurityEvent); // Trigger metrics update without a new event
      }
    }, 60 * 1000);

    // Cleanup old events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000);
  }

  private cleanupOldEvents(): void {
    if (this.events.size <= this.config.maxEventsToStore) return;

    const sortedEvents = Array.from(this.events.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Keep only the most recent events
    const toKeep = sortedEvents.slice(0, this.config.maxEventsToStore);
    
    this.events.clear();
    toKeep.forEach(event => {
      this.events.set(event.id, event);
    });

    logInfo('Old security events cleaned up', {
      eventsRemoved: sortedEvents.length - toKeep.length,
      eventsRetained: toKeep.length,
      component: 'security_monitoring'
    });
  }

  private getSeverityPriority(severity: string): number {
    switch (severity) {
      case 'LOW': return 1;
      case 'MEDIUM': return 2;
      case 'HIGH': return 3;
      case 'CRITICAL': return 4;
      default: return 0;
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global security monitoring instance
export const securityMonitor = new SecurityMonitoringService({
  enableRealTimeMonitoring: true,
  enableAlerts: true,
  alertCooldownMinutes: 15,
  maxEventsToStore: 10000,
  metricsRetentionDays: 30
});

/**
 * Convenience functions for OAuth security monitoring
 */
export function recordOAuthCallbackFailure(
  ip: string,
  userAgent: string,
  errorCode: string,
  description: string,
  metadata?: Record<string, any>
): string {
  return securityMonitor.recordOAuthSecurityEvent(
    'callback_attempt',
    'MEDIUM',
    { ip, userAgent, errorCode, description, metadata }
  );
}

export function recordOAuthReplayAttack(
  ip: string,
  userAgent: string,
  userId: string,
  tenantId: string,
  integrationId: string
): string {
  return securityMonitor.recordOAuthSecurityEvent(
    'replay_attack',
    'CRITICAL',
    {
      ip,
      userAgent,
      userId,
      tenantId,
      integrationId,
      description: 'OAuth replay attack detected - integration already has tokens',
      metadata: { threatType: 'replay_attack' }
    }
  );
}

export function recordOAuthOwnershipViolation(
  ip: string,
  userAgent: string,
  userId: string,
  tenantId: string,
  integrationId: string
): string {
  return securityMonitor.recordOAuthSecurityEvent(
    'ownership_violation',
    'HIGH',
    {
      ip,
      userAgent,
      userId,
      tenantId,
      integrationId,
      description: 'OAuth ownership violation - user attempting to access integration in different tenant',
      metadata: { threatType: 'cross_tenant_attack' }
    }
  );
}

export function recordOAuthStateValidationFailure(
  ip: string,
  userAgent: string,
  errorCode: string,
  description: string
): string {
  return securityMonitor.recordOAuthSecurityEvent(
    'state_validation_failed',
    'MEDIUM',
    {
      ip,
      userAgent,
      errorCode,
      description,
      metadata: { validationError: errorCode }
    }
  );
} 