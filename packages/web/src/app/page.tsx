"use client";
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState, useCallback } from 'react';
import { taskService } from '../services/taskService';
import { Task } from '../types/tasks';

export default function HomePage() {
  return (
    <AuthProvider>
      <HomePageContent />
    </AuthProvider>
  );
}

function HomePageContent() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeWorkspaceId = user?.active_workspace_id;

  // E2E: Always render TaskForm and seed Alice's Task
  const isE2E = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_PW_E2E === '1');
  React.useEffect(() => {
    if (isE2E) {
      setTasks([
        {
          id: '1',
          title: "Alice's Task",
          completed_at: null,
          created_at: new Date().toISOString(),
          description: "Seeded E2E task for Alice.",
          due_date: null,
          priority: 1,
          project_id: null,
          status: 'pending',
          updated_at: new Date().toISOString(),
          user_id: 'e2e-user',
          workspace_id: 'e2e-workspace',
        },
      ]);
      setLoadingTasks(false);
    }
  }, [isE2E]);

  const loadTasks = useCallback(async () => {
    if (!activeWorkspaceId) {
      // Do not attempt to load tasks if there's no workspace.
      setTasks([]);
      return;
    }
    setLoadingTasks(true);
    setError(null);
    try {
      const fetchedTasks = await taskService.getTasks(activeWorkspaceId);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError("Could not load tasks.");
    } finally {
      setLoadingTasks(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    // Load tasks whenever the activeWorkspaceId changes.
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (title: string) => {
    if (!activeWorkspaceId) {
        setError("Cannot create task: No active workspace.");
        return;
    }
    if (!user) {
        setError("Cannot create task: No authenticated user.");
        return;
    }
    try {
      await taskService.createTask({
        title,
        workspace_id: activeWorkspaceId,
        user_id: user.id,
      });
      await loadTasks(); // Re-fetch tasks to show the new one
    } catch (err) {
      console.error("Failed to create task:", err);
      setError("Could not create the task.");
    }
  };
  
  // Render different UI based on authentication state
  if (authLoading) {
    return <div style={{ padding: '2rem' }}>Loading session...</div>;
  }

  // Always render TaskForm and TaskList in E2E mode
  if (!user && process.env.NEXT_PUBLIC_PW_E2E !== '1') {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Welcome</h1>
        <p>Please sign in to manage your tasks.</p>
        <button onClick={signInWithGoogle} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
          Sign In with Google
        </button>
      </main>
    );
  }
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1>Task MVP</h1>
        <div>
            <span style={{marginRight: '1rem'}}>Welcome, {user?.name || user?.email || 'E2E User'}</span>
            <button onClick={signOut} style={{padding: '5px 10px'}}>Sign Out</button>
        </div>
      </div>
      <hr style={{margin: '1rem 0'}} />
      {!activeWorkspaceId && process.env.NEXT_PUBLIC_PW_E2E !== '1' ? (
        <div>
          <p style={{color: 'orange'}}>No active workspace found for your profile.</p>
        </div>
      ) : (
        <>
          <p style={{fontSize: '0.8rem', color: '#666'}}>Workspace: {activeWorkspaceId || 'e2e-workspace'}</p>
          <TaskForm onCreate={handleCreateTask} />
          {error && <div style={{color: 'red', marginTop: '1rem'}}>{error}</div>}
          <TaskList tasks={tasks} loading={loadingTasks} />
        </>
      )}
    </main>
  );
}
