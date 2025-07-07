import { Task } from '@/types/tasks';

const isE2E = process.env.NEXT_PUBLIC_PW_E2E === '1';
const API_BASE_URL = isE2E ? '/api/e2e-mock' : '/api';

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
    const response = await fetch(`${API_BASE_URL}/tasks?workspaceId=${workspaceId}`);
    return handleResponse(response);
  },

  /**
   * Creates a new task.
   * @param data An object containing the required data to create a task.
   */
  async createTask(data: { title: string; workspace_id: string }): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};
