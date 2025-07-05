import { supabase } from '../lib/supabase';
import { log } from '../lib/logging';

export type CommunicationModeType = 'normal' | 'careful' | 'emergency_break' | 'mediated';
export type EventType = 'assumption_clarification' | 'emergency_break' | 'timeout_request' | 'mediated_discussion';
export type CapacityLevel = 'high' | 'medium' | 'low' | 'overloaded';
export type CommunicationPreference = 'direct' | 'gentle' | 'minimal';
export type TriggerSensitivity = 'low' | 'medium' | 'high';

export interface CommunicationEvent {
  id: string;
  workspace_id: string;
  user_id: string;
  event_type: EventType;
  content: any;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunicationMode {
  workspace_id: string;
  current_mode: CommunicationModeType;
  timeout_end?: string;
  last_break_timestamp?: string;
  break_count_today: number;
  partner_acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

export interface CapacityStatus {
  id: string;
  user_id: string;
  workspace_id: string;
  cognitive_capacity: CapacityLevel;
  communication_preference: CommunicationPreference;
  trigger_sensitivity: TriggerSensitivity;
  last_debugging_circuit?: string;
  circuit_breaks_today: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface DebugLoop {
  id: string;
  workspace_id: string;
  participants: string[];
  trigger_event: string;
  loop_indicators: string[];
  duration_minutes: number;
  resolution_method?: string;
  effectiveness_rating?: number;
  created_at: string;
  resolved_at?: string;
}

export class CommunicationStateManager {
  
  // Emergency Break Functions
  async activateEmergencyBreak(workspaceId: string, userId: string, context?: any): Promise<void> {
    log.info('communicationStateManager', `Activating emergency break for workspace: ${workspaceId}`);
    try {
      // Default duration is 30 minutes, can be customized based on context
      const durationMinutes = context?.durationMinutes || 30;
      const pauseUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

      // 1. Create emergency break event
      const { error: eventError } = await supabase
        .from('communication_events')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          event_type: 'emergency_break',
          content: {
            context: context || 'Manual emergency break activation',
            timestamp: new Date().toISOString()
          }
        });

      if (eventError) {
        console.error('DIAGNOSTIC: Failed to create emergency break event:', eventError);
        throw new Error(`Failed to log emergency break event: ${eventError.message}`);
      }

      // 2. Update communication mode to emergency_break with detailed payload
      const updatePayload = {
        current_mode: 'emergency_break',
        is_break_active: true,
        break_activated_at: new Date().toISOString(),
        break_ends_at: pauseUntil.toISOString(),
        break_acknowledged_by: [],
        last_break_timestamp: new Date().toISOString(),
        break_count_today: await this.incrementBreakCount(workspaceId),
        partner_acknowledged: false,
        updated_at: new Date().toISOString()
      };

      console.log('DIAGNOSTIC: Attempting to update communication_modes with payload:', updatePayload);

      const { data, error } = await supabase
        .from('communication_modes')
        .update(updatePayload)
        .eq('workspace_id', workspaceId)
        .select();

      if (error) {
        // This will now log the specific database error
        console.error('DIAGNOSTIC: Supabase update failed with error:', error);
        throw new Error(`Failed to activate emergency break mode: ${error.message}`);
      }

      console.log('DIAGNOSTIC: Supabase update successful. Response data:', data);

      // 3. Update user's capacity status
      await this.updateCapacityStatus(userId, workspaceId, {
        last_debugging_circuit: new Date().toISOString(),
        circuit_breaks_today: await this.incrementUserBreakCount(userId, workspaceId)
      });

      log.info('communicationStateManager', 'Emergency break activated successfully');
      
    } catch (error) {
      log.error('communicationStateManager', 'Failed to activate emergency break', { workspaceId, userId, error: String(error) });
      throw error;
    }
  }

  async acknowledgeBreak(workspaceId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('communication_modes')
        .update({
          partner_acknowledged: true,
          updated_at: new Date().toISOString()
        })
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error acknowledging break:', error);
        throw new Error('Failed to acknowledge break');
      }

      // Log acknowledgment event
      await supabase
        .from('communication_events')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          event_type: 'emergency_break',
          content: {
            action: 'acknowledge',
            timestamp: new Date().toISOString()
          }
        });

    } catch (error) {
      console.error('Failed to acknowledge break:', error);
      throw error;
    }
  }

  async resumeNormalMode(workspaceId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('communication_modes')
        .update({
          current_mode: 'normal',
          timeout_end: null,
          partner_acknowledged: false,
          updated_at: new Date().toISOString()
        })
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error resuming normal mode:', error);
        throw new Error('Failed to resume normal communication');
      }

      // Log resume event
      await supabase
        .from('communication_events')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          event_type: 'emergency_break',
          content: {
            action: 'resume',
            timestamp: new Date().toISOString()
          }
        });

    } catch (error) {
      console.error('Failed to resume normal mode:', error);
      throw error;
    }
  }

  // State Queries
  async getCurrentMode(workspaceId: string): Promise<CommunicationMode | null> {
    try {
      const { data, error } = await supabase
        .from('communication_modes')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching communication mode:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get current mode:', error);
      return null;
    }
  }

  async getUserCapacityStatus(userId: string, workspaceId: string): Promise<CapacityStatus | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('capacity_status')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching capacity status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get capacity status:', error);
      return null;
    }
  }

  async updateCapacityStatus(
    userId: string, 
    workspaceId: string, 
    updates: Partial<CapacityStatus>
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('capacity_status')
        .upsert({
          user_id: userId,
          workspace_id: workspaceId,
          date: today,
          updated_at: new Date().toISOString(),
          ...updates
        }, {
          onConflict: 'user_id,workspace_id,date'
        });

      if (error) {
        console.error('Error updating capacity status:', error);
        throw new Error('Failed to update capacity status');
      }
    } catch (error) {
      console.error('Failed to update capacity status:', error);
      throw error;
    }
  }

  // Helper Functions
  private async incrementBreakCount(workspaceId: string): Promise<number> {
    try {
      const current = await this.getCurrentMode(workspaceId);
      return (current?.break_count_today || 0) + 1;
    } catch (error) {
      console.error('Error incrementing break count:', error);
      return 1;
    }
  }

  private async incrementUserBreakCount(userId: string, workspaceId: string): Promise<number> {
    try {
      const current = await this.getUserCapacityStatus(userId, workspaceId);
      return (current?.circuit_breaks_today || 0) + 1;
    } catch (error) {
      console.error('Error incrementing user break count:', error);
      return 1;
    }
  }

  // Real-time Subscriptions
  subscribeToModeChanges(workspaceId: string, callback: (mode: CommunicationMode) => void) {
    return supabase
      .channel(`communication_mode_${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communication_modes',
          filter: `workspace_id=eq.${workspaceId}`
        },
        (payload) => {
          console.log('Communication mode change:', payload);
          if (payload.new) {
            callback(payload.new as CommunicationMode);
          }
        }
      )
      .subscribe();
  }

  subscribeToEvents(workspaceId: string, callback: (event: CommunicationEvent) => void) {
    return supabase
      .channel(`communication_events_${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communication_events',
          filter: `workspace_id=eq.${workspaceId}`
        },
        (payload) => {
          console.log('New communication event:', payload);
          if (payload.new) {
            callback(payload.new as CommunicationEvent);
          }
        }
      )
      .subscribe();
  }
}

// Export singleton instance
export const communicationStateManager = new CommunicationStateManager();
