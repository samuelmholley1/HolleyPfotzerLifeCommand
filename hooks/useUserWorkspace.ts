// HolleyPfotzerLifeCommand/hooks/useUserWorkspace.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DB_TABLES } from '../lib/constants';

export const useUserWorkspace = () => {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const getUserWorkspace = async () => {
      setError(null);
      
      if (!user?.id) {
        if (isMounted) {
          setLoading(false);
          setWorkspaceId(null);
        }
        return;
      }

      // Prioritize the active workspace from the user's profile
      if (user.active_workspace_id) {
        if (isMounted) {
          setWorkspaceId(user.active_workspace_id);
          setLoading(false);
        }
        return; // We have what we need
      }

      // Fallback: if no active workspace is set, find the first one they belong to.
      // This is for backward compatibility or for new users.
      if (isMounted) setLoading(true);

      try {
        console.warn('No active_workspace_id found in user profile. Falling back to first workspace found.');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Workspace lookup timeout')), 10000);
        });
        
        const workspacePromise = supabase
          .from(DB_TABLES.WORKSPACE_MEMBERS)
          .select('workspace_id')
          .eq('user_id', user.id)
          .limit(1);

        const { data, error } = await Promise.race([workspacePromise, timeoutPromise]) as any;

        if (error) {
          throw error;
        }

        if (isMounted) {
          if (data && data.length > 0) {
            setWorkspaceId(data[0].workspace_id);
          } else {
            console.warn('No workspaces found for user');
            setWorkspaceId(null);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching user workspace:', error);
          setError(error instanceof Error ? error.message : 'Failed to load workspace');
          setWorkspaceId(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getUserWorkspace();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return { workspaceId, loading, error };
};
