"use client";
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { taskService } from '../services/taskService';
import { Task } from '../types/tasks';
import React, { useEffect, useState, useCallback } from 'react';

// FOR MVP, WE WILL USE A HARDCODED WORKSPACE ID.
// In a real app, this would be dynamically determined after user login.
// TODO: Replace this with dynamic workspace context.
const MOCK_WORKSPACE_ID = "32d82c03-68d4-4a49-b391-ab6c5399ec61"; // <<<--- REPLACE THIS WITH A REAL ID FROM YOUR 'workspaces' TABLE IN SUPABASE

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedTasks = await taskService.getTasks(MOCK_WORKSPACE_ID);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError("Could not load tasks. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (title: string) => {
    try {
      await taskService.createTask({
        title,
        workspaceId: MOCK_WORKSPACE_ID,
      });
      await loadTasks(); // Re-fetch tasks to show the new one
    } catch (err) {
      console.error("Failed to create task:", err);
      setError("Could not create the task.");
      // Optionally re-load tasks even on failure to ensure UI consistency
      await loadTasks();
    }
  };

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Task MVP</h1>
      <p style={{fontSize: '0.8rem', color: '#666'}}>Workspace: {MOCK_WORKSPACE_ID}</p>
      <TaskForm onCreate={handleCreateTask} />
      {error && <div style={{color: 'red', marginTop: '1rem'}}>{error}</div>}
      <TaskList tasks={tasks} loading={loading} />
    </main>
  );
}
