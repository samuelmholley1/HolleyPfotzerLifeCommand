import { NextResponse } from 'next/server';

// This is a mock database. In a real app, you'd use Supabase or another DB.
let tasks = [
    { id: 'task-alice', title: "Alice's Task", status: 'pending' },
    { id: 'task-bob', title: "Bob's Task", status: 'pending' },
];

export async function GET() {
    return NextResponse.json(tasks);
}

export async function POST(request: Request) {
    const taskData = await request.json();
    const newTask = {
        id: `task-${Date.now()}`,
        status: 'pending',
        ...taskData,
    };
    tasks.push(newTask);
    return NextResponse.json(newTask, { status: 201 });
}
