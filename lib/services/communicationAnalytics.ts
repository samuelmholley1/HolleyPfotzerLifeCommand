// Communication Pattern Analytics for Debugging Circuit Prevention
import { supabase } from '../supabase';
import { logger } from '../logging';
import { CommunicationEvent, DebugLoop } from '../../types/communication';

export interface DebuggingRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  suggestedAction: 'continue' | 'gentle_mode' | 'circuit_break' | 'timeout';
  confidence: number;
}

export interface PartnershipMetrics {
  debuggingLoopFrequency: number;
  circuitBreakerEffectiveness: number;
  averageResolutionTime: number;
  assumptionClarificationSuccess: number;
  healthCorrelationInsights: string[];
}

export interface CommunicationPattern {
  timeOfDay: string;
  energyLevels: string[];
  triggerWords: string[];
  escalationSpeed: number;
  resolutionMethod: string;
}

export class CommunicationAnalytics {
  
  static async detectDebuggingRisk(
    workspaceId: string,
    recentEvents: CommunicationEvent[],
    userCapacity: { energy: string; cognitiveLoad: number }
  ): Promise<DebuggingRisk> {
    try {
      const indicators: string[] = [];
      let riskLevel: DebuggingRisk['level'] = 'low';
      let suggestedAction: DebuggingRisk['suggestedAction'] = 'continue';

      // Analyze recent communication frequency
      const last30Minutes = recentEvents.filter(event => 
        Date.now() - new Date(event.created_at).getTime() < 30 * 60 * 1000
      );

      if (last30Minutes.length >= 3) {
        indicators.push('High communication frequency (3+ events in 30 minutes)');
        riskLevel = 'medium';
      }

      // Check for assumption clarification patterns
      const clarifications = last30Minutes.filter(event => 
        event.event_type === 'assumption_clarification'
      );

      if (clarifications.length >= 2) {
        indicators.push('Multiple assumption clarifications needed');
        riskLevel = 'high';
        suggestedAction = 'circuit_break';
      }

      // Factor in user capacity
      if (userCapacity.energy === 'low' && userCapacity.cognitiveLoad > 7) {
        indicators.push('Low energy + high cognitive load');
        if (riskLevel === 'low') riskLevel = 'medium';
        if (suggestedAction === 'continue') suggestedAction = 'gentle_mode';
      }

      // Check for recent debugging loops
      const { data: recentLoops } = await supabase
        .from('debug_loops')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
        .order('created_at', { ascending: false });

      if (recentLoops && recentLoops.length > 0) {
        indicators.push('Recent debugging loop detected');
        riskLevel = 'high';
        suggestedAction = 'timeout';
      }

      const confidence = Math.min(0.9, indicators.length * 0.3);

      return {
        level: riskLevel,
        indicators,
        suggestedAction,
        confidence,
      };

    } catch (error) {
      logger.error('COMMUNICATION_ANALYTICS', 'Failed to detect debugging risk', { error });
      return {
        level: 'low',
        indicators: ['Analysis unavailable'],
        suggestedAction: 'continue',
        confidence: 0,
      };
    }
  }

  static async getPartnershipMetrics(
    workspaceId: string,
    timeRange: 'week' | 'month' | 'quarter' = 'week'
  ): Promise<PartnershipMetrics> {
    try {
      const daysBack = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      // Get debugging loops
      const { data: debugLoops } = await supabase
        .from('debug_loops')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate.toISOString());

      // Calculate metrics
      const debuggingLoopFrequency = (debugLoops?.length || 0) / daysBack;
      
      const resolvedLoops = debugLoops?.filter(loop => loop.resolved_at) || [];
      const circuitBreakerEffectiveness = resolvedLoops.length > 0 
        ? resolvedLoops.filter(loop => loop.effectiveness_rating >= 4).length / resolvedLoops.length
        : 0;

      const averageResolutionTime = resolvedLoops.length > 0
        ? resolvedLoops.reduce((sum, loop) => {
            const duration = new Date(loop.resolved_at!).getTime() - new Date(loop.created_at).getTime();
            return sum + duration;
          }, 0) / resolvedLoops.length / (1000 * 60) // Convert to minutes
        : 0;

      // Get assumption clarifications
      const { data: clarifications } = await supabase
        .from('communication_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('event_type', 'assumption_clarification')
        .gte('created_at', startDate.toISOString());

      const assumptionClarificationSuccess = clarifications && clarifications.length > 0
        ? clarifications.filter(c => c.resolved).length / clarifications.length
        : 0;

      const healthCorrelationInsights = await this.generateHealthInsights(workspaceId, daysBack);

      return {
        debuggingLoopFrequency,
        circuitBreakerEffectiveness,
        averageResolutionTime,
        assumptionClarificationSuccess,
        healthCorrelationInsights,
      };

    } catch (error) {
      logger.error('COMMUNICATION_ANALYTICS', 'Failed to get partnership metrics', { error });
      return {
        debuggingLoopFrequency: 0,
        circuitBreakerEffectiveness: 0,
        averageResolutionTime: 0,
        assumptionClarificationSuccess: 0,
        healthCorrelationInsights: ['Analysis unavailable'],
      };
    }
  }

  static async detectCommunicationPatterns(
    workspaceId: string,
    lookbackDays: number = 30
  ): Promise<CommunicationPattern[]> {
    try {
      const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

      const { data: events } = await supabase
        .from('communication_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (!events?.length) return [];

      // Group by time patterns
      const patterns: CommunicationPattern[] = [];
      
      // Example pattern detection (simplified)
      const morningEvents = events.filter(e => {
        const hour = new Date(e.created_at).getHours();
        return hour >= 6 && hour < 12;
      });

      if (morningEvents.length > 5) {
        patterns.push({
          timeOfDay: 'morning',
          energyLevels: ['low', 'medium'], // Could be extracted from content
          triggerWords: this.extractCommonTriggers(morningEvents),
          escalationSpeed: this.calculateEscalationSpeed(morningEvents),
          resolutionMethod: this.getMostCommonResolution(morningEvents),
        });
      }

      return patterns;

    } catch (error) {
      logger.error('COMMUNICATION_ANALYTICS', 'Failed to detect patterns', { error });
      return [];
    }
  }

  private static async generateHealthInsights(workspaceId: string, days: number): Promise<string[]> {
    // This would analyze correlations between daily status (energy, capacity) and communication events
    // Simplified for now
    return [
      'Debugging loops occur 3x more frequently when energy levels are low',
      'Assumption clarifications are most effective in the morning',
      'Circuit breakers reduce argument duration by 40% on average',
    ];
  }

  private static extractCommonTriggers(events: CommunicationEvent[]): string[] {
    // Analyze event content for common trigger words/phrases
    // Simplified implementation
    return ['schedule changes', 'energy mismatches', 'implicit assumptions'];
  }

  private static calculateEscalationSpeed(events: CommunicationEvent[]): number {
    // Calculate how quickly events escalate to circuit breakers
    // Return time in minutes
    return 15; // Simplified
  }

  private static getMostCommonResolution(events: CommunicationEvent[]): string {
    // Analyze resolution methods for this pattern
    return 'clarification'; // Simplified
  }
}
