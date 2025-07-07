import { Task } from '@/types/tasks';

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
}

export const taskService = {
  /**
   * Fetches all tasks for a given workspace.
   * @param workspaceId The UUID of the workspace to fetch tasks from.
   */
  async getTasks(workspaceId: string): Promise<Task[]> {
    const response = await fetch(`/api/tasks?workspaceId=${workspaceId}`);
    return handleResponse(response);
  },

  /**
   * Creates a new task.
   * @param data An object containing the required data to create a task.
   */
  async createTask(data: { title: string; workspace_id: string }): Promise<Task> {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};
