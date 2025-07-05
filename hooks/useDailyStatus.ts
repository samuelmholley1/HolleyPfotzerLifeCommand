// HolleyPfotzerLifeCommand/hooks/useDailyStatus.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../lib/logging';
import { DailyStatus } from '../types/dailyStatus';
import { BriefingMember } from '../types/workspace';
import { DB_TABLES } from '../lib/constants';
import { getTodayDateString } from '../lib/dateUtils';

export const useDailyStatus = (workspaceId: string | null) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<BriefingMember[]>([]);

  const fetchDailyBriefing = useCallback(async () => {
    if (!workspaceId || !user) {
      // This can happen on initial load, it's not an error.
      // The effect will re-run when workspaceId is available.
      return;
    }

    setLoading(true);
    setError(null);
    const timer = logger.startTimer('useDailyStatus:fetchDailyBriefing');

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Daily briefing timeout')), 10000);
      });

      const rpcPromise = supabase.rpc(
        'get_daily_briefing_members',
        { p_workspace_id: workspaceId }
      );

      const { data, error: rpcError } = await Promise.race([rpcPromise, timeoutPromise]) as any;

      if (rpcError) {
        throw rpcError;
      }

      const briefingMembers: BriefingMember[] = data.map((item: any) => ({
        user_id: item.user_id,
        full_name: item.full_name,
        avatar_url: item.avatar_url,
        status: item.status_id ? { // If status_id exists, populate the status object
          energy_level: item.energy_level,
          main_focus: item.main_focus,
          heads_up: item.heads_up,
          updated_at: item.updated_at,
        } : null, // Otherwise, set status to null
      }));

      setMembers(briefingMembers);
    } catch (err) {
      const error = err as Error;
      logger.error('DAILY_BRIEFING', 'Error fetching daily briefing data', { error: error.message }, error);
      setError(error.message);
    } finally {
      timer();
      setLoading(false);
    }
  }, [workspaceId, user?.id]);

  const upsertDailyStatus = async (status: Omit<DailyStatus, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user || !workspaceId) {
      setError("User or workspace not available.");
      return;
    }

    setLoading(true);
    try {
      const today = getTodayDateString();
      const { error } = await supabase
        .from(DB_TABLES.DAILY_STATUS)
        .upsert({
          // Provide the unique columns to identify the row for update
          user_id: user.id,
          workspace_id: workspaceId,
          date: today,
          // Provide the data to insert or update
          energy_level: status.energy_level,
          main_focus: status.main_focus,
          heads_up: status.heads_up,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,workspace_id,date'
        });

      if (error) throw error;

      // Refresh the data after the update
      await fetchDailyBriefing();
    } catch (e: any) {
      logger.error('DAILY_STATUS', "Error saving daily status:", { error: e.message }, e);
      setError("Failed to save daily status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyBriefing();
  }, [fetchDailyBriefing]);


  const currentUserStatus = members.find(m => m.user_id === user?.id);

  return { members, currentUserStatus, loading, error, upsertDailyStatus };
};
