/**
 * OpenAPI Performance Service
 * 
 * Provides performance optimization, monitoring, and benchmarking
 * for OpenAPI documentation generation
 */

import { logInfo, logError, logAudit } from '../../utils/logger.js';
import { openAPIService } from '../../services/openapi/index.js';

export interface PerformanceMetrics {
  generationTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  documentSize: number;
  routeDiscoveryTime: number;
  schemaGenerationTime: number;
  documentBuildTime: number;
  timestamp: string;
}

export interface PerformanceBenchmark {
  operation: string;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  throughput: number; // operations per second
  timestamp: string;
}

export interface CacheConfiguration {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  compressionEnabled: boolean;
  lazyLoadingEnabled: boolean;
}

export interface OptimizationRecommendations {
  cacheOptimizations: string[];
  performanceIssues: string[];
  memoryOptimizations: string[];
  scalabilityRecommendations: string[];
}

/**
 * OpenAPI Performance Service
 */
export class OpenAPIPerformanceService {
  private metricsHistory: PerformanceMetrics[] = [];
  private benchmarkHistory: PerformanceBenchmark[] = [];
  private readonly maxHistorySize = 1000;
  private cacheConfig: CacheConfiguration;

  constructor() {
    this.cacheConfig = {
      enabled: true,
      ttl: process.env.NODE_ENV === 'production' ? 3600000 : 300000, // 1 hour prod, 5 min dev
      maxSize: 100,
      compressionEnabled: true,
      lazyLoadingEnabled: true
    };
  }

  /**
   * Collect comprehensive performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    const initialMemory = process.memoryUsage();

    logInfo('Collecting OpenAPI performance metrics');

    try {
      // Measure route discovery time
      const routeDiscoveryStart = Date.now();
      const { routeDiscoveryService } = await import('../../services/openapi/RouteDiscoveryService.js');
      await routeDiscoveryService.scanRoutes();
      const routeDiscoveryTime = Date.now() - routeDiscoveryStart;

      // Measure schema generation time
      const schemaGenerationStart = Date.now();
      const { schemaGenerationService } = await import('../../services/openapi/SchemaGenerationService.js');
      await schemaGenerationService.getAllSchemas();
      const schemaGenerationTime = Date.now() - schemaGenerationStart;

      // Measure document build time
      const documentBuildStart = Date.now();
      const document = await openAPIService.generateDocument();
      const documentBuildTime = Date.now() - documentBuildStart;

      // Calculate metrics
      const finalMemory = process.memoryUsage();
      const memoryUsage = finalMemory.heapUsed - initialMemory.heapUsed;
      const documentSize = JSON.stringify(document).length;
      const generationTime = Date.now() - startTime;

      // Get cache metrics
      const cacheStatus = openAPIService.getCacheStatus();
      const cacheHitRate = this.calculateCacheHitRate();

      const metrics: PerformanceMetrics = {
        generationTime,
        cacheHitRate,
        memoryUsage,
        documentSize,
        routeDiscoveryTime,
        schemaGenerationTime,
        documentBuildTime,
        timestamp: new Date().toISOString()
      };

      // Store in history
      this.addMetricsToHistory(metrics);

      logInfo('Performance metrics collected', {
        generationTime,
        cacheHitRate,
        memoryUsage: Math.round(memoryUsage / 1024) + 'KB',
        documentSize: Math.round(documentSize / 1024) + 'KB'
      });

      return metrics;

    } catch (error) {
      logError('Failed to collect performance metrics', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Run performance benchmarks
   */
  async runBenchmarks(iterations: number = 10): Promise<PerformanceBenchmark[]> {
    logInfo('Running OpenAPI performance benchmarks', { iterations });

    const benchmarks: PerformanceBenchmark[] = [];

    try {
      // Benchmark document generation
      const documentGenerationBenchmark = await this.benchmarkOperation(
        'Document Generation',
        () => openAPIService.generateDocument(),
        iterations
      );
      benchmarks.push(documentGenerationBenchmark);

      // Benchmark route discovery
      const { routeDiscoveryService } = await import('../../services/openapi/RouteDiscoveryService.js');
      const routeDiscoveryBenchmark = await this.benchmarkOperation(
        'Route Discovery',
        () => routeDiscoveryService.scanRoutes(),
        iterations
      );
      benchmarks.push(routeDiscoveryBenchmark);

      // Benchmark schema generation
      const { schemaGenerationService } = await import('../../services/openapi/SchemaGenerationService.js');
      const schemaGenerationBenchmark = await this.benchmarkOperation(
        'Schema Generation',
        () => schemaGenerationService.getAllSchemas(),
        iterations
      );
      benchmarks.push(schemaGenerationBenchmark);

      // Benchmark info generation
      const infoGenerationBenchmark = await this.benchmarkOperation(
        'Info Generation',
        () => openAPIService.generateInfo(),
        iterations
      );
      benchmarks.push(infoGenerationBenchmark);

      // Store benchmarks in history
      benchmarks.forEach(benchmark => this.addBenchmarkToHistory(benchmark));

      logInfo('Performance benchmarks completed', {
        benchmarkCount: benchmarks.length,
        averageDocumentGeneration: documentGenerationBenchmark.averageTime
      });

      return benchmarks;

    } catch (error) {
      logError('Failed to run performance benchmarks', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Benchmark a specific operation
   */
  private async benchmarkOperation(
    operationName: string,
    operation: () => Promise<any>,
    iterations: number
  ): Promise<PerformanceBenchmark> {
    const times: number[] = [];

    // Warm up
    await operation();

    // Run benchmark iterations
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await operation();
      const end = Date.now();
      times.push(end - start);
    }

    // Calculate statistics
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    // Calculate standard deviation
    const variance = times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);
    
    const throughput = 1000 / averageTime; // operations per second

    return {
      operation: operationName,
      iterations,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      throughput,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Optimize cache configuration
   */
  async optimizeCache(): Promise<CacheConfiguration> {
    logInfo('Optimizing cache configuration');

    try {
      const metrics = await this.collectMetrics();
      const recommendations = await this.generateOptimizationRecommendations();

      // Adjust TTL based on performance
      if (metrics.generationTime > 1000) { // If generation takes more than 1 second
        this.cacheConfig.ttl = Math.max(this.cacheConfig.ttl * 2, 3600000); // Increase TTL, max 1 hour
      } else if (metrics.generationTime < 100) { // If generation is very fast
        this.cacheConfig.ttl = Math.min(this.cacheConfig.ttl / 2, 60000); // Decrease TTL, min 1 minute
      }

      // Adjust based on memory usage
      if (metrics.memoryUsage > 50 * 1024 * 1024) { // If using more than 50MB
        this.cacheConfig.compressionEnabled = true;
        this.cacheConfig.maxSize = Math.max(this.cacheConfig.maxSize / 2, 10);
      }

      // Enable lazy loading for large applications
      if (metrics.documentSize > 1024 * 1024) { // If document is larger than 1MB
        this.cacheConfig.lazyLoadingEnabled = true;
      }

      logInfo('Cache configuration optimized', {
        ttl: this.cacheConfig.ttl,
        maxSize: this.cacheConfig.maxSize,
        compressionEnabled: this.cacheConfig.compressionEnabled,
        lazyLoadingEnabled: this.cacheConfig.lazyLoadingEnabled
      });

      return this.cacheConfig;

    } catch (error) {
      logError('Failed to optimize cache configuration', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations(): Promise<OptimizationRecommendations> {
    const metrics = await this.collectMetrics();
    const recommendations: OptimizationRecommendations = {
      cacheOptimizations: [],
      performanceIssues: [],
      memoryOptimizations: [],
      scalabilityRecommendations: []
    };

    // Cache optimization recommendations
    if (metrics.cacheHitRate < 0.8) {
      recommendations.cacheOptimizations.push('Increase cache TTL to improve hit rate');
    }
    
    if (metrics.generationTime > 1000) {
      recommendations.cacheOptimizations.push('Enable aggressive caching for slow generation');
    }

    // Performance issue detection
    if (metrics.generationTime > 5000) {
      recommendations.performanceIssues.push('Document generation is very slow (>5s)');
    }
    
    if (metrics.routeDiscoveryTime > 2000) {
      recommendations.performanceIssues.push('Route discovery is slow - consider optimization');
    }
    
    if (metrics.schemaGenerationTime > 2000) {
      recommendations.performanceIssues.push('Schema generation is slow - review schema complexity');
    }

    // Memory optimization recommendations
    if (metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.memoryOptimizations.push('High memory usage - enable compression');
      recommendations.memoryOptimizations.push('Consider reducing cache size');
    }
    
    if (metrics.documentSize > 2 * 1024 * 1024) { // 2MB
      recommendations.memoryOptimizations.push('Large document size - consider schema optimization');
    }

    // Scalability recommendations
    const routeCount = await this.getRouteCount();
    if (routeCount > 100) {
      recommendations.scalabilityRecommendations.push('High route count - consider API versioning');
    }
    
    if (metrics.documentSize > 1024 * 1024) { // 1MB
      recommendations.scalabilityRecommendations.push('Consider splitting API into multiple services');
    }
    
    if (metrics.generationTime > 2000) {
      recommendations.scalabilityRecommendations.push('Enable lazy loading for better scalability');
    }

    return recommendations;
  }

  /**
   * Monitor performance continuously
   */
  async monitorPerformance(): Promise<void> {
    try {
      const metrics = await this.collectMetrics();
      
      // Alert on performance issues
      if (metrics.generationTime > 10000) { // 10 seconds
        logError('Critical performance issue: Document generation taking too long', {
          generationTime: metrics.generationTime,
          documentSize: metrics.documentSize
        });
      }
      
      if (metrics.memoryUsage > 200 * 1024 * 1024) { // 200MB
        logError('High memory usage detected', {
          memoryUsage: Math.round(metrics.memoryUsage / 1024 / 1024) + 'MB'
        });
      }
      
      if (metrics.cacheHitRate < 0.5) {
        logError('Low cache hit rate detected', {
          cacheHitRate: metrics.cacheHitRate
        });
      }

      // Audit log for monitoring
      logAudit('Performance monitoring completed', {
        generationTime: metrics.generationTime,
        cacheHitRate: metrics.cacheHitRate,
        memoryUsage: Math.round(metrics.memoryUsage / 1024) + 'KB',
        documentSize: Math.round(metrics.documentSize / 1024) + 'KB'
      });

    } catch (error) {
      logError('Performance monitoring failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get performance metrics history
   */
  getMetricsHistory(limit: number = 100): PerformanceMetrics[] {
    return this.metricsHistory.slice(0, limit);
  }

  /**
   * Get benchmark history
   */
  getBenchmarkHistory(limit: number = 50): PerformanceBenchmark[] {
    return this.benchmarkHistory.slice(0, limit);
  }

  /**
   * Get current cache configuration
   */
  getCacheConfiguration(): CacheConfiguration {
    return { ...this.cacheConfig };
  }

  /**
   * Update cache configuration
   */
  updateCacheConfiguration(config: Partial<CacheConfiguration>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
    
    logInfo('Cache configuration updated', {
      newConfig: this.cacheConfig
    });
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    // This would need to be implemented based on actual cache statistics
    // For now, return a simulated value based on cache status
    const cacheStatus = openAPIService.getCacheStatus();
    return cacheStatus.cached ? 0.85 : 0.0; // Simulate 85% hit rate when cached
  }

  /**
   * Get route count for scalability analysis
   */
  private async getRouteCount(): Promise<number> {
    try {
      const info = await openAPIService.generateInfo();
      return info.pathCount || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Add metrics to history
   */
  private addMetricsToHistory(metrics: PerformanceMetrics): void {
    this.metricsHistory.unshift(metrics);
    
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Add benchmark to history
   */
  private addBenchmarkToHistory(benchmark: PerformanceBenchmark): void {
    this.benchmarkHistory.unshift(benchmark);
    
    if (this.benchmarkHistory.length > this.maxHistorySize) {
      this.benchmarkHistory = this.benchmarkHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Enable lazy loading for large applications
   */
  async enableLazyLoading(): Promise<void> {
    this.cacheConfig.lazyLoadingEnabled = true;
    
    logInfo('Lazy loading enabled for OpenAPI documentation');
    
    // This would integrate with the core services to enable lazy loading
    // Implementation would depend on the specific lazy loading strategy
  }

  /**
   * Optimize for large applications
   */
  async optimizeForScale(): Promise<void> {
    logInfo('Optimizing OpenAPI system for large scale applications');

    try {
      // Enable compression
      this.cacheConfig.compressionEnabled = true;
      
      // Enable lazy loading
      this.cacheConfig.lazyLoadingEnabled = true;
      
      // Increase cache TTL for production
      if (process.env.NODE_ENV === 'production') {
        this.cacheConfig.ttl = 3600000; // 1 hour
      }
      
      // Reduce cache size to manage memory
      this.cacheConfig.maxSize = 50;

      logInfo('Scale optimization completed', {
        cacheConfig: this.cacheConfig
      });

    } catch (error) {
      logError('Failed to optimize for scale', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

// Export singleton instance
export const openAPIPerformanceService = new OpenAPIPerformanceService();