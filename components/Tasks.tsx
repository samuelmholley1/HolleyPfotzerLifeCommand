import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types/tasks';

const Tasks: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const { 
    tasks, 
    stats, 
    loading, 
    error, 
    createTask, 
    toggleTask, 
    deleteTask 
  } = useTasks();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showCompleted, setShowCompleted] = useState(true);
  
  const themeStyles = {
    backgroundColor: isDarkMode ? '#000' : '#f0f2f5',
    textColor: isDarkMode ? '#fff' : '#000',
    cardBackground: isDarkMode ? '#1a1a1a' : '#fff',
    borderColor: isDarkMode ? '#333' : '#ddd',
    completedColor: isDarkMode ? '#666' : '#999',
    priorityHigh: '#ff4444',
    priorityMedium: '#ffaa00',
    priorityLow: '#00aa00',
  };

  const handleAddTask = async () => {
    if (newTaskTitle.trim()) {
      const success = await createTask({
        title: newTaskTitle.trim(),
        priority: newTaskPriority
      });
      
      if (success) {
        setNewTaskTitle('');
        setNewTaskPriority('medium');
      }
    }
  };

  const handleToggleTask = async (id: string) => {
    await toggleTask(id);
  };

  const handleDeleteTask = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteTask(id);
        }}
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return themeStyles.priorityHigh;
      case 'medium': return themeStyles.priorityMedium;
      case 'low': return themeStyles.priorityLow;
      default: return themeStyles.priorityMedium;
    }
  };

  const completedTasks = stats?.completed || 0;
  const totalTasks = stats?.total || 0;

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
        <View style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
          <ActivityIndicator size="large" color={themeStyles.priorityMedium} />
          <Text style={[styles.subtitle, { color: themeStyles.textColor, marginTop: 16 }]}>
            Loading tasks...
          </Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
        <View style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
          <Text style={[styles.title, { color: themeStyles.priorityHigh }]}>
            ⚠️ Error
          </Text>
          <Text style={[styles.subtitle, { color: themeStyles.textColor }]}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      {/* Header Card */}
      <View style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
        <Text style={[styles.title, { color: themeStyles.textColor }]}>
          📋 Tasks
        </Text>
        <Text style={[styles.subtitle, { color: themeStyles.textColor }]}>
          {completedTasks} of {totalTasks} completed
        </Text>
        
        {/* Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: themeStyles.borderColor }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
                backgroundColor: themeStyles.priorityMedium
              }
            ]} 
          />
        </View>
      </View>

      {/* Add New Task */}
      <View style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: themeStyles.textColor }]}>
          Add New Task
        </Text>
        <View style={styles.addTaskContainer}>
          <TextInput
            style={[
              styles.addTaskInput,
              { 
                color: themeStyles.textColor, 
                borderColor: themeStyles.borderColor,
                backgroundColor: themeStyles.backgroundColor
              }
            ]}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholder="Enter task description..."
            placeholderTextColor={isDarkMode ? '#888' : '#999'}
            onSubmitEditing={handleAddTask}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: themeStyles.priorityMedium }]}
            onPress={handleAddTask}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {/* Priority Selector */}
        <View style={styles.priorityContainer}>
          <Text style={[styles.priorityLabel, { color: themeStyles.textColor }]}>
            Priority:
          </Text>
          <View style={styles.priorityOptions}>
            {['low', 'medium', 'high'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.priorityOption,
                  { 
                    backgroundColor: newTaskPriority === level ? themeStyles.priorityMedium : 'transparent',
                    borderColor: themeStyles.borderColor
                  }
                ]}
                onPress={() => setNewTaskPriority(level as 'low' | 'medium' | 'high')}
              >
                <Text style={[styles.priorityText, { color: themeStyles.textColor }]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Tasks List */}
      <View style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
        <View style={styles.tasksHeader}>
          <Text style={[styles.sectionTitle, { color: themeStyles.textColor }]}>
            Your Tasks
          </Text>
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: themeStyles.borderColor }]}
            onPress={() => setShowCompleted(!showCompleted)}
          >
            <Text style={[styles.filterText, { color: themeStyles.textColor }]}>
              {showCompleted ? 'Hide Completed' : 'Show Completed'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {tasks.length === 0 ? (
          <Text style={[styles.emptyText, { color: themeStyles.textColor }]}>
            No tasks yet. Add one above to get started!
          </Text>
        ) : (
          tasks.filter(task => showCompleted || task.status !== 'completed').map((task) => (
            <View key={task.id} style={[styles.taskItem, { borderColor: themeStyles.borderColor }]}>
              <TouchableOpacity 
                style={styles.taskContent}
                onPress={() => handleToggleTask(task.id)}
              >
                <View style={styles.taskLeft}>
                  <View style={[
                    styles.checkbox,
                    { 
                      backgroundColor: task.status === "completed" ? themeStyles.priorityMedium : 'transparent',
                      borderColor: task.status === "completed" ? themeStyles.priorityMedium : themeStyles.borderColor
                    }
                  ]}>
                    {task.status === "completed" && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[
                    styles.taskTitle,
                    { 
                      color: task.status === "completed" ? themeStyles.completedColor : themeStyles.textColor,
                      textDecorationLine: task.status === "completed" ? 'line-through' : 'none'
                    }
                  ]}>
                    {task.title}
                  </Text>
                </View>
                <View style={styles.taskRight}>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(task.priority ?? 'default') }
                  ]}>
                    <Text style={styles.priorityText}>{task.priority}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTask(task.id)}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Info Card */}
      <View style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
        <Text style={[styles.infoTitle, { color: themeStyles.textColor }]}>
          💡 About Tasks
        </Text>
        <Text style={[styles.infoText, { color: themeStyles.textColor }]}>
          This is a demo task manager. In the full version, tasks will sync across devices and integrate with your calendar and daily briefings.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  addTaskContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addTaskInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskRight: {
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskTitle: {
    fontSize: 16,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#ff4444',
    fontWeight: 'bold',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  priorityContainer: {
    marginTop: 16,
  },
  priorityLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Tasks;
