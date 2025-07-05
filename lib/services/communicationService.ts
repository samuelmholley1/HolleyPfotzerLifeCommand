// Communication Circuit Breaker Service
import { supabase } from '../supabase';
import { logger } from '../logging';
import { CommunicationEvent, CommunicationMode, CapacityStatus, DebugLoop, CommunicationStateTransition, StateChange, EmergencyState } from '../../types/communication';

export class CommunicationService {
  
  static async recordCommunicationEvent(event: Omit<CommunicationEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CommunicationEvent | null> {
    try {
      const { data, error } = await supabase
        .from('communication_events')
        .insert([{
          ...event,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('COMMUNICATION', 'Failed to record communication event', { error });
      return null;
    }
  }

  static async updateCommunicationMode(
    workspaceId: string,
    mode: CommunicationMode['current_mode'],
    options: {
      timeoutEnd?: Date;
      incrementBreakCount?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      const updateData: any = {
        current_mode: mode,
        updated_at: new Date().toISOString(),
      };

      if (options.timeoutEnd) {
        updateData.timeout_end = options.timeoutEnd.toISOString();
      }

      if (options.incrementBreakCount) {
        // Get current count and increment
        const { data: currentMode } = await supabase
          .from('communication_modes')
          .select('break_count_today')
          .eq('workspace_id', workspaceId)
          .single();
        
        updateData.break_count_today = (currentMode?.break_count_today || 0) + 1;
      }

      if (mode === 'emergency_break') {
        updateData.last_break_timestamp = new Date().toISOString();
      }

      const { error } = await supabase
        .from('communication_modes')
        .upsert([{
          workspace_id: workspaceId,
          ...updateData,
        }], {
          onConflict: 'workspace_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('COMMUNICATION', 'Failed to update communication mode', { error });
      return false;
    }
  }

  static async getCurrentCommunicationMode(workspaceId: string): Promise<CommunicationMode | null> {
    try {
      const { data, error } = await supabase
        .from('communication_modes')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      logger.error('COMMUNICATION', 'Failed to get communication mode', { error });
      return null;
    }
  }

  static async updateCapacityStatus(capacityStatus: Omit<CapacityStatus, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('capacity_status')
        .upsert([{
          ...capacityStatus,
          updated_at: new Date().toISOString(),
        }], {
          onConflict: 'user_id,workspace_id,date'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('COMMUNICATION', 'Failed to update capacity status', { error });
      return false;
    }
  }

  static async detectDebuggingLoop(
    workspaceId: string,
    participants: string[],
    triggerEvent: string,
    indicators: string[]
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('debug_loops')
        .insert([{
          workspace_id: workspaceId,
          participants,
          trigger_event: triggerEvent,
          loop_indicators: indicators,
          duration_minutes: 0, // Will be updated when resolved
          created_at: new Date().toISOString(),
        }])
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      logger.error('COMMUNICATION', 'Failed to record debugging loop', { error });
      return null;
    }
  }

  static async resolveDebuggingLoop(
    loopId: string,
    resolutionMethod: DebugLoop['resolution_method'],
    effectivenessRating?: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('debug_loops')
        .update({
          resolution_method: resolutionMethod,
          effectiveness_rating: effectivenessRating,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', loopId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('COMMUNICATION', 'Failed to resolve debugging loop', { error });
      return false;
    }
  }

  static async getWorkspaceAnalytics(workspaceId: string, days: number = 7): Promise<{
    totalBreaks: number;
    averageBreaksPerDay: number;
    mostEffectiveResolution: string;
    circuitSuccessRate: number;
  } | null> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      // Get communication events
      const { data: events, error: eventsError } = await supabase
        .from('communication_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', since.toISOString());

      if (eventsError) throw eventsError;

      // Get resolved debug loops
      const { data: loops, error: loopsError } = await supabase
        .from('debug_loops')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', since.toISOString())
        .not('resolved_at', 'is', null);

      if (loopsError) throw loopsError;

      const breaks = events?.filter(e => e.event_type === 'emergency_break') || [];
      const resolutionMethods = loops?.map(l => l.resolution_method).filter(Boolean) || [];
      
      // Calculate most effective resolution
      const resolutionCounts = resolutionMethods.reduce((acc, method) => {
        acc[method!] = (acc[method!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostEffective = Object.entries(resolutionCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'none';

      return {
        totalBreaks: breaks.length,
        averageBreaksPerDay: breaks.length / days,
        mostEffectiveResolution: mostEffective,
        circuitSuccessRate: loops?.length ? 
          (loops.filter(l => l.effectiveness_rating && l.effectiveness_rating >= 3).length / loops.length) * 100 : 0,
      };
    } catch (error) {
      logger.error('COMMUNICATION', 'Failed to get workspace analytics', { error });
      return null;
    }
  }

  // 🚀 STATE MACHINE METHODS (Phase 1)
  
  /**
   * 🔴 RED TEAM CHECKPOINT: Update state with validation and audit trail
   * SECURITY: Validates workspace access before state changes
   * FUNCTIONALITY: Ensures valid state transitions
   * UX: Provides immediate feedback for crisis situations
   */
  static async updateCommunicationState(
    workspaceId: string, 
    stateChange: StateChange,
    userId?: string
  ): Promise<{ success: boolean; newState?: CommunicationMode }> {
    try {
      // 🔒 SECURITY CHECKPOINT: Validate workspace access
      const hasAccess = await this.validateWorkspaceAccess(workspaceId, userId);
      if (!hasAccess) {
        throw new Error('Unauthorized workspace access');
      }

      // Get current state for transition audit
      const currentMode = await this.getCurrentCommunicationMode(workspaceId);
      const fromState = currentMode?.state_display || 'calm';

      // 🎨 UX CHECKPOINT: Ensure state/color consistency for crisis clarity
      const stateColor = this.getConsistentStateColor(stateChange.state_display, stateChange.state_color);

      // ⚙️ FUNCTIONALITY CHECKPOINT: Validate state transition
      if (!this.isValidStateTransition(fromState, stateChange.state_display)) {
        throw new Error(`Invalid state transition: ${fromState} → ${stateChange.state_display}`);
      }

      // Update communication mode with state machine fields
      const updateData: any = {
        state_display: stateChange.state_display,
        state_color: stateColor,
        updated_at: new Date().toISOString(),
      };

      if (stateChange.active_topic !== undefined) {
        updateData.active_topic = stateChange.active_topic;
      }

      // 🚨 CRISIS USABILITY: Emergency pause gets immediate priority
      if (stateChange.state_display === 'paused') {
        updateData.current_mode = 'emergency_break';
        updateData.last_break_timestamp = new Date().toISOString();
        updateData.break_count_today = (currentMode?.break_count_today || 0) + 1;
      }

      const { data, error } = await supabase
        .from('communication_modes')
        .upsert([{
          workspace_id: workspaceId,
          ...updateData,
        }], {
          onConflict: 'workspace_id'
        })
        .select()
        .single();

      if (error) throw error;

      // 📊 AUDIT TRAIL: Record state transition for analytics
      await this.recordStateTransition({
        workspace_id: workspaceId,
        from_state: fromState,
        to_state: stateChange.state_display,
        trigger_type: stateChange.trigger_type,
        trigger_user_id: userId,
        topic_context: stateChange.active_topic,
        confidence_score: stateChange.confidence_score,
      });

      return { success: true, newState: data };
    } catch (error) {
      logger.error('COMMUNICATION_STATE', 'Failed to update communication state', { 
        error, workspaceId, stateChange 
      });
      return { success: false };
    }
  }

  /**
   * 🚨 EMERGENCY PAUSE: Simplified interface for crisis moments
   * UX PRIORITY: Minimal cognitive load, maximum reliability
   */
  static async triggerEmergencyPause(
    workspaceId: string,
    topic?: string,
    userId?: string,
    durationMinutes: number = 20
  ): Promise<{ success: boolean; timeoutEnd?: Date }> {
    try {
      const timeoutEnd = new Date(Date.now() + durationMinutes * 60 * 1000);
      
      const result = await this.updateCommunicationState(workspaceId, {
        state_display: 'paused',
        state_color: 'red',
        active_topic: topic,
        trigger_type: 'manual'
      }, userId);

      if (result.success) {
        // Set timeout for automatic recovery
        await this.updateCommunicationMode(workspaceId, 'emergency_break', {
          timeoutEnd
        });
        
        return { success: true, timeoutEnd };
      }
      
      return { success: false };
    } catch (error) {
      logger.error('EMERGENCY_PAUSE', 'Failed to trigger emergency pause', { error });
      return { success: false };
    }
  }

  /**
   * Get simple state for crisis UI components
   */
  static async getEmergencyState(workspaceId: string): Promise<EmergencyState> {
    try {
      const mode = await this.getCurrentCommunicationMode(workspaceId);
      
      return {
        isEmergency: mode?.state_display === 'paused',
        canPause: mode?.state_display !== 'paused',
        currentTopic: mode?.active_topic,
        timeRemaining: mode?.timeout_end ? 
          Math.max(0, new Date(mode.timeout_end).getTime() - Date.now()) / 1000 / 60 : undefined
      };
    } catch (error) {
      logger.error('EMERGENCY_STATE', 'Failed to get emergency state', { error });
      return { isEmergency: false, canPause: false };
    }
  }

  // 🔒 SECURITY HELPER METHODS
  
  private static async validateWorkspaceAccess(workspaceId: string, userId?: string): Promise<boolean> {
    if (!userId) return false;
    
    try {
      const { data } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single();
        
      return !!data;
    } catch {
      return false;
    }
  }

  // 🎨 UX HELPER METHODS
  
  private static getConsistentStateColor(
    state: 'calm' | 'tense' | 'paused', 
    requestedColor?: 'green' | 'yellow' | 'red'
  ): 'green' | 'yellow' | 'red' {
    // Enforce color consistency for crisis clarity
    const stateColorMap = {
      calm: 'green' as const,
      tense: 'yellow' as const,
      paused: 'red' as const,
    };
    
    return stateColorMap[state];
  }

  // ⚙️ FUNCTIONALITY HELPER METHODS
  
  private static isValidStateTransition(from: string, to: string): boolean {
    const validTransitions = {
      calm: ['tense', 'paused'],
      tense: ['calm', 'paused'],
      paused: ['calm', 'tense']
    };
    
    return validTransitions[from as keyof typeof validTransitions]?.includes(to) || from === to;
  }

  // 📊 AUDIT TRAIL METHODS
  
  private static async recordStateTransition(
    transition: Omit<CommunicationStateTransition, 'id' | 'created_at'>
  ): Promise<void> {
    try {
      await supabase
        .from('communication_state_transitions')
        .insert([{
          ...transition,
          created_at: new Date().toISOString(),
        }]);
    } catch (error) {
      logger.error('STATE_AUDIT', 'Failed to record state transition', { error });
    }
  }

  // 🚨 CRITICAL FIX: Offline Emergency State Queue
  private static emergencyQueue: Array<{
    workspaceId: string;
    action: 'pause' | 'resume';
    topic?: string;
    timestamp: number;
    userId?: string;
  }> = [];

  /**
   * 🔴 EMERGENCY RELIABILITY FIX: Queue emergency actions for offline sync
   */
  static async triggerEmergencyPauseReliable(
    workspaceId: string,
    topic?: string,
    userId?: string,
    durationMinutes: number = 20
  ): Promise<{ success: boolean; timeoutEnd?: Date; queued?: boolean }> {
    try {
      // Try immediate update first
      const result = await this.triggerEmergencyPause(workspaceId, topic, userId, durationMinutes);
      
      if (result.success) {
        return result;
      }
      
      // If failed, queue for offline sync
      this.emergencyQueue.push({
        workspaceId,
        action: 'pause',
        topic,
        timestamp: Date.now(),
        userId
      });
      
      // Store in local storage for persistence across app restarts
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('communication_emergency_queue', JSON.stringify(this.emergencyQueue));
      }
      
      return { 
        success: true, 
        queued: true,
        timeoutEnd: new Date(Date.now() + durationMinutes * 60 * 1000)
      };
    } catch (error) {
      logger.error('EMERGENCY_RELIABLE', 'Failed emergency pause', { error });
      
      // Even if everything fails, queue the action
      this.emergencyQueue.push({
        workspaceId,
        action: 'pause',
        topic,
        timestamp: Date.now(),
        userId
      });
      
      return { success: true, queued: true };
    }
  }

  /**
   * Process queued emergency actions when connectivity returns
   */
  static async processEmergencyQueue(): Promise<void> {
    if (this.emergencyQueue.length === 0) return;
    
    try {
      const queueCopy = [...this.emergencyQueue];
      this.emergencyQueue = [];
      
      for (const item of queueCopy) {
        if (item.action === 'pause') {
          await this.triggerEmergencyPause(item.workspaceId, item.topic, item.userId);
        }
        // Add other actions as needed
      }
      
      // Clear persisted queue
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('communication_emergency_queue');
      }
      
      logger.info('EMERGENCY_QUEUE', 'Processed offline emergency actions', { 
        count: queueCopy.length 
      });
    } catch (error) {
      logger.error('EMERGENCY_QUEUE', 'Failed to process emergency queue', { error });
    }
  }

  /**
   * Initialize emergency queue from persistence
   */
  static initializeEmergencyQueue(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('communication_emergency_queue');
        if (stored) {
          this.emergencyQueue = JSON.parse(stored);
        }
      }
    } catch (error) {
      logger.error('EMERGENCY_INIT', 'Failed to initialize emergency queue', { error });
    }
  }

  /**
   * 🔴 CRITICAL FIX: Real-time partner notification
   */
  static async notifyPartnerOfStateChange(
    workspaceId: string,
    newState: CommunicationMode,
    userId?: string
  ): Promise<void> {
    try {
      // Get partner user ID
      const { data: members } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)
        .neq('user_id', userId || '');
      
      if (!members || members.length === 0) return;
      
      // Send real-time notification via Supabase channel
      const channel = supabase.channel(`workspace_${workspaceId}`);
      await channel.send({
        type: 'broadcast',
        event: 'communication_state_change',
        payload: {
          workspace_id: workspaceId,
          new_state: newState.state_display,
          state_color: newState.state_color,
          active_topic: newState.active_topic,
          changed_by: userId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('PARTNER_NOTIFY', 'Failed to notify partner of state change', { error });
    }
  }

  /**
   * 🔴 CRITICAL FIX: Automatic state recovery after timeout
   */
  static async scheduleStateRecovery(workspaceId: string, timeoutEnd: Date): Promise<void> {
    const timeoutMs = timeoutEnd.getTime() - Date.now();
    
    if (timeoutMs <= 0) {
      // Timeout already passed, recover immediately
      await this.recoverFromPausedState(workspaceId);
      return;
    }
    
    // Schedule recovery
    setTimeout(async () => {
      await this.recoverFromPausedState(workspaceId);
    }, timeoutMs);
  }

  private static async recoverFromPausedState(workspaceId: string): Promise<void> {
    try {
      const currentMode = await this.getCurrentCommunicationMode(workspaceId);
      
      if (currentMode?.state_display === 'paused') {
        await this.updateCommunicationState(workspaceId, {
          state_display: 'calm',
          state_color: 'green',
          active_topic: undefined,
          trigger_type: 'timeout'
        });
        
        logger.info('STATE_RECOVERY', 'Automatically recovered from paused state', { workspaceId });
      }
    } catch (error) {
      logger.error('STATE_RECOVERY', 'Failed to recover from paused state', { error, workspaceId });
    }
  }

  /**
   * Update shared communication state from analytics service
   * This function bridges the analytics service with the communication state machine
   * Note: Updates the 'communication_modes' table, not 'communication_states'
   */
  static async updateSharedCommunicationState(
    database: any, // WatermelonDB instance
    { workspaceId, newState }: { workspaceId: string; newState: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate input parameters
      if (!workspaceId || typeof workspaceId !== 'string') {
        throw new Error('Valid workspaceId is required');
      }

      if (!newState || typeof newState !== 'string') {
        throw new Error('Valid newState is required');
      }

      // Map analytics strain levels to communication state machine states
      const stateMapping: Record<string, 'calm' | 'tense' | 'paused'> = {
        'calm': 'calm',
        'mild': 'calm', // Mild strain is still considered calm
        'tense': 'tense',
        'critical': 'paused' // Critical strain triggers pause
      };

      const mappedState = stateMapping[newState] || 'calm';

      logger.info('COMMUNICATION', 'Updating shared communication state from analytics', {
        workspaceId,
        originalState: newState,
        mappedState,
        timestamp: new Date().toISOString()
      });

      // Use the existing state machine update logic
      const result = await this.updateCommunicationState(workspaceId, {
        state_display: mappedState,
        trigger_type: 'auto_pattern',
        active_topic: mappedState === 'paused' ? 'High communication strain detected' : undefined,
        confidence_score: 0.8 // Analytics-driven updates have high confidence
      }, undefined); // No specific user ID for auto-updates

      if (result.success) {
        logger.info('COMMUNICATION', 'Successfully updated communication state from analytics', {
          workspaceId,
          newState: mappedState,
          timestamp: new Date().toISOString()
        });

        // Record a generalized communication event for tracking
        // Note: Using existing event type since we can't add new types without schema changes
        await this.recordCommunicationEvent({
          workspace_id: workspaceId,
          event_type: 'assumption_clarification', // Repurpose existing type for analytics
          user_id: 'system', // System-generated event identifier
          content: {
            contextual_info: `Analytics detected ${newState} strain level, mapped to ${mappedState} state`,
            emotional_state: newState === 'critical' ? 'stressed' : 'calm',
            original_statement: `Communication strain analysis: ${newState}`
          },
          resolved: true // Auto-resolved system events
        });

        return { success: true };
      } else {
        throw new Error('Failed to update communication state');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('COMMUNICATION', 'Failed to update shared communication state', {
        error: errorMessage,
        workspaceId,
        newState,
        stack: error instanceof Error ? error.stack : undefined
      });

      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }
}
