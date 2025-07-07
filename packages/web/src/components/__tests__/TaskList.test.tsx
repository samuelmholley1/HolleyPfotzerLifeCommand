import React from 'react';
import { render, screen } from '@testing-library/react';
import TaskList from '../TaskList';

describe('TaskList', () => {
  it('renders "No tasks yet" when tasks array is empty', () => {
    render(<TaskList tasks={[]} />);
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('renders a list of tasks when provided', () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', description: '', priority: 1 },
      { id: '2', title: 'Task 2', description: '', priority: 2 },
    ];
    render(<TaskList tasks={mockTasks} />);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });
});
