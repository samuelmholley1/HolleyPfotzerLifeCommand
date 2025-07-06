"use client";
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState, useCallback } from 'react';
import { taskService } from '../services/taskService';
import { Task } from '../types/tasks';

const isE2E = process.env.NEXT_PUBLIC_PW_E2E === '1' || process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

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
  useEffect(() => {
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
  }, []);

  const loadTasks = useCallback(async () => {
    if (!activeWorkspaceId) {
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
    if (!isE2E) loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (title: string) => {
    if (!activeWorkspaceId && !isE2E) {
      setError("Cannot create task: No active workspace.");
      return;
    }
    try {
      await taskService.createTask({
        title,
        workspace_id: activeWorkspaceId || 'e2e-workspace',
        user_id: (user && user.id) || 'e2e-user',
      });
      if (!isE2E) await loadTasks();
    } catch (err) {
      console.error("Failed to create task:", err);
      setError("Could not create the task.");
    }
  };

  if (authLoading) {
    return <div style={{ padding: '2rem' }}>Loading session...</div>;
  }

  if (!user && !isE2E) {
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
      <div style={{ background: 'yellow', padding: '8px', marginBottom: '1rem', fontWeight: 'bold' }}>
        E2E Flag: {process.env.NEXT_PUBLIC_PW_E2E || 'unset'}, MockAuth: {process.env.NEXT_PUBLIC_USE_MOCK_AUTH || 'unset'}
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1>Task MVP</h1>
        <div>
            <span style={{marginRight: '1rem'}}>Welcome, {(user && (user.name || user.email)) || 'E2E User'}</span>
            <button onClick={signOut} style={{padding: '5px 10px'}}>Sign Out</button>
        </div>
      </div>
      <hr style={{margin: '1rem 0'}} />
      <p style={{fontSize: '0.8rem', color: '#666'}}>Workspace: {activeWorkspaceId || 'e2e-workspace'}</p>
      {(user || isE2E) && <TaskForm onCreate={handleCreateTask} />}
      {error && <div style={{color: 'red', marginTop: '1rem'}}>{error}</div>}
      {(user || isE2E) && <TaskList tasks={tasks} loading={loadingTasks} />}
    </main>
  );
}
