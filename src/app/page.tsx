"use client";
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { taskService } from '../services/taskService';
import { Task } from '../types/tasks';
import { useAuth } from '../contexts/AuthContext'; // <-- IMPORT THE AUTH HOOK
import React, { useEffect, useState, useCallback } from 'react';

export default function HomePage() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth(); // <-- USE THE AUTH HOOK
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeWorkspaceId = user?.active_workspace_id;

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
    try {
      await taskService.createTask({
        title,
        workspaceId: activeWorkspaceId,
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

  if (!user) {
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
            <span style={{marginRight: '1rem'}}>Welcome, {user.name || user.email}</span>
            <button onClick={signOut} style={{padding: '5px 10px'}}>Sign Out</button>
        </div>
      </div>
      <hr style={{margin: '1rem 0'}} />
      
      {!activeWorkspaceId ? (
        <div>
          <p style={{color: 'orange'}}>No active workspace found for your profile.</p>
          {/* In a real app, you'd have a workspace selector here */}
        </div>
      ) : (
        <>
          <p style={{fontSize: '0.8rem', color: '#666'}}>Workspace: {activeWorkspaceId}</p>
          <TaskForm onCreate={handleCreateTask} />
          {error && <div style={{color: 'red', marginTop: '1rem'}}>{error}</div>}
          <TaskList tasks={tasks} loading={loadingTasks} />
        </>
      )}
    </main>
  );
}
