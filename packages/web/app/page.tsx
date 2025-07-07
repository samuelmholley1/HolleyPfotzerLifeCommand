"use client";

import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { useAuthContext } from '@/hooks/useAuthContext';
import React, { useEffect, useState } from 'react';
import { taskService } from '@/services/taskService';
import { Task } from '@/types/tasks';

export default function HomePage() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to get the active workspace id from user or context
  const activeWorkspaceId = (user as any)?.active_workspace_id || (user as any)?.workspace_id || '';

  useEffect(() => {
    const fetchTasks = async () => {
      setLoadingTasks(true);
      setError(null);

      try {
        // Fetch tasks from your API or database
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const data = await response.json();
        setTasks(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();

    // Expose fetchTasks as loadTasks for use in handleAddTask
    (window as any).loadTasks = fetchTasks;
  }, []);

  const handleAddTask = async (title: string) => {
    if (!title.trim()) {
      setError('Cannot create task: Title is required.');
      return;
    }
    if (!activeWorkspaceId) {
      setError('Cannot create task: No active workspace.');
      return;
    }
    try {
      const createdTask = await taskService.createTask({
        title,
        project_id: null,
        due_date: null,
        priority: 1,
        workspace_id: activeWorkspaceId,
        user_id: user.id,
      });
      // Re-fetch the tasks from the mock API to update the list
      await (window as any).loadTasks();
    } catch (err) {
      // Log the specific error to diagnose the failure
      const error = err as Error;
      setError(`Error: Could not create the task. Reason: ${error.message}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // Delete task implementation
  };

  const handleUpdateTask = async (taskId: string, updatedTask: Task) => {
    // Update task implementation
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome to the Task Manager</h1>
      {user ? (
        <div>
          <p>Hello, {user.name}!</p>
          <button onClick={signOut}>Sign Out</button>
          <TaskForm onAddTask={handleAddTask} />
          {loadingTasks ? (
            <div>Loading tasks...</div>
          ) : error ? (
            <div>Error: {error}</div>
          ) : (
            <TaskList tasks={tasks} loading={loadingTasks} />
          )}
        </div>
      ) : (
        <div>
          <p>Please sign in to manage your tasks.</p>
          <button onClick={signInWithGoogle}>Sign In with Google</button>
        </div>
      )}
    </div>
  );
}