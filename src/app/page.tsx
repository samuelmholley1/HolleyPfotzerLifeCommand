"use client";
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { taskService } from '../services/taskService';
import React, { useEffect, useState } from 'react';

// Define the Task type based on our schema
type Task = {
  id: string;
  title: string;
  status: string;
};

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const fetchedTasks = await taskService.getTasksSimple();
      setTasks(fetchedTasks || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      // Here you would set an error state to show in the UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (title: string) => {
    try {
      await taskService.createTaskSimple({ title });
      await loadTasks(); // Re-fetch tasks to show the new one
    } catch (error) {
      console.error("Failed to create task:", error);
      // Here you would set an error state to show in the UI
    }
  };

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Task MVP</h1>
      <TaskForm onCreate={handleCreateTask} />
      <TaskList tasks={tasks} loading={loading} />
    </main>
  );
}
