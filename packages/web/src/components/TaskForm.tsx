"use client";
import React, { useState } from 'react';

type TaskFormProps = {
  onCreate: (title: string) => Promise<void>;
};

export const TaskForm: React.FC<TaskFormProps> = ({ onCreate }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <button type="submit" disabled={isSubmitting || !title.trim()} style={{ padding: '8px' }} data-testid="task-create-button">
        {isSubmitting ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
};
