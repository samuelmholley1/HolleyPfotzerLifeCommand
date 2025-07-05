// services/workspaceService.ts

import { supabase } from '../lib/supabase';
import { logger } from '../lib/logging';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export class WorkspaceService {
  
  /**
   * Ensure user has a workspace assigned
   * Creates a default workspace if none exists
   */
  static async ensureUserHasWorkspace(userId: string): Promise<string | null> {
    const timer = logger.startTimer('WorkspaceService:ensureUserHasWorkspace');
    
    try {
      // First, check if user already has workspace memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)
        .limit(1);

      if (membershipError) {
        throw membershipError;
      }

      if (memberships && memberships.length > 0) {
        const workspaceId = memberships[0].workspace_id;
        
        // Update user profile with this workspace as active
        await this.updateUserActiveWorkspace(userId, workspaceId);
        
        logger.info('WORKSPACE', `User already has workspace: ${workspaceId}`);
        timer();
        return workspaceId;
      }

      // User has no workspace, let's find or create a default one
      let defaultWorkspaceId = await this.findOrCreateDefaultWorkspace();
      
      // Add user to the workspace
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          user_id: userId,
          workspace_id: defaultWorkspaceId,
        });

      if (memberError) {
        throw memberError;
      }

      // Update user profile
      await this.updateUserActiveWorkspace(userId, defaultWorkspaceId);

      logger.info('WORKSPACE', `Assigned user to default workspace: ${defaultWorkspaceId}`);
      timer();
      return defaultWorkspaceId;
      
    } catch (error) {
      timer();
      logger.error('WORKSPACE', 'Failed to ensure user has workspace', { error: (error as Error).message }, error as Error);
      return null;
    }
  }

  /**
   * Find or create a default workspace
   */
  private static async findOrCreateDefaultWorkspace(): Promise<string> {
    const workspaceName = 'Personal Workspace';
    
    // Try to find existing default workspace
    const { data: existingWorkspaces, error: findError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('name', workspaceName)
      .limit(1);

    if (findError) {
      throw findError;
    }

    if (existingWorkspaces && existingWorkspaces.length > 0) {
      return existingWorkspaces[0].id;
    }

    // Create new default workspace
    const { data: newWorkspace, error: createError } = await supabase
      .from('workspaces')
      .insert({
        name: workspaceName,
        description: 'Default personal workspace for productivity tracking',
      })
      .select('id')
      .single();

    if (createError) {
      throw createError;
    }

    if (!newWorkspace) {
      throw new Error('Failed to create default workspace');
    }

    logger.info('WORKSPACE', `Created new default workspace: ${newWorkspace.id}`);
    return newWorkspace.id;
  }

  /**
   * Update user's active workspace in their profile
   */
  private static async updateUserActiveWorkspace(userId: string, workspaceId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        active_workspace_id: workspaceId,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }

    logger.info('WORKSPACE', `Updated user profile with active workspace: ${workspaceId}`);
  }
}
