"use client";
import React, { useState } from 'react';
import { useAuthContext } from '@/hooks/useAuthContext';

interface TaskFormProps {
  onCreate: (title: string) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onCreate }) => {
  const [title, setTitle] = useState('');
  const { user, active_workspace_id } = useAuthContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title.trim());
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
      />
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded" disabled={!title.trim() || !user || !active_workspace_id}>
        Create Task
      </button>
    </form>
  );
};
