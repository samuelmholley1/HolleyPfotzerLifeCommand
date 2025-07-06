// Task type comes from canonical Supabase schema
import { Task } from '@/types/tasks';

// removed stray type import: CreateTaskInput

import { useState } from 'react';

export function useTasks() {
    // --- strongly-typed task list ---------------------------------
    const [tasks, setTasks] = useState<Task[]>([]);

    const addTask = (task: Task) => {
        setTasks([...tasks, task]);
    };

    const removeTask = (taskToRemove: Task) => {
        setTasks(tasks.filter((t: Task) => t.id !== taskToRemove.id));
    };

    return {
        tasks,
        addTask,
        removeTask
    };
}