// CommunicationAnalyticsService Integration Guide
// This file demonstrates the proper usage of the refactored CommunicationAnalyticsService

import { database } from '../lib/db';
import { 
  communicationAnalyticsService, 
  type AnalysisResult,
  type StrainLevel 
} from './CommunicationAnalyticsService';

/**
 * INTEGRATION EXAMPLE 1: Basic Analysis Function
 */
const analyzeWorkspaceCommunication = async (workspaceId: string): Promise<AnalysisResult | null> => {
  try {
    // CORRECT USAGE: Pass database instance as first parameter
    const result = await communicationAnalyticsService.analyzeRecentEvents(
      database,
      workspaceId,
      {
        timeWindowMinutes: 15, // Custom 15-minute window
        clarificationThreshold: 2, // Lower threshold for early detection
      }
    );
    
    console.log(`Communication strain level: ${result.strainLevel} (${result.confidence}% confidence)`);
    console.log('Factors:', result.factors);
    
    return result;
  } catch (error) {
    console.error('Failed to analyze communication strain:', error);
    return null;
  }
};

/**
 * INTEGRATION EXAMPLE 2: Getting User-Friendly Insights
 */
const getCommunicationInsights = async (workspaceId: string) => {
  try {
    const insights = await communicationAnalyticsService.getInsights(
      database,
      workspaceId,
      {
        enableDetailedLogging: false, // Disable verbose logging in production
        timeWindowMinutes: 20,
      }
    );

    return {
      status: insights.status,
      message: insights.message,
      recommendations: insights.recommendations,
      metrics: {
        clarifications: insights.metrics.clarificationRequests,
        emergencyBreaks: insights.metrics.emergencyBreaks,
        avgResponseTime: Math.round(insights.metrics.responseTime),
        disagreementRate: Math.round(insights.metrics.disagreementRate),
      },
    };
  } catch (error) {
    console.error('Failed to get communication insights:', error);
    return null;
  }
};

/**
 * INTEGRATION EXAMPLE 3: Background Monitoring Service
 */
class CommunicationHealthMonitor {
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private lastStrainLevel: StrainLevel = 'calm';

  startMonitoring(workspaceId: string, intervalMinutes: number = 10) {
    this.stopMonitoring(); // Clear any existing monitoring

    this.monitoringInterval = setInterval(async () => {
      try {
        const result = await communicationAnalyticsService.analyzeRecentEvents(
          database,
          workspaceId,
          {
            enableDetailedLogging: false, // Background monitoring should be quiet
          }
        );

        // Only trigger notifications on strain level changes
        if (result.strainLevel !== this.lastStrainLevel) {
          this.handleStrainLevelChange(this.lastStrainLevel, result.strainLevel, result);
          this.lastStrainLevel = result.strainLevel;
        }

      } catch (error) {
        console.error('Background strain monitoring failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`Started communication health monitoring for workspace ${workspaceId}`);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Stopped communication health monitoring');
    }
  }

  private handleStrainLevelChange(
    oldLevel: StrainLevel,
    newLevel: StrainLevel,
    analysis: AnalysisResult
  ) {
    console.log(`Communication strain changed from ${oldLevel} to ${newLevel}`);
    
    if (newLevel === 'critical' && oldLevel !== 'critical') {
      this.handleCriticalStrain(analysis);
    } else if (newLevel === 'calm' && oldLevel !== 'calm') {
      console.log('✅ Communication patterns have improved');
    }
  }

  private handleCriticalStrain(analysis: AnalysisResult) {
    console.warn('🚨 Critical communication strain detected!');
    console.warn(`Confidence: ${analysis.confidence}%`);
    console.warn(`Factors: ${analysis.factors.join(', ')}`);
    
    // In a real app, this might trigger push notifications, alerts, etc.
  }
}

/**
 * CONFIGURATION EXAMPLES
 */
const analyticsConfigurations = {
  // High-sensitivity configuration for early detection
  highSensitivity: {
    timeWindowMinutes: 5,
    clarificationThreshold: 1,
    emergencyBreakThreshold: 1,
    disagreementThreshold: 25,
    maxCacheSize: 50,
    enableDetailedLogging: true,
  },

  // Standard configuration for normal monitoring
  standard: {
    timeWindowMinutes: 10,
    clarificationThreshold: 3,
    emergencyBreakThreshold: 1,
    disagreementThreshold: 50,
    maxCacheSize: 100,
    enableDetailedLogging: false,
  },

  // Relaxed configuration for less frequent analysis
  relaxed: {
    timeWindowMinutes: 30,
    clarificationThreshold: 5,
    emergencyBreakThreshold: 2,
    disagreementThreshold: 75,
    maxCacheSize: 200,
    enableDetailedLogging: false,
  },
};

/**
 * ERROR HANDLING EXAMPLES
 */
const robustAnalysisWrapper = async (
  workspaceId: string,
  retries: number = 3
): Promise<AnalysisResult | null> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await communicationAnalyticsService.analyzeRecentEvents(
        database,
        workspaceId
      );
      return result;
    } catch (error) {
      console.error(`Analysis attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        console.error('All analysis attempts failed, returning null');
        return null;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  
  return null;
};

/**
 * USAGE EXAMPLES FOR REACT NATIVE COMPONENTS
 */
export const reactNativeIntegrationExamples = {
  // Example hook for React components
  useCommunicationStrain: `
    const useCommunicationStrain = (workspaceId: string) => {
      const [strainData, setStrainData] = useState<AnalysisResult | null>(null);
      const [isLoading, setIsLoading] = useState(false);
      
      useEffect(() => {
        const analyze = async () => {
          setIsLoading(true);
          try {
            const result = await communicationAnalyticsService.analyzeRecentEvents(
              database,
              workspaceId
            );
            setStrainData(result);
          } catch (error) {
            console.error('Strain analysis failed:', error);
          } finally {
            setIsLoading(false);
          }
        };
        
        analyze();
        const interval = setInterval(analyze, 5 * 60 * 1000); // Every 5 minutes
        return () => clearInterval(interval);
      }, [workspaceId]);
      
      return { strainData, isLoading };
    };
  `,

  // Example component integration
  componentIntegration: `
    const CommunicationDashboard = ({ workspaceId }) => {
      const { strainData, isLoading } = useCommunicationStrain(workspaceId);
      
      const getStrainColor = (level: StrainLevel) => {
        switch (level) {
          case 'critical': return '#FF4444';
          case 'tense': return '#FF8800';
          case 'mild': return '#FFAA00';
          default: return '#44AA44';
        }
      };
      
      if (isLoading) return <Text>Analyzing...</Text>;
      if (!strainData) return null;
      
      return (
        <View>
          <Text>Communication Health: {strainData.strainLevel}</Text>
          <Text>Confidence: {strainData.confidence}%</Text>
          {strainData.factors.map((factor, index) => (
            <Text key={index}>• {factor}</Text>
          ))}
        </View>
      );
    };
  `,
};

// Export for use in other files
export {
  analyzeWorkspaceCommunication,
  getCommunicationInsights,
  CommunicationHealthMonitor,
  analyticsConfigurations,
  robustAnalysisWrapper,
  communicationAnalyticsService,
};
