// components/tasks/TaskCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../../lib/db/Task';

interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
  onToggleComplete?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onPress, 
  onToggleComplete 
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#4CAF50';
      case 'low': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return '#2196F3';
      case 'health': return '#4CAF50';
      case 'personal': return '#9C27B0';
      case 'strategy': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return 'Today';
    }
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isTomorrow) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        task.isCompleted && styles.completedContainer,
        task.isOverdue && !task.isCompleted && styles.overdueContainer
      ]}
      onPress={() => onPress?.(task)}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            task.isCompleted && styles.checkboxCompleted
          ]}
          onPress={() => onToggleComplete?.(task)}
        >
          {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text 
            style={[
              styles.title,
              task.isCompleted && styles.completedTitle
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          
          {task.description && (
            <Text 
              style={[
                styles.description,
                task.isCompleted && styles.completedText
              ]}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.tags}>
          <View 
            style={[
              styles.priorityTag,
              { backgroundColor: getPriorityColor(task.priority) }
            ]}
          >
            <Text style={styles.tagText}>{task.priority}</Text>
          </View>
          
          <View 
            style={[
              styles.categoryTag,
              { backgroundColor: getCategoryColor(task.category) }
            ]}
          >
            <Text style={styles.tagText}>{task.category}</Text>
          </View>
        </View>

        <View style={styles.metadata}>
          {task.dueDate && (
            <Text 
              style={[
                styles.dueDate,
                task.isOverdue && !task.isCompleted && styles.overdueDueDate
              ]}
            >
              {formatDate(task.dueDate)}
            </Text>
          )}
          {task.formattedDuration && (
            <Text style={styles.duration}>
              {task.formattedDuration}
            </Text>
          )}
          {/* Display slug for admin/debugging */}
          {task.slug && (
            <Text style={styles.slugText}>Slug: {task.slug}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  completedContainer: {
    opacity: 0.7,
    backgroundColor: '#F5F5F5',
  },
  overdueContainer: {
    borderLeftColor: '#FF4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  completedText: {
    color: '#999999',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    flex: 1,
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  metadata: {
    alignItems: 'flex-end',
  },
  dueDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  overdueDueDate: {
    color: '#FF4444',
    fontWeight: '600',
  },
  duration: {
    fontSize: 12,
    color: '#999999',
  },
  slugText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
  },
});
