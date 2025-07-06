// removed stray type import: CreateTaskInput

import { useState } from 'react';

export function useTasks() {
    const [tasks, setTasks] = useState([]);

    const addTask = (task) => {
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