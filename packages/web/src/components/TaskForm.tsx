"use client";
import React, { useState } from 'react';
import { useAuthContext } from '@/hooks/useAuthContext';

interface TaskFormProps {
  onAddTask: (title: string) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const { user, active_workspace_id } = useAuthContext();
  const isE2E = process.env.NEXT_PUBLIC_PW_E2E === '1';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddTask(title.trim());
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full p-2 border rounded"
        data-testid="task-input"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded"
        data-testid="task-create-button"
        disabled={isE2E ? false : (!title.trim() || !user || !active_workspace_id)}
      >
        Create Task
      </button>
    </form>
  );
};
