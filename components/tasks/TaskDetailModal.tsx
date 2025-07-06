// components/tasks/TaskDetailModal.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  useColorScheme,
} from 'react-native';
import { Task } from '../../lib/db/Task';
import { TaskService, UpdateTaskData } from '../../lib/services/taskService';
import { DateTimePicker } from './DateTimePicker';
import { logger } from '../../lib/logging';

// Input validation and sanitization utilities
const INPUT_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  TAG_MAX_LENGTH: 50,
  MAX_TAGS: 10,
  DURATION_MAX: 1440, // 24 hours in minutes
} as const;

const sanitizeInput = (input: string): string => {
  // Basic XSS prevention - remove dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

const validateTitle = (title: string): string | null => {
  const sanitized = sanitizeInput(title);
  if (!sanitized || sanitized.length === 0) {
    return 'Title is required';
  }
  if (sanitized.length > INPUT_LIMITS.TITLE_MAX_LENGTH) {
    return `Title must be less than ${INPUT_LIMITS.TITLE_MAX_LENGTH} characters`;
  }
  return null;
};

const validateDescription = (description: string): string | null => {
  const sanitized = sanitizeInput(description);
  if (sanitized.length > INPUT_LIMITS.DESCRIPTION_MAX_LENGTH) {
    return `Description must be less than ${INPUT_LIMITS.DESCRIPTION_MAX_LENGTH} characters`;
  }
  return null;
};

const validateDuration = (duration: string): string | null => {
  if (!duration) return null;
  const num = parseInt(duration);
  if (isNaN(num) || num < 0) {
    return 'Duration must be a positive number';
  }
  if (num > INPUT_LIMITS.DURATION_MAX) {
    return `Duration cannot exceed ${INPUT_LIMITS.DURATION_MAX} minutes`;
  }
  return null;
};

const validateTags = (tagsString: string): string | null => {
  const tags = tagsString.split(',').map(tag => sanitizeInput(tag)).filter(tag => tag.length > 0);
  
  if (tags.length > INPUT_LIMITS.MAX_TAGS) {
    return `Cannot have more than ${INPUT_LIMITS.MAX_TAGS} tags`;
  }
  
  for (const tag of tags) {
    if (tag.length > INPUT_LIMITS.TAG_MAX_LENGTH) {
      return `Each tag must be less than ${INPUT_LIMITS.TAG_MAX_LENGTH} characters`;
    }
  }
  
  return null;
};

interface TaskDetailModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted?: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  task,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState<'work' | 'health' | 'personal' | 'strategy'>('personal');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled'>('pending');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [hasDueDate, setHasDueDate] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [actualDuration, setActualDuration] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const isDarkMode = useColorScheme() === 'dark';

  // Initialize form with task data
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setCategory(task.category);
      setStatus(task.status);
      
      if (task.dueDate) {
        setDueDate(new Date(task.dueDate));
        setHasDueDate(true);
      } else {
        setDueDate(null);
        setHasDueDate(false);
      }
      
      setEstimatedDuration(task.estimatedDuration ? String(task.estimatedDuration) : '');
      setActualDuration(task.actualDuration ? String(task.actualDuration) : '');
      setTags(task.tagsArray.join(', '));
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;

    // Validate all inputs
    const titleError = validateTitle(title);
    const descriptionError = validateDescription(description);
    const estimatedDurationError = validateDuration(estimatedDuration);
    const actualDurationError = validateDuration(actualDuration);
    const tagsError = validateTags(tags);

    const errors: Record<string, string> = {};
    if (titleError) errors.title = titleError;
    if (descriptionError) errors.description = descriptionError;
    if (estimatedDurationError) errors.estimatedDuration = estimatedDurationError;
    if (actualDurationError) errors.actualDuration = actualDurationError;
    if (tagsError) errors.tags = tagsError;

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      logger.warn('TaskDetailModal', 'Validation errors in task update', { errors, taskId: task.id });
      Alert.alert('Validation Error', Object.values(errors)[0]);
      return;
    }

    setLoading(true);
    const timer = logger.startTimer('TaskDetailModal:updateTask');
    
    try {
      const updateData: UpdateTaskData = {
        title: sanitizeInput(title),
        description: sanitizeInput(description) || undefined,
        priority,
        category,
        status,
        dueDate: hasDueDate && dueDate ? dueDate : null,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
        actualDuration: actualDuration ? parseInt(actualDuration) : null,
        tags: tags.split(',').map(tag => sanitizeInput(tag)).filter(tag => tag.length > 0),
      };

      logger.dataAccess('update', 'task', task.id);
      await TaskService.updateTask(task.id, updateData);
      logger.info('TaskDetailModal', 'Task updated successfully', { taskId: task.id });
      
      onTaskUpdated();
      onClose();
      timer();
    } catch (error) {
      timer();
      logger.error('TaskDetailModal', 'Error updating task', { 
        taskId: task.id,
        error: (error as Error).message 
      }, error as Error);
      Alert.alert('Error', 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TaskService.deleteTask(task.id);
              onTaskDeleted?.();
              onClose();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return 'No due date';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isTomorrow) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const themeStyles = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
    textColor: isDarkMode ? '#fff' : '#000',
    inputBackground: isDarkMode ? '#333' : '#f9f9f9',
    inputBorder: isDarkMode ? '#555' : '#ddd',
    modalBackground: isDarkMode ? '#2a2a2a' : '#fff',
    subtitleColor: isDarkMode ? '#ccc' : '#666',
  };

  if (!task) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.cancelButton, { color: '#007AFF' }]}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={[styles.title, { color: themeStyles.textColor }]}>
              Edit Task
            </Text>
            
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              <Text style={[styles.saveButton, { 
                color: loading ? themeStyles.subtitleColor : '#007AFF' 
              }]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Title */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: themeStyles.textColor }]}>Title</Text>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: themeStyles.inputBackground,
                  borderColor: themeStyles.inputBorder,
                  color: themeStyles.textColor,
                }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Task title"
                placeholderTextColor={themeStyles.subtitleColor}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: themeStyles.textColor }]}>Description</Text>
              <TextInput
                style={[styles.textAreaInput, {
                  backgroundColor: themeStyles.inputBackground,
                  borderColor: themeStyles.inputBorder,
                  color: themeStyles.textColor,
                }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Task description (optional)"
                placeholderTextColor={themeStyles.subtitleColor}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Status */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: themeStyles.textColor }]}>Status</Text>
              <View style={styles.optionGrid}>
                {(['pending', 'in_progress', 'completed', 'cancelled'] as const).map((statusOption) => (
                  <TouchableOpacity
                    key={statusOption}
                    style={[
                      styles.optionButton,
                      status === statusOption && styles.selectedOption,
                      { borderColor: themeStyles.inputBorder }
                    ]}
                    onPress={() => setStatus(statusOption)}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: themeStyles.textColor },
                      status === statusOption && styles.selectedOptionText
                    ]}>
                      {statusOption.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: themeStyles.textColor }]}>Priority</Text>
              <View style={styles.optionGrid}>
                {(['low', 'medium', 'high', 'urgent'] as const).map((priorityOption) => (
                  <TouchableOpacity
                    key={priorityOption}
                    style={[
                      styles.optionButton,
                      priority === priorityOption && styles.selectedOption,
                      { borderColor: themeStyles.inputBorder }
                    ]}
                    onPress={() => setPriority(priorityOption)}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: themeStyles.textColor },
                      priority === priorityOption && styles.selectedOptionText
                    ]}>
                      {priorityOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: themeStyles.textColor }]}>Category</Text>
              <View style={styles.optionGrid}>
                {(['work', 'health', 'personal', 'strategy'] as const).map((categoryOption) => (
                  <TouchableOpacity
                    key={categoryOption}
                    style={[
                      styles.optionButton,
                      category === categoryOption && styles.selectedOption,
                      { borderColor: themeStyles.inputBorder }
                    ]}
                    onPress={() => setCategory(categoryOption)}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: themeStyles.textColor },
                      category === categoryOption && styles.selectedOptionText
                    ]}>
                      {categoryOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.section}>
              <View style={styles.dueDateHeader}>
                <Text style={[styles.dueDateLabel, { color: themeStyles.textColor }]}>Due Date</Text>
                <Switch
                  value={hasDueDate}
                  onValueChange={(value) => {
                    setHasDueDate(value);
                    if (!value) {
                      setDueDate(null);
                    } else if (!dueDate) {
                      setDueDate(new Date());
                    }
                  }}
                />
              </View>
              
              {hasDueDate && (
                <TouchableOpacity
                  style={[styles.dateButton, {
                    backgroundColor: themeStyles.inputBackground,
                    borderColor: themeStyles.inputBorder,
                  }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.dateButtonText, { color: themeStyles.textColor }]}>
                    {formatDateForDisplay(dueDate)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Duration */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: themeStyles.textColor }]}>Duration (minutes)</Text>
              <View style={styles.durationRow}>
                <View style={styles.durationInput}>
                  <Text style={[styles.durationLabel, { color: themeStyles.subtitleColor }]}>
                    Estimated
                  </Text>
                  <TextInput
                    style={[styles.textInput, {
                      backgroundColor: themeStyles.inputBackground,
                      borderColor: themeStyles.inputBorder,
                      color: themeStyles.textColor,
                    }]}
                    value={estimatedDuration}
                    onChangeText={setEstimatedDuration}
                    placeholder="60"
                    placeholderTextColor={themeStyles.subtitleColor}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.durationInput}>
                  <Text style={[styles.durationLabel, { color: themeStyles.subtitleColor }]}>
                    Actual
                  </Text>
                  <TextInput
                    style={[styles.textInput, {
                      backgroundColor: themeStyles.inputBackground,
                      borderColor: themeStyles.inputBorder,
                      color: themeStyles.textColor,
                    }]}
                    value={actualDuration}
                    onChangeText={setActualDuration}
                    placeholder="45"
                    placeholderTextColor={themeStyles.subtitleColor}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Tags */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: themeStyles.textColor }]}>Tags</Text>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: themeStyles.inputBackground,
                  borderColor: themeStyles.inputBorder,
                  color: themeStyles.textColor,
                }]}
                value={tags}
                onChangeText={setTags}
                placeholder="urgent, meeting, review (comma separated)"
                placeholderTextColor={themeStyles.subtitleColor}
              />
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete Task</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <DateTimePicker
        visible={showDatePicker}
        date={dueDate || new Date()}
        onConfirm={(selectedDate: Date) => {
          setDueDate(selectedDate);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dueDateLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  selectedOptionText: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dueDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  durationInput: {
    flex: 1,
  },
  durationLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TaskDetailModal;
