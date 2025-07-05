// components/tasks/CreateTaskModal.tsx

import React, { useState } from 'react';
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
import { TaskService, CreateTaskData } from '../../lib/services/taskService';
import { DateTimePicker } from './DateTimePicker';

interface CreateTaskModalProps {
  visible: boolean;
  workspaceId: string;
  onClose: () => void;
  onTaskCreated: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  workspaceId,
  onClose,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState<'work' | 'health' | 'personal' | 'strategy'>('personal');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [hasDueDate, setHasDueDate] = useState(false);
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const isDarkMode = useColorScheme() === 'dark';

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

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      const taskData: CreateTaskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        dueDate: hasDueDate && dueDate ? dueDate : undefined,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        workspaceId,
      };

      await TaskService.createTask(taskData);
      
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('personal');
      setEstimatedDuration('');
      setDueDate(null);
      setHasDueDate(false);
      setTags('');
      
      onTaskCreated();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#9E9E9E' },
    { value: 'medium', label: 'Medium', color: '#4CAF50' },
    { value: 'high', label: 'High', color: '#FF8800' },
    { value: 'urgent', label: 'Urgent', color: '#FF4444' },
  ] as const;

  const categoryOptions = [
    { value: 'personal', label: 'Personal', color: '#9C27B0' },
    { value: 'work', label: 'Work', color: '#2196F3' },
    { value: 'health', label: 'Health', color: '#4CAF50' },
    { value: 'strategy', label: 'Strategy', color: '#FF9800' },
  ] as const;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>New Task</Text>
          
          <TouchableOpacity 
            onPress={handleCreate}
            style={[styles.createButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            <Text style={styles.createText}>
              {loading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to be done?"
              multiline
              maxLength={200}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details..."
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.optionsRow}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    { borderColor: option.color },
                    priority === option.value && { backgroundColor: option.color }
                  ]}
                  onPress={() => setPriority(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      priority === option.value && styles.selectedOptionText
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.optionsRow}>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    { borderColor: option.color },
                    category === option.value && { backgroundColor: option.color }
                  ]}
                  onPress={() => setCategory(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      category === option.value && styles.selectedOptionText
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Estimated Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              placeholder="e.g., 30"
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Due Date</Text>
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
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {dueDate ? formatDateForDisplay(dueDate) : 'Set due date'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="urgent, meeting, review (comma separated)"
              maxLength={200}
            />
          </View>
        </ScrollView>
      </View>

      <DateTimePicker
        visible={showDatePicker}
        date={dueDate || new Date()}
        onConfirm={(selectedDate: Date) => {
          setDueDate(selectedDate);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: '#666666',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  createText: {
    color: '#FFFFFF',
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
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 44,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333333',
  },
});
