import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbTaskService } from '@/services/dbTaskService';
import { AuthUser } from '@/types/auth';

// Helper to cast session.user to AuthUser
function getAuthUser(session: any): AuthUser | null {
  if (!session?.user?.id || !session.user.active_workspace_id) return null;
  return session.user as AuthUser;
}

// GET handler to fetch tasks for the authenticated user
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const user = getAuthUser(session);
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  try {
    const tasks = await dbTaskService.getTasks(user);
    return NextResponse.json(tasks);
  } catch (error) {
    return new NextResponse('Failed to fetch tasks from the database.', { status: 500 });
  }
}

// POST handler to create a new task for the authenticated user
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const user = getAuthUser(session);
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  try {
    const body = await request.json();
    const createdTask = await dbTaskService.createTask(body, user);
    return NextResponse.json(createdTask, { status: 201 });
  } catch (error) {
    return new NextResponse('Failed to create the task in the database.', { status: 500 });
  }
}
