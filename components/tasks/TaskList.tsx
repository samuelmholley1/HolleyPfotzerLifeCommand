// components/tasks/TaskList.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Task } from '../../lib/db/Task';
import { TaskService } from '../../lib/services/taskService';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';

interface TaskListProps {
  workspaceId: string;
}

export const TaskList: React.FC<TaskListProps> = ({ workspaceId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const loadTasks = useCallback(async () => {
    try {
      let loadedTasks: Task[];
      
      switch (filter) {
        case 'pending':
          const pendingTasks = await TaskService.getTasksByStatus(workspaceId, 'pending');
          const inProgressTasks = await TaskService.getTasksByStatus(workspaceId, 'in_progress');
          loadedTasks = [...pendingTasks, ...inProgressTasks];
          break;
        case 'completed':
          loadedTasks = await TaskService.getTasksByStatus(workspaceId, 'completed');
          break;
        default:
          loadedTasks = await TaskService.getTasksForWorkspace(workspaceId);
      }
      
      // Sort by priority and creation date
      loadedTasks.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        return b.createdAt.getTime() - a.createdAt.getTime(); // Newer first
      });
      
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, filter]);

  useEffect(() => {
    loadTasks();
  }, [workspaceId, filter, loadTasks]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await TaskService.updateTask(task.id, { status: newStatus });
      loadTasks(); // Reload tasks
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onPress={handleTaskPress}
      onToggleComplete={handleToggleComplete}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Tasks</Text>
      
      <View style={styles.filterContainer}>
        {['all', 'pending', 'completed'].map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterButton,
              filter === filterOption && styles.activeFilterButton
            ]}
            onPress={() => setFilter(filterOption as any)}
          >
            <Text
              style={[
                styles.filterText,
                filter === filterOption && styles.activeFilterText
              ]}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {filter === 'completed' ? 'No completed tasks' : 'No tasks yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'completed' 
          ? 'Complete some tasks to see them here'
          : 'Create your first task to get started'
        }
      </Text>
      {filter !== 'completed' && (
        <TouchableOpacity
          style={styles.createFirstTaskButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.createFirstTaskText}>Create Task</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item: import('../../types/tasks').Task) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={tasks.length === 0 ? styles.emptyList : undefined}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreateModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <CreateTaskModal
        visible={createModalVisible}
        workspaceId={workspaceId}
        onClose={() => setCreateModalVisible(false)}
        onTaskCreated={loadTasks}
      />

      <TaskDetailModal
        visible={detailModalVisible}
        task={selectedTask}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={loadTasks}
        onTaskDeleted={() => {
          loadTasks();
          setDetailModalVisible(false);
          setSelectedTask(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  createFirstTaskButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstTaskText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
