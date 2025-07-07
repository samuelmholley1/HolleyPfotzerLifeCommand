// packages/web/src/app/api/e2e-mock/tasks/route.ts
import { NextResponse } from 'next/server';

interface Task { id: string; title: string; status: string; }
let mockTasks: Task[] = [];

export async function GET() {
  return NextResponse.json(mockTasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newTask = { id: `mock-${Date.now()}`, title: body.title, status: 'pending' };
  mockTasks.push(newTask);
  return NextResponse.json(newTask, { status: 201 });
}

export async function DELETE() {
  mockTasks = [];
  return NextResponse.json({ ok: true });
}
