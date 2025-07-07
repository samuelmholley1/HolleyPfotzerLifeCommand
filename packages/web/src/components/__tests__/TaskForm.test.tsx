import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskForm from '../TaskForm';

// Mock the useAuthContext hook if required by TaskForm
jest.mock('../../contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: { id: 'mock-user', active_workspace_id: 'mock-ws' } })
}));

describe('TaskForm', () => {
  it('should have the Create Task button disabled initially and enable it after input', () => {
    render(<TaskForm />);
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-create-button');
    expect(button).toBeDisabled();
    fireEvent.change(input, { target: { value: 'Test Task' } });
    expect(button).toBeEnabled();
  });
});
