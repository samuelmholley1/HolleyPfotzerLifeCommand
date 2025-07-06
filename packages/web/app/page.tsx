'use client';

import { TaskForm } from '@components/TaskForm';
import { TaskList } from '@components/TaskList';
import { AuthProvider } from '@contexts/AuthContext';

export default function Home() {
  return (
    <AuthProvider>
      <main>
        <h1>Holley Pfotzer Life Command</h1>
        <TaskForm />
        <TaskList />
      </main>
    </AuthProvider>
  );
}
