import { supabase } from '../lib/supabase';

const API_URL = 'http://localhost:3002'; // The address of your new backend server

const getTasks = async () => {
  const session = await supabase.auth.getSession();

  if (!session.data.session) {
    throw new Error('User not authenticated');
  }

  const token = session.data.session.access_token;

  const response = await fetch(`${API_URL}/tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }

  return response.json();
};

const syncEvents = async (events: any[]) => {
  const session = await supabase.auth.getSession();

  if (!session.data.session) {
    throw new Error('User not authenticated');
  }

  const token = session.data.session.access_token;

  const response = await fetch(`${API_URL}/tasks/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ events }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync events');
  }

  return response.json();
};

export const apiService = {
  getTasks,
  syncEvents,
};
