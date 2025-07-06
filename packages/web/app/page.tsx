"use client";

import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { useAuthContext } from '@/hooks/useAuthContext';
import React, { useEffect, useState, useCallback } from 'react';
import { taskService } from '@/services/taskService';
import { Task } from '@/types/tasks';

export default function HomePage() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  const handleAddTask = async (task: Task) => {
    // Add task implementation
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
            <TaskList tasks={tasks} onDeleteTask={handleDeleteTask} onUpdateTask={handleUpdateTask} />
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