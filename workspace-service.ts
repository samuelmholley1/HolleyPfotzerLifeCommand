// ===========================================
// UPDATED WORKSPACE SERVICE WITH DIRECT DB FUNCTION CALL
// ===========================================
// This improved version directly calls the database function
// that handles workspace creation with RLS

import { supabase } from './lib/supabase'

// Enhanced workspace creation service
export class WorkspaceService {
  /**
   * Creates a new workspace for the current user using direct database function call
   * This bypasses RLS issues by using the database function that handles permissions
   */
  async createWorkspace(name: string, description?: string): Promise<{ data: any; error: any }> {
    try {
      console.log('Creating workspace with RLS-safe approach:', { name, description });

      // Use the secure database function without parameters
      // The database function internally uses auth.uid() to create the workspace
      const { data, error } = await supabase.rpc('create_user_workspace');

      if (error) {
        console.error('Database function error:', error);
        throw error;
      }

      // If we get here, the function succeeded and returned the workspace id
      const workspaceId = data;
      
      // Now we can update the workspace details if needed
      if (name && name !== 'My Workspace') {
        const { error: updateError } = await supabase
          .from('workspaces')
          .update({ 
            name: name, 
            description: description || `${name} workspace`
          })
          .eq('id', workspaceId);
          
        if (updateError) {
          console.warn('Warning: Created workspace but failed to update name/description:', updateError);
        }
      }

      console.log('Workspace created successfully:', workspaceId);
      return { data: workspaceId, error: null };

    } catch (error) {
      console.error('Error creating workspace:', error);
      return { data: null, error };
    }
  }

  /**
   * Gets or creates a default workspace for the current user
   * This is the main function to use for ensuring users have a workspace
   */
  async getOrCreateDefaultWorkspace(): Promise<{ data: any; error: any }> {
    try {
      // First, try to get the user's current workspace from their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          active_workspace:workspaces!active_workspace_id(*)
        `)
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching profile:', profileError);
        return { data: null, error: profileError };
      }

      // If user has an active workspace, return it
      if (profile?.active_workspace) {
        console.log('User has existing workspace:', profile.active_workspace);
        return { data: profile.active_workspace, error: null };
      }

      // Try to find any workspace the user belongs to
      const { data: userWorkspaces, error: workspacesError } = await supabase
        .from('workspace_members')
        .select(`
          workspace:workspaces(*)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .limit(1);

      if (workspacesError) {
        console.error('Error fetching user workspaces:', workspacesError);
      }

      // If user belongs to any workspace, use the first one
      if (userWorkspaces && userWorkspaces.length > 0) {
        const workspace = userWorkspaces[0].workspace;
        console.log('Found existing workspace membership:', workspace);
        
        // Update their profile to set this as active workspace
        await supabase
          .from('profiles')
          .update({ active_workspace_id: workspace.id })
          .eq('id', (await supabase.auth.getUser()).data.user?.id);

        return { data: workspace, error: null };
      }

      // No workspace found, create a new default one
      console.log('No workspace found, creating default workspace');
      
      // Use the improved createWorkspace method
      const result = await this.createWorkspace(
        'Personal Workspace',
        'Your default personal workspace for productivity tracking'
      );

      if (result.error) {
        console.error('Failed to create default workspace:', result.error);
        return result;
      }

      // Fetch the created workspace details
      const { data: newWorkspace, error: fetchError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', result.data)
        .single();

      if (fetchError) {
        console.error('Error fetching created workspace:', fetchError);
        return { data: null, error: fetchError };
      }

      console.log('Default workspace created successfully:', newWorkspace);
      return { data: newWorkspace, error: null };

    } catch (error) {
      console.error('Error in getOrCreateDefaultWorkspace:', error);
      return { data: null, error };
    }
  }

  /**
   * Ensures the current user has access to a workspace
   * Call this on app initialization or when workspace access is needed
   */
  async ensureUserHasWorkspace(): Promise<boolean> {
    try {
      const result = await this.getOrCreateDefaultWorkspace();
      
      if (result.error) {
        console.error('Failed to ensure user has workspace:', result.error);
        return false;
      }

      console.log('User workspace ensured:', result.data);
      return true;
    } catch (error) {
      console.error('Error ensuring user has workspace:', error);
      return false;
    }
  }

  /**
   * Gets all workspaces the user has access to
   */
  async getUserWorkspaces(): Promise<{ data: any[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          workspace:workspaces(*),
          user:profiles!user_id(*)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        console.error('Error fetching user workspaces:', error);
        return { data: [], error };
      }

      // Transform the result to return just the workspaces
      const workspaces = data.map((item: any) => ({
        ...item.workspace,
        role: item.role
      }));

      return { data: workspaces, error: null };
    } catch (error) {
      console.error('Error in getUserWorkspaces:', error);
      return { data: [], error };
    }
  }

  /**
   * Set the user's active workspace
   */
  async setActiveWorkspace(workspaceId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active_workspace_id: workspaceId })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        console.error('Error setting active workspace:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in setActiveWorkspace:', error);
      return { success: false, error };
    }
  }
}
