// This is a placeholder service. In a real app, this would interact with your database client (e.g., Supabase).
// For now, it makes fetch requests to our API routes.

const API_BASE_URL = '/api'; // Assumes the API routes are served from the same origin

type TaskData = {
  title: string;
  [key: string]: any; // Allows for extra fields
};

export const taskService = {
  getTasksSimple: async () => {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    return response.json();
  },

  createTaskSimple: async (taskData: TaskData) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    return response.json();
  },
};
