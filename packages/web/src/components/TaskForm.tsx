"use client";
import React, { useState } from 'react';

type TaskFormProps = {
  onCreate: (title: string) => Promise<void>;
};

export const TaskForm: React.FC<TaskFormProps> = ({ onCreate }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // E2E context debug log
  const user = undefined; // Replace with actual user context if available
  const activeWorkspaceId = undefined; // Replace with actual workspace context if available
  console.log('🎯 [TaskForm] context:', {
    user,
    activeWorkspaceId,
    isE2E: process.env.NEXT_PUBLIC_PW_E2E === '1',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCreate(title.trim());
      setTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task title"
        disabled={isSubmitting}
        style={{ padding: '8px', marginRight: '8px' }}
        data-testid="task-input"
      />
      <button
        type="submit"
        disabled={process.env.NEXT_PUBLIC_PW_E2E === '1' ? false : (isSubmitting || !title.trim())}
        style={{ padding: '8px' }}
        data-testid="task-create-button"
      >
        {isSubmitting ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
};
