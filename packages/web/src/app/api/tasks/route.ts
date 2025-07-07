import { NextResponse } from 'next/server';
import { taskService } from '@/services/dbTaskService'; // Assuming this is your real service

export async function GET(request: Request) {
  // Your real database logic here
  const tasks = await taskService.getAll();
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  // Your real database logic here
  const body = await request.json();
  const newTask = await taskService.create(body);
  return NextResponse.json(newTask, { status: 201 });
}
