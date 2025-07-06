// Task type comes from canonical Supabase schema
import { Task } from '@/types/tasks';

// removed stray type import: CreateTaskInput

import { useState } from 'react';

export function useTasks() {
    const [tasks, setTasks] = useState([]);

    const addTask = (task: Task) => {
        setTasks([...tasks, task]);
    };

    const removeTask = (taskToRemove) => {
        setTasks(tasks.filter(task => task !== taskToRemove));
    };

    return {
        tasks,
        addTask,
        removeTask
    };
}