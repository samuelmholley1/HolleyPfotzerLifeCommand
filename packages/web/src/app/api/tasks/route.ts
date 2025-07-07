import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { dbTaskService } from '@/services/dbTaskService';
import { AuthUser } from '@/types/auth';

function sessionUserToAuthUser(user: any): AuthUser {
  return {
    id: user.id,
    active_workspace_id: user.active_workspace_id,
    name: user.name,
    email: user.email,
    app_metadata: {},
    user_metadata: {},
    aud: '',
    created_at: '',
  };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  // Only check for user existence, not id/workspace_id, since those are added by sessionUserToAuthUser
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const authUser = sessionUserToAuthUser(user);
    if (!authUser.id || !authUser.active_workspace_id) {
      return NextResponse.json({ error: 'User context incomplete' }, { status: 400 });
    }
    const tasks = await dbTaskService.getTasks(authUser);
    return NextResponse.json(tasks);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const authUser = sessionUserToAuthUser(user);
    if (!authUser.id || !authUser.active_workspace_id) {
      return NextResponse.json({ error: 'User context incomplete' }, { status: 400 });
    }
    const body = await request.json();
    const newTask = await dbTaskService.createTask(body, authUser);
    return NextResponse.json(newTask, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
