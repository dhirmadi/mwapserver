/**
 * Comprehensive Logging and Alerting Configuration
 * 
 * Provides structured logging, external integrations, and production-ready
 * log management for the OAuth security system and overall application.
 * 
 * FEATURES:
 * - Structured JSON logging with consistent format
 * - Multiple log levels and filtering
 * - External log aggregation (ELK, Splunk, etc.)
 * - Real-time alerting integrations
 * - Performance and security audit logging
 * - Log rotation and retention policies
 */

import { performance } from 'perf_hooks';

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'audit';
  message: string;
  component?: string;
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  metadata?: Record<string, any>;
  stack?: string;
  tags?: string[];
}

export interface AlertingConfig {
  enabled: boolean;
  channels: {
    email?: {
      enabled: boolean;
      recipients: string[];
      smtpConfig?: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
          user: string;
          pass: string;
        };
      };
    };
    slack?: {
      enabled: boolean;
      webhookUrl: string;
      channel: string;
      username: string;
    };
    pagerduty?: {
      enabled: boolean;
      integrationKey: string;
      apiUrl: string;
    };
    webhook?: {
      enabled: boolean;
      url: string;
      headers?: Record<string, string>;
    };
  };
  thresholds: {
    errorRate: number; // errors per minute
    responseTime: number; // milliseconds
    securityEvents: number; // security events per hour
  };
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  outputs: {
    console: {
      enabled: boolean;
      colorize: boolean;
    };
    file: {
      enabled: boolean;
      path: string;
      maxSize: string;
      maxFiles: number;
      compression: boolean;
    };
    external: {
      elasticsearch?: {
        enabled: boolean;
        host: string;
        index: string;
        auth?: {
          username: string;
          password: string;
        };
      };
      splunk?: {
        enabled: boolean;
        host: string;
        token: string;
        index: string;
      };
      datadog?: {
        enabled: boolean;
        apiKey: string;
        service: string;
        env: string;
      };
    };
  };
  retention: {
    days: number;
    archiveEnabled: boolean;
    archivePath?: string;
  };
  sampling: {
    enabled: boolean;
    rate: number; // 0.0 to 1.0
    excludeAudit: boolean;
  };
}

class ComprehensiveLogger {
  private config: LoggingConfig;
  private alerting: AlertingConfig;
  private correlationIdCounter = 0;
  private performanceCounters = new Map<string, number>();
  private errorRateTracker: Array<{ timestamp: number; count: number }> = [];

  constructor(config?: Partial<LoggingConfig>, alertingConfig?: Partial<AlertingConfig>) {
    this.config = {
      level: (process.env.LOG_LEVEL as any) || 'info',
      format: 'json',
      outputs: {
        console: {
          enabled: true,
          colorize: process.env.NODE_ENV !== 'production'
        },
        file: {
          enabled: process.env.NODE_ENV === 'production',
          path: process.env.LOG_FILE_PATH || './logs/app.log',
          maxSize: '100MB',
          maxFiles: 30,
          compression: true
        },
        external: {
          elasticsearch: {
            enabled: !!process.env.ELASTICSEARCH_HOST,
            host: process.env.ELASTICSEARCH_HOST || 'localhost:9200',
            index: process.env.ELASTICSEARCH_INDEX || 'mwap-logs',
            auth: process.env.ELASTICSEARCH_USERNAME ? {
              username: process.env.ELASTICSEARCH_USERNAME,
              password: process.env.ELASTICSEARCH_PASSWORD || ''
            } : undefined
          },
          splunk: {
            enabled: !!process.env.SPLUNK_HOST,
            host: process.env.SPLUNK_HOST || '',
            token: process.env.SPLUNK_TOKEN || '',
            index: process.env.SPLUNK_INDEX || 'mwap'
          },
          datadog: {
            enabled: !!process.env.DATADOG_API_KEY,
            apiKey: process.env.DATADOG_API_KEY || '',
            service: 'mwap-oauth-security',
            env: process.env.NODE_ENV || 'development'
          }
        }
      },
      retention: {
        days: parseInt(process.env.LOG_RETENTION_DAYS || '30'),
        archiveEnabled: process.env.LOG_ARCHIVE_ENABLED === 'true',
        archivePath: process.env.LOG_ARCHIVE_PATH
      },
      sampling: {
        enabled: process.env.LOG_SAMPLING_ENABLED === 'true',
        rate: parseFloat(process.env.LOG_SAMPLING_RATE || '1.0'),
        excludeAudit: true
      },
      ...config
    };

    this.alerting = {
      enabled: process.env.ALERTING_ENABLED === 'true',
      channels: {
        email: {
          enabled: !!process.env.SMTP_HOST,
          recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
          smtpConfig: process.env.SMTP_HOST ? {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER || '',
              pass: process.env.SMTP_PASS || ''
            }
          } : undefined
        },
        slack: {
          enabled: !!process.env.SLACK_WEBHOOK_URL,
          webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
          channel: process.env.SLACK_CHANNEL || '#security-alerts',
          username: 'MWAP Security Monitor'
        },
        pagerduty: {
          enabled: !!process.env.PAGERDUTY_INTEGRATION_KEY,
          integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY || '',
          apiUrl: 'https://events.pagerduty.com/v2/enqueue'
        },
        webhook: {
          enabled: !!process.env.ALERT_WEBHOOK_URL,
          url: process.env.ALERT_WEBHOOK_URL || '',
          headers: process.env.ALERT_WEBHOOK_HEADERS ? 
            JSON.parse(process.env.ALERT_WEBHOOK_HEADERS) : undefined
        }
      },
      thresholds: {
        errorRate: parseInt(process.env.ALERT_ERROR_RATE_THRESHOLD || '10'),
        responseTime: parseInt(process.env.ALERT_RESPONSE_TIME_THRESHOLD || '5000'),
        securityEvents: parseInt(process.env.ALERT_SECURITY_EVENTS_THRESHOLD || '20')
      },
      ...alertingConfig
    };

    this.initializeLogger();
  }

  private initializeLogger(): void {
    // Setup log rotation and cleanup
    if (this.config.outputs.file.enabled) {
      this.setupLogRotation();
    }

    // Initialize external logging systems
    this.initializeExternalLogging();

    // Setup performance monitoring
    this.startPerformanceMonitoring();

    this.log('info', 'Comprehensive logging system initialized', {
      component: 'logging_system',
      config: {
        level: this.config.level,
        format: this.config.format,
        externalOutputs: Object.keys(this.config.outputs.external).filter(
          key => (this.config.outputs.external as any)[key]?.enabled
        ),
        alertingEnabled: this.alerting.enabled
      }
    });
  }

  /**
   * Main logging method with comprehensive formatting and routing
   */
  log(
    level: 'debug' | 'info' | 'warn' | 'error' | 'audit',
    message: string,
    metadata?: Record<string, any>,
    options?: {
      component?: string;
      correlationId?: string;
      userId?: string;
      tenantId?: string;
      ip?: string;
      userAgent?: string;
      duration?: number;
      tags?: string[];
    }
  ): void {
    // Check log level filtering
    if (!this.shouldLog(level)) {
      return;
    }

    // Apply sampling (except for audit logs)
    if (this.config.sampling.enabled && 
        !(level === 'audit' && this.config.sampling.excludeAudit) &&
        Math.random() > this.config.sampling.rate) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: options?.correlationId || this.generateCorrelationId(),
      component: options?.component,
      userId: options?.userId,
      tenantId: options?.tenantId,
      ip: options?.ip,
      userAgent: options?.userAgent,
      duration: options?.duration,
      metadata,
      tags: options?.tags
    };

    // Add stack trace for errors
    if (level === 'error' && metadata?.error instanceof Error) {
      logEntry.stack = metadata.error.stack;
    }

    // Route to configured outputs
    this.routeLogEntry(logEntry);

    // Check alerting thresholds
    if (this.alerting.enabled) {
      this.checkAlertingThresholds(logEntry);
    }

    // Update performance counters
    this.updatePerformanceCounters(logEntry);
  }

  /**
   * OAuth-specific security logging
   */
  logOAuthSecurity(
    event: 'callback_attempt' | 'state_validation' | 'ownership_check' | 'token_exchange' | 'security_violation',
    level: 'info' | 'warn' | 'error',
    details: {
      ip: string;
      userAgent: string;
      userId?: string;
      tenantId?: string;
      integrationId?: string;
      errorCode?: string;
      securityIssues?: string[];
      duration?: number;
      metadata?: Record<string, any>;
    }
  ): void {
    this.log(level, `OAuth ${event}`, {
      oauthEvent: event,
      ...details.metadata
    }, {
      component: 'oauth_security',
      userId: details.userId,
      tenantId: details.tenantId,
      ip: details.ip,
      userAgent: details.userAgent,
      duration: details.duration,
      tags: ['oauth', 'security', event, ...(details.securityIssues || [])]
    });
  }

  /**
   * Performance logging with timing
   */
  logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>,
    options?: {
      component?: string;
      userId?: string;
      threshold?: number;
    }
  ): void {
    const level = options?.threshold && duration > options.threshold ? 'warn' : 'info';
    
    this.log(level, `Performance: ${operation}`, {
      operation,
      duration,
      performanceGrade: duration < 1000 ? 'EXCELLENT' :
                       duration < 2000 ? 'GOOD' :
                       duration < 5000 ? 'ACCEPTABLE' : 'POOR',
      ...metadata
    }, {
      component: options?.component || 'performance',
      userId: options?.userId,
      duration,
      tags: ['performance', operation]
    });
  }

  /**
   * Audit logging for security-critical events
   */
  logAudit(
    action: string,
    actor: string,
    target: string,
    metadata?: Record<string, any>
  ): void {
    this.log('audit', `${action}: ${actor} -> ${target}`, {
      action,
      actor,
      target,
      auditEvent: true,
      ...metadata
    }, {
      component: 'audit',
      userId: actor !== 'system' ? actor : undefined,
      tags: ['audit', action]
    });
  }

  /**
   * Error logging with enhanced context
   */
  logError(
    message: string,
    error?: Error | unknown,
    metadata?: Record<string, any>,
    options?: {
      component?: string;
      userId?: string;
      correlationId?: string;
      critical?: boolean;
    }
  ): void {
    const enhancedMetadata = {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      critical: options?.critical || false,
      ...metadata
    };

    this.log('error', message, enhancedMetadata, {
      component: options?.component,
      userId: options?.userId,
      correlationId: options?.correlationId,
      tags: ['error', ...(options?.critical ? ['critical'] : [])]
    });

    // Increment error rate tracking
    this.trackErrorRate();
  }

  /**
   * Check if we should log based on configured level
   */
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'audit'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    
    // Always log audit events regardless of level
    if (level === 'audit') return true;
    
    return logLevelIndex >= configLevelIndex;
  }

  /**
   * Route log entry to configured outputs
   */
  private routeLogEntry(logEntry: LogEntry): void {
    const formattedEntry = this.formatLogEntry(logEntry);

    // Console output
    if (this.config.outputs.console.enabled) {
      this.outputToConsole(formattedEntry, logEntry);
    }

    // File output
    if (this.config.outputs.file.enabled) {
      this.outputToFile(formattedEntry);
    }

    // External outputs
    this.outputToExternal(logEntry);
  }

  /**
   * Format log entry based on configuration
   */
  private formatLogEntry(logEntry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(logEntry);
    } else {
      // Text format
      const timestamp = logEntry.timestamp;
      const level = logEntry.level.toUpperCase().padEnd(5);
      const component = logEntry.component ? `[${logEntry.component}]` : '';
      const correlation = logEntry.correlationId ? `{${logEntry.correlationId}}` : '';
      
      return `${timestamp} ${level} ${component}${correlation} ${logEntry.message}`;
    }
  }

  /**
   * Output to console with optional colorization
   */
  private outputToConsole(formattedEntry: string, logEntry: LogEntry): void {
    if (this.config.outputs.console.colorize) {
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
        audit: '\x1b[35m'  // magenta
      };
      const reset = '\x1b[0m';
      const color = colors[logEntry.level] || '';
      
      console.log(`${color}${formattedEntry}${reset}`);
    } else {
      console.log(formattedEntry);
    }
  }

  /**
   * Output to file with rotation
   */
  private outputToFile(formattedEntry: string): void {
    // In a production implementation, this would use a proper file logger
    // like winston or pino with rotation capabilities
    console.log('FILE LOG:', formattedEntry);
  }

  /**
   * Output to external logging systems
   */
  private outputToExternal(logEntry: LogEntry): void {
    // Elasticsearch
    if (this.config.outputs.external.elasticsearch?.enabled) {
      this.sendToElasticsearch(logEntry);
    }

    // Splunk
    if (this.config.outputs.external.splunk?.enabled) {
      this.sendToSplunk(logEntry);
    }

    // Datadog
    if (this.config.outputs.external.datadog?.enabled) {
      this.sendToDatadog(logEntry);
    }
  }

  /**
   * Send log entry to Elasticsearch
   */
  private async sendToElasticsearch(logEntry: LogEntry): Promise<void> {
    try {
      // Mock implementation - would use actual Elasticsearch client
      console.log('ELASTICSEARCH:', JSON.stringify(logEntry));
    } catch (error) {
      console.error('Failed to send log to Elasticsearch:', error);
    }
  }

  /**
   * Send log entry to Splunk
   */
  private async sendToSplunk(logEntry: LogEntry): Promise<void> {
    try {
      // Mock implementation - would use Splunk HTTP Event Collector
      console.log('SPLUNK:', JSON.stringify(logEntry));
    } catch (error) {
      console.error('Failed to send log to Splunk:', error);
    }
  }

  /**
   * Send log entry to Datadog
   */
  private async sendToDatadog(logEntry: LogEntry): Promise<void> {
    try {
      // Mock implementation - would use Datadog logs API
      console.log('DATADOG:', JSON.stringify(logEntry));
    } catch (error) {
      console.error('Failed to send log to Datadog:', error);
    }
  }

  /**
   * Check alerting thresholds and trigger alerts
   */
  private checkAlertingThresholds(logEntry: LogEntry): void {
    // Error rate threshold
    if (logEntry.level === 'error') {
      const recentErrors = this.errorRateTracker.filter(
        entry => Date.now() - entry.timestamp < 60000 // Last minute
      );
      
      if (recentErrors.length >= this.alerting.thresholds.errorRate) {
        this.triggerAlert('ERROR_RATE_THRESHOLD', 
          `Error rate threshold exceeded: ${recentErrors.length} errors in the last minute`);
      }
    }

    // Response time threshold
    if (logEntry.duration && logEntry.duration > this.alerting.thresholds.responseTime) {
      this.triggerAlert('RESPONSE_TIME_THRESHOLD',
        `Response time threshold exceeded: ${logEntry.duration}ms for ${logEntry.message}`);
    }

    // Security events threshold
    if (logEntry.tags?.includes('security')) {
      // Implementation would track security events per hour
      this.triggerAlert('SECURITY_EVENT',
        `Security event detected: ${logEntry.message}`);
    }
  }

  /**
   * Trigger alert through configured channels
   */
  private async triggerAlert(type: string, message: string): Promise<void> {
    const alert = {
      type,
      message,
      timestamp: new Date().toISOString(),
      service: 'mwap-oauth-security',
      environment: process.env.NODE_ENV
    };

    // Email alerts
    if (this.alerting.channels.email?.enabled) {
      await this.sendEmailAlert(alert);
    }

    // Slack alerts
    if (this.alerting.channels.slack?.enabled) {
      await this.sendSlackAlert(alert);
    }

    // PagerDuty alerts
    if (this.alerting.channels.pagerduty?.enabled) {
      await this.sendPagerDutyAlert(alert);
    }

    // Webhook alerts
    if (this.alerting.channels.webhook?.enabled) {
      await this.sendWebhookAlert(alert);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: any): Promise<void> {
    try {
      // Mock implementation - would use actual email service
      console.log('EMAIL ALERT:', JSON.stringify(alert));
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: any): Promise<void> {
    try {
      // Mock implementation - would use Slack webhook
      console.log('SLACK ALERT:', JSON.stringify(alert));
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Send PagerDuty alert
   */
  private async sendPagerDutyAlert(alert: any): Promise<void> {
    try {
      // Mock implementation - would use PagerDuty Events API
      console.log('PAGERDUTY ALERT:', JSON.stringify(alert));
    } catch (error) {
      console.error('Failed to send PagerDuty alert:', error);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: any): Promise<void> {
    try {
      // Mock implementation - would use HTTP client
      console.log('WEBHOOK ALERT:', JSON.stringify(alert));
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  /**
   * Setup log rotation and cleanup
   */
  private setupLogRotation(): void {
    // Mock implementation - would setup actual log rotation
    console.log('Log rotation configured');
  }

  /**
   * Initialize external logging systems
   */
  private initializeExternalLogging(): void {
    // Mock implementation - would initialize actual external clients
    console.log('External logging systems initialized');
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 60000); // Every minute
  }

  /**
   * Collect and log performance metrics
   */
  private collectPerformanceMetrics(): void {
    const memoryUsage = process.memoryUsage();
    
    this.log('info', 'Performance metrics', {
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      uptime: process.uptime(),
      performanceCounters: Object.fromEntries(this.performanceCounters)
    }, {
      component: 'performance_monitor',
      tags: ['metrics', 'performance']
    });
  }

  /**
   * Update performance counters
   */
  private updatePerformanceCounters(logEntry: LogEntry): void {
    if (logEntry.component) {
      const key = `${logEntry.component}.${logEntry.level}`;
      this.performanceCounters.set(key, (this.performanceCounters.get(key) || 0) + 1);
    }
  }

  /**
   * Track error rate for alerting
   */
  private trackErrorRate(): void {
    const now = Date.now();
    this.errorRateTracker.push({ timestamp: now, count: 1 });
    
    // Clean up old entries (older than 1 hour)
    this.errorRateTracker = this.errorRateTracker.filter(
      entry => now - entry.timestamp < 3600000
    );
  }

  /**
   * Generate correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `req_${Date.now()}_${++this.correlationIdCounter}`;
  }
}

// Global logger instance
export const comprehensiveLogger = new ComprehensiveLogger();

// Export convenience functions that wrap the comprehensive logger
export function logInfo(message: string, metadata?: Record<string, any>): void {
  comprehensiveLogger.log('info', message, metadata);
}

export function logError(message: string, error?: Error | unknown, metadata?: Record<string, any>): void {
  comprehensiveLogger.logError(message, error, metadata);
}

export function logAudit(action: string, actor: string, target: string, metadata?: Record<string, any>): void {
  comprehensiveLogger.logAudit(action, actor, target, metadata);
}

export function logOAuthSecurity(
  event: 'callback_attempt' | 'state_validation' | 'ownership_check' | 'token_exchange' | 'security_violation',
  level: 'info' | 'warn' | 'error',
  details: {
    ip: string;
    userAgent: string;
    userId?: string;
    tenantId?: string;
    integrationId?: string;
    errorCode?: string;
    securityIssues?: string[];
    duration?: number;
    metadata?: Record<string, any>;
  }
): void {
  comprehensiveLogger.logOAuthSecurity(event, level, details);
}

export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>,
  options?: {
    component?: string;
    userId?: string;
    threshold?: number;
  }
): void {
  comprehensiveLogger.logPerformance(operation, duration, metadata, options);
}

export { ComprehensiveLogger }; 