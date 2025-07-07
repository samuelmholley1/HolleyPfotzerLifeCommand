// packages/web/src/app/api/e2e-mock/tasks/route.ts
import { NextResponse } from 'next/server';

// This interface must match the real Task type to prevent data contract errors.
interface Task {
  id: string;
  title: string;
  status: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  workspace_id: string;
  project_id: string | null;
  priority: number;
}

// Use the global object to create a persistent in-memory "database"
// that survives Next.js dev server hot-reloading. This is the key fix.
const globalForDb = globalThis as unknown as { mockTasks: Task[] | undefined };
if (!globalForDb.mockTasks) {
  globalForDb.mockTasks = [];
}

// Handles GET requests to /api/e2e-mock/tasks
export async function GET() {
  return NextResponse.json(globalForDb.mockTasks);
}

// Handles POST requests to /api/e2e-mock/tasks
export async function POST(request: Request) {
  const body = await request.json();
  const newTask: Task = {
    id: `mock-id-${Date.now()}`,
    title: body.title,
    status: 'pending',
    description: null,
    due_date: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'e2e-user',
    workspace_id: 'e2e-workspace',
    project_id: null,
    priority: 1,
  };
  globalForDb.mockTasks!.push(newTask);
  return NextResponse.json(newTask, { status: 201 });
}

// Handles DELETE requests to /api/e2e-mock/tasks to reset state between tests
export async function DELETE() {
  globalForDb.mockTasks = [];
  return NextResponse.json({ ok: true });
}
