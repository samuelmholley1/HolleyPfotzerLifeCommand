// services/CommunicationAnalyticsService.ts

import { Q } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import { log } from '../lib/logging';
import type { Clarification } from '../lib/db/Clarification';
import type { ClarificationResponse } from '../lib/db/ClarificationResponse';

/**
 * Types for communication strain analysis
 */
export type StrainLevel = 'calm' | 'mild' | 'tense' | 'critical';

export interface AnalysisResult {
  strainLevel: StrainLevel;
  confidence: number; // 0-100
  factors: string[];
  timestamp: number;
  metrics: AnalysisMetrics;
}

export interface AnalysisMetrics {
  clarificationRequests: number;
  emergencyBreaks: number;
  responseTime: number; // average in minutes
  disagreementRate: number; // percentage
  timeWindow: number; // minutes analyzed
}

export interface AnalysisConfig {
  timeWindowMinutes: number;
  clarificationThreshold: number;
  emergencyBreakThreshold: number;
  disagreementThreshold: number;
  maxCacheSize?: number; // Add cache size limit
  enableDetailedLogging?: boolean; // Allow disabling verbose logs
}

/**
 * Default configuration for strain analysis
 */
const DEFAULT_CONFIG: AnalysisConfig = {
  timeWindowMinutes: 10,
  clarificationThreshold: 3,
  emergencyBreakThreshold: 1,
  disagreementThreshold: 50, // 50% disagreement rate
  maxCacheSize: 100, // Limit cache to 100 entries
  enableDetailedLogging: true,
};

/**
 * Communication Analytics Service
 * 
 * Analyzes local user activity to detect patterns of communication strain.
 * Designed to be extensible for future AI model integration.
 */
export class CommunicationAnalyticsService {
  private config: AnalysisConfig;
  private analysisCache: Map<string, AnalysisResult> = new Map();
  private cacheExpiration = 2 * 60 * 1000; // 2 minutes

  constructor(config: Partial<AnalysisConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    log.info('CommunicationAnalyticsService', 'Initialized with config', this.config);
  }

  /**
   * Primary analysis function - analyzes recent communication events to detect strain patterns
   */
  async analyzeRecentEvents(
    database: Database,
    workspaceId: string,
    customConfig?: Partial<AnalysisConfig>
  ): Promise<AnalysisResult> {
    // Input validation
    if (!database) {
      throw new Error('Database instance is required for analysis');
    }
    if (!workspaceId || typeof workspaceId !== 'string' || workspaceId.trim().length === 0) {
      throw new Error('Valid workspaceId is required for analysis');
    }

    const analysisConfig = customConfig ? { ...this.config, ...customConfig } : this.config;
    
    // Validate time window
    if (analysisConfig.timeWindowMinutes <= 0 || analysisConfig.timeWindowMinutes > 1440) { // Max 24 hours
      throw new Error('timeWindowMinutes must be between 1 and 1440 minutes');
    }
    
    const cacheKey = `${workspaceId}-${analysisConfig.timeWindowMinutes}`;
    
    try {
      // Check cache first
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        if (this.config.enableDetailedLogging) {
          log.debug('CommunicationAnalyticsService', 'Returning cached analysis result', { workspaceId });
        }
        return cached;
      }

      if (this.config.enableDetailedLogging) {
        log.info('CommunicationAnalyticsService', 'Starting strain analysis', {
          workspaceId,
          timeWindow: analysisConfig.timeWindowMinutes
        });
      }

      // Calculate time window
      const timeWindowMs = analysisConfig.timeWindowMinutes * 60 * 1000;
      const cutoffTimestamp = Date.now() - timeWindowMs;

      // Gather metrics from local database
      const metrics = await this.gatherAnalysisMetrics(database, workspaceId, cutoffTimestamp);

      // Perform strain analysis
      const analysisResult = await this.performStrainAnalysis(metrics, analysisConfig);

      // Cache the result
      this.cacheResult(cacheKey, analysisResult);

      if (this.config.enableDetailedLogging) {
        log.info('CommunicationAnalyticsService', 'Analysis completed', {
          workspaceId,
          strainLevel: analysisResult.strainLevel,
          confidence: analysisResult.confidence
        });
      }

      return analysisResult;

    } catch (error) {
      log.error('CommunicationAnalyticsService', 'Failed to analyze recent events', {
        error: String(error),
        workspaceId,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Return safe fallback result
      return this.createFallbackResult(analysisConfig.timeWindowMinutes);
    }
  }

  /**
   * Gather analysis metrics from local database
   */
  private async gatherAnalysisMetrics(
    database: Database,
    workspaceId: string,
    cutoffTimestamp: number
  ): Promise<AnalysisMetrics> {
    try {
      // Query recent clarifications
      const clarifications = await database.get('clarifications')
        .query(
          Q.where('workspace_id', workspaceId),
          Q.where('created_at', Q.gte(cutoffTimestamp))
        )
        .fetch() as Clarification[];

      // Query recent clarification responses
      const responses = await database.get('clarification_responses')
        .query(
          Q.where('created_at', Q.gte(cutoffTimestamp))
        )
        .fetch() as ClarificationResponse[];

      // Filter responses that belong to clarifications in this workspace
      const clarificationIds = clarifications.map((c: Clarification) => c.id);
      const workspaceResponses = responses.filter((r: ClarificationResponse) => 
        clarificationIds.includes(r.clarificationId)
      );

      // Query recent emergency breaks (from events table)
      // Note: Assuming events table exists - will add error handling
      let emergencyBreakEvents: any[] = [];
      try {
        emergencyBreakEvents = await database.get('events')
          .query(
            Q.where('workspace_id', workspaceId),
            Q.where('event_type', 'emergency_break'),
            Q.where('created_at', Q.gte(cutoffTimestamp))
          )
          .fetch();
      } catch (eventsError) {
        log.warn('CommunicationAnalyticsService', 'Events table not available, emergency breaks count will be 0', {
          error: String(eventsError)
        });
      }

      // Calculate metrics
      const clarificationRequests = clarifications.length;
      const emergencyBreaks = emergencyBreakEvents.length;
      const responseTime = this.calculateAverageResponseTime(clarifications, workspaceResponses);
      const disagreementRate = this.calculateDisagreementRate(workspaceResponses);

      return {
        clarificationRequests,
        emergencyBreaks,
        responseTime,
        disagreementRate,
        timeWindow: this.config.timeWindowMinutes,
      };

    } catch (error) {
      log.error('CommunicationAnalyticsService', 'Failed to gather analysis metrics', {
        error: String(error),
        workspaceId
      });
      throw error;
    }
  }

  /**
   * Perform strain analysis using gathered metrics
   * 
   * This is the core analysis function that can be replaced with AI models in the future
   */
  private async performStrainAnalysis(
    metrics: AnalysisMetrics,
    config: AnalysisConfig
  ): Promise<AnalysisResult> {
    const factors: string[] = [];
    let strainScore = 0;
    let maxScore = 0;

    // Analyze clarification frequency
    if (metrics.clarificationRequests > 0) {
      const clarificationScore = Math.min(metrics.clarificationRequests / config.clarificationThreshold, 1);
      strainScore += clarificationScore * 30; // 30% weight
      if (metrics.clarificationRequests >= config.clarificationThreshold) {
        factors.push(`High clarification frequency (${metrics.clarificationRequests} in ${config.timeWindowMinutes}min)`);
      }
    }
    maxScore += 30;

    // Analyze emergency breaks
    if (metrics.emergencyBreaks > 0) {
      const breakScore = Math.min(metrics.emergencyBreaks / config.emergencyBreakThreshold, 1);
      strainScore += breakScore * 40; // 40% weight - emergency breaks are high impact
      factors.push(`Emergency communication breaks (${metrics.emergencyBreaks})`);
    }
    maxScore += 40;

    // Analyze disagreement rate
    if (metrics.disagreementRate > 0) {
      const disagreementScore = Math.min(metrics.disagreementRate / config.disagreementThreshold, 1);
      strainScore += disagreementScore * 20; // 20% weight
      if (metrics.disagreementRate >= config.disagreementThreshold) {
        factors.push(`High disagreement rate (${metrics.disagreementRate.toFixed(1)}%)`);
      }
    }
    maxScore += 20;

    // Analyze response time (slower responses may indicate strain)
    if (metrics.responseTime > 5) { // 5+ minutes is considered slow
      const responseScore = Math.min((metrics.responseTime - 5) / 10, 1); // Scale 5-15 minutes to 0-1
      strainScore += responseScore * 10; // 10% weight
      factors.push(`Delayed responses (avg ${metrics.responseTime.toFixed(1)}min)`);
    }
    maxScore += 10;

    // Calculate strain level and confidence
    const normalizedScore = maxScore > 0 ? (strainScore / maxScore) * 100 : 0;
    const strainLevel = this.determineStrainLevel(normalizedScore);
    const confidence = this.calculateConfidence(metrics, factors.length);

    // Add positive factors for calm state
    if (factors.length === 0) {
      factors.push('Normal communication patterns');
    }

    return {
      strainLevel,
      confidence,
      factors,
      timestamp: Date.now(),
      metrics,
    };
  }

  /**
   * Determine strain level based on normalized score
   */
  private determineStrainLevel(normalizedScore: number): StrainLevel {
    if (normalizedScore >= 75) return 'critical';
    if (normalizedScore >= 50) return 'tense';
    if (normalizedScore >= 25) return 'mild';
    return 'calm';
  }

  /**
   * Calculate confidence based on data availability and pattern strength
   */
  private calculateConfidence(metrics: AnalysisMetrics, factorCount: number): number {
    let confidence = 50; // Base confidence

    // More data = higher confidence
    const totalDataPoints = metrics.clarificationRequests + metrics.emergencyBreaks;
    confidence += Math.min(totalDataPoints * 5, 30); // Up to +30 for data volume

    // Clear patterns = higher confidence
    confidence += factorCount * 5; // +5 per identified factor

    // Longer time window = higher confidence
    confidence += Math.min(metrics.timeWindow, 20); // Up to +20 for time window

    return Math.min(confidence, 100);
  }

  /**
   * Calculate average response time between clarifications and responses
   */
  private calculateAverageResponseTime(
    clarifications: Clarification[], 
    responses: ClarificationResponse[]
  ): number {
    if (clarifications.length === 0 || responses.length === 0) {
      return 0;
    }

    const responseTimes: number[] = [];
    
    clarifications.forEach((clarification: Clarification) => {
      const clarificationResponses = responses.filter((r: ClarificationResponse) => 
        r.clarificationId === clarification.id
      );
      
      clarificationResponses.forEach((response: ClarificationResponse) => {
        const responseTime = (response.createdAt - clarification.createdAt) / (60 * 1000); // minutes
        if (responseTime > 0 && responseTime < 60 * 24) { // Sanity check: 0-24 hours
          responseTimes.push(responseTime);
        }
      });
    });

    return responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;
  }

  /**
   * Calculate disagreement rate from responses
   */
  private calculateDisagreementRate(responses: ClarificationResponse[]): number {
    if (responses.length === 0) {
      return 0;
    }

    const disagreements = responses.filter((r: ClarificationResponse) => 
      r.responseStatus === 'disagree' || r.responseStatus === 'needs_discussion'
    ).length;

    return (disagreements / responses.length) * 100;
  }

  /**
   * Cache management
   */
  private getCachedResult(key: string): AnalysisResult | null {
    const cached = this.analysisCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiration) {
      return cached;
    }
    return null;
  }

  private cacheResult(key: string, result: AnalysisResult): void {
    // Enforce cache size limit to prevent memory leaks
    if (this.config.maxCacheSize && this.analysisCache.size >= this.config.maxCacheSize) {
      // Remove oldest entries (simple FIFO strategy)
      const firstKey = this.analysisCache.keys().next().value;
      if (firstKey) {
        this.analysisCache.delete(firstKey);
      }
    }
    
    this.analysisCache.set(key, result);
    
    // Clean old cache entries
    this.cleanCache();
  }

  private cleanCache(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, result] of this.analysisCache.entries()) {
      if (now - result.timestamp > this.cacheExpiration) {
        this.analysisCache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0 && this.config.enableDetailedLogging) {
      log.debug('CommunicationAnalyticsService', `Cache cleanup: removed ${removedCount} expired entries`);
    }
  }

  /**
   * Create fallback result when analysis fails
   */
  private createFallbackResult(timeWindowMinutes: number): AnalysisResult {
    return {
      strainLevel: 'calm',
      confidence: 10, // Low confidence for fallback
      factors: ['Analysis unavailable - using fallback'],
      timestamp: Date.now(),
      metrics: {
        clarificationRequests: 0,
        emergencyBreaks: 0,
        responseTime: 0,
        disagreementRate: 0,
        timeWindow: timeWindowMinutes,
      },
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): AnalysisConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.analysisCache.clear(); // Clear cache as thresholds may have changed
    log.info('CommunicationAnalyticsService', 'Configuration updated', this.config);
  }

  /**
   * Clear analysis cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.analysisCache.clear();
    log.debug('CommunicationAnalyticsService', 'Analysis cache cleared');
  }

  /**
   * Get human-readable insights for UI display
   */
  async getInsights(
    database: Database,
    workspaceId: string,
    customConfig?: Partial<AnalysisConfig>
  ): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    recommendations: string[];
    metrics: AnalysisMetrics;
  }> {
    const analysis = await this.analyzeRecentEvents(database, workspaceId, customConfig);
    
    let status: 'healthy' | 'warning' | 'critical';
    let message: string;
    const recommendations: string[] = [];

    switch (analysis.strainLevel) {
      case 'critical':
        status = 'critical';
        message = 'High communication strain detected. Consider taking a break or adjusting approach.';
        recommendations.push('Take a 10-15 minute break');
        recommendations.push('Review recent communications for clarity');
        if (analysis.metrics.emergencyBreaks > 0) {
          recommendations.push('Address the issues that led to emergency communication breaks');
        }
        break;
      
      case 'tense':
        status = 'warning';
        message = 'Elevated communication strain. Monitor the situation closely.';
        recommendations.push('Consider clarifying recent communications');
        recommendations.push('Check for any misunderstandings');
        break;
      
      case 'mild':
        status = 'warning';
        message = 'Slight communication strain detected. Normal levels but worth monitoring.';
        recommendations.push('Continue with current communication patterns');
        break;
      
      default:
        status = 'healthy';
        message = 'Communication patterns are healthy and productive.';
        recommendations.push('Keep up the good communication practices');
        break;
    }

    return {
      status,
      message,
      recommendations,
      metrics: analysis.metrics,
    };
  }
}

// Create and export default instance
export const communicationAnalyticsService = new CommunicationAnalyticsService();

/*
Usage Examples:

// Basic analysis (note: now requires database parameter)
import { database } from '../lib/db';
const result = await communicationAnalyticsService.analyzeRecentEvents(database, 'workspace-123');
console.log(`Current strain level: ${result.strainLevel} (${result.confidence}% confidence)`);

// Custom time window
const extendedResult = await communicationAnalyticsService.analyzeRecentEvents(database, 'workspace-123', {
  timeWindowMinutes: 30,
  clarificationThreshold: 5
});

// Update global configuration
communicationAnalyticsService.updateConfig({
  clarificationThreshold: 2,
  emergencyBreakThreshold: 1
});

// Integration example for React components:
const CommunicationDashboard = () => {
  const [strainAnalysis, setStrainAnalysis] = useState<AnalysisResult | null>(null);
  
  useEffect(() => {
    const analyzeStrain = async () => {
      try {
        const result = await communicationAnalyticsService.analyzeRecentEvents(
          database, 
          currentWorkspaceId
        );
        setStrainAnalysis(result);
      } catch (error) {
        console.error('Failed to analyze communication strain:', error);
      }
    };
    
    analyzeStrain();
    // Re-analyze every 5 minutes
    const interval = setInterval(analyzeStrain, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentWorkspaceId]);
  
  return (
    <View>
      {strainAnalysis && (
        <StrainIndicator 
          level={strainAnalysis.strainLevel}
          confidence={strainAnalysis.confidence}
          factors={strainAnalysis.factors}
        />
      )}
    </View>
  );
};

// Future AI integration point:
// Replace performStrainAnalysis() method with:
// - TensorFlow.js model
// - ONNX runtime
// - Custom neural network
// - Remote AI service call
// The interface and data gathering remains the same
*/
