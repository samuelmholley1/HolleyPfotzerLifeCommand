"use client";
import React from "react";
import { Task } from '../types/tasks';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, loading }) => {
  if (loading) {
    return <div>Loading tasks...</div>;
  }
  if (tasks.length === 0) {
    return <div>No tasks yet.</div>;
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
      {tasks.map((task) => (
        <li key={task.id} style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
          <strong>{task.title}</strong> — <span>{task.status}</span>
          <p className="text-sm text-gray-600 mt-1">Priority: {task.priority || 'N/A'}</p>
        </li>
      ))}
    </ul>
  );
};
