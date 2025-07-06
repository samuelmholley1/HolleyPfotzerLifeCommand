import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { DateTimePicker } from './tasks/DateTimePicker';

// Security configuration for input validation
const INPUT_SECURITY_CONFIG = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  TAGS_MAX_LENGTH: 200,
  MAX_TAGS: 10,
  
  // Security patterns
  XSS_PREVENTION: /[<>\"']/g,
  SCRIPT_TAGS: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  UNICODE_BYPASS: /[\u0000-\u001f\u007f-\u009f]/g,
} as const;

// Advanced input sanitization
export const advancedSanitize = (input: string): string => {
  let sanitized = input;
  
  // Remove XSS vectors
  sanitized = sanitized.replace(INPUT_SECURITY_CONFIG.XSS_PREVENTION, '');
  sanitized = sanitized.replace(INPUT_SECURITY_CONFIG.SCRIPT_TAGS, '');
  sanitized = sanitized.replace(INPUT_SECURITY_CONFIG.UNICODE_BYPASS, '');
  
  // Normalize and trim
  return sanitized.normalize('NFKC').trim();
};

// Secure accessibility props creation
export const createSecureAccessibilityProps = (
  label: string, 
  hint?: string, 
  required: boolean = false
) => {
  const sanitizedLabel = advancedSanitize(label).substring(0, 100);
  const sanitizedHint = hint ? advancedSanitize(hint).substring(0, 200) : undefined;
  
  return {
    accessibilityLabel: sanitizedLabel,
    accessibilityHint: sanitizedHint,
    accessibilityRequired: required,
    accessibilityLiveRegion: 'none' as const,
  };
};

interface CreateGoalFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'health' | 'career' | 'financial' | 'personal' | 'relationships' | 'learning';
  hasTargetDate: boolean;
  targetDate: Date | null;
  tags: string[];
}

interface CreateGoalFormProps {
  onSubmit: (data: CreateGoalFormData) => void;
  loading?: boolean;
}

export const CreateGoalForm: React.FC<CreateGoalFormProps> = ({ 
  onSubmit, 
  loading = false 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<CreateGoalFormData['priority']>('medium');
  const [category, setCategory] = useState<CreateGoalFormData['category']>('personal');
  const [hasTargetDate, setHasTargetDate] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [tagsText, setTagsText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isDarkMode = useColorScheme() === 'dark';

  const themeStyles = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
    textColor: isDarkMode ? '#fff' : '#000',
    subtitleColor: isDarkMode ? '#ccc' : '#666',
    inputBackground: isDarkMode ? '#2a2a2a' : '#f9f9f9',
    inputBorder: isDarkMode ? '#555' : '#ddd',
    buttonColor: '#4285F4',
    disabledColor: isDarkMode ? '#555' : '#ccc',
  };

  const handleSubmit = () => {
    // Enhanced validation with sanitization
    const sanitizedTitle = advancedSanitize(title);
    const sanitizedDescription = advancedSanitize(description);
    
    if (!sanitizedTitle.trim()) {
      Alert.alert('Validation Error', 'Goal title is required');
      return;
    }

    const tags = tagsText
      .split(',')
      .map(tag => advancedSanitize(tag.trim()))
      .filter(tag => tag.length > 0)
      .slice(0, INPUT_SECURITY_CONFIG.MAX_TAGS); // Limit number of tags

    const formData: CreateGoalFormData = {
      title: sanitizedTitle.trim(),
      description: sanitizedDescription.trim(),
      priority,
      category,
      hasTargetDate,
      targetDate: hasTargetDate ? targetDate : null,
      tags,
    };

    onSubmit(formData);
  };

  const isValid = title.trim().length > 0;

  const priorityOptions: { value: CreateGoalFormData['priority']; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: '#4CAF50' },
    { value: 'medium', label: 'Medium', color: '#FF9800' },
    { value: 'high', label: 'High', color: '#F44336' },
    { value: 'critical', label: 'Critical', color: '#9C27B0' },
  ];

  const categoryOptions: { value: CreateGoalFormData['category']; label: string; icon: string }[] = [
    { value: 'health', label: 'Health', icon: '🏥' },
    { value: 'career', label: 'Career', icon: '💼' },
    { value: 'financial', label: 'Financial', icon: '💰' },
    { value: 'personal', label: 'Personal', icon: '🎯' },
    { value: 'relationships', label: 'Relationships', icon: '❤️' },
    { value: 'learning', label: 'Learning', icon: '📚' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeStyles.textColor }]}>
            Goal Title *
          </Text>
          <TextInput
            style={[styles.textInput, {
              backgroundColor: themeStyles.inputBackground,
              borderColor: themeStyles.inputBorder,
              color: themeStyles.textColor,
            }]}
            value={title}
            onChangeText={(text: string) => setTitle(advancedSanitize(text))}
            placeholder="Enter your goal title"
            placeholderTextColor={themeStyles.subtitleColor}
            maxLength={INPUT_SECURITY_CONFIG.TITLE_MAX_LENGTH}
            {...createSecureAccessibilityProps('Goal Title', 'Enter the title of your goal', true)}
          />
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeStyles.textColor }]}>
            Description
          </Text>
          <TextInput
            style={[styles.textAreaInput, {
              backgroundColor: themeStyles.inputBackground,
              borderColor: themeStyles.inputBorder,
              color: themeStyles.textColor,
            }]}
            value={description}
            onChangeText={(text: string) => setDescription(advancedSanitize(text))}
            placeholder="Describe your goal (optional)"
            placeholderTextColor={themeStyles.subtitleColor}
            multiline
            numberOfLines={3}
            maxLength={INPUT_SECURITY_CONFIG.DESCRIPTION_MAX_LENGTH}
            {...createSecureAccessibilityProps('Goal Description', 'Describe your goal in detail', false)}
          />
        </View>

        {/* Priority Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeStyles.textColor }]}>
            Priority
          </Text>
          <View style={styles.optionGrid}>
            {priorityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  priority === option.value && { 
                    backgroundColor: option.color + '20',
                    borderColor: option.color 
                  },
                  { borderColor: priority === option.value ? option.color : themeStyles.inputBorder }
                ]}
                onPress={() => setPriority(option.value)}
                {...createSecureAccessibilityProps(`Priority ${option.label}`, `Set priority to ${option.label}`, false)}
              >
                <Text style={[
                  styles.optionText,
                  { color: priority === option.value ? option.color : themeStyles.textColor }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeStyles.textColor }]}>
            Category
          </Text>
          <View style={styles.optionGrid}>
            {categoryOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  category === option.value && styles.selectedOption,
                  { borderColor: themeStyles.inputBorder }
                ]}
                onPress={() => setCategory(option.value)}
                {...createSecureAccessibilityProps(`Category ${option.label}`, `Select ${option.label} category`, false)}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={[
                  styles.optionText,
                  { color: themeStyles.textColor },
                  category === option.value && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Target Date Section */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: themeStyles.textColor }]}>
              Set Target Date
            </Text>
            <Switch
              value={hasTargetDate}
              onValueChange={(value) => {
                setHasTargetDate(value);
                if (!value) {
                  setTargetDate(null);
                } else if (!targetDate) {
                  setTargetDate(new Date());
                }
              }}
              {...createSecureAccessibilityProps('Set Target Date', 'Enable or disable target date', false)}
            />
          </View>
          
          {hasTargetDate && (
            <TouchableOpacity
              style={[styles.dateButton, {
                backgroundColor: themeStyles.inputBackground,
                borderColor: themeStyles.inputBorder,
              }]}
              onPress={() => setShowDatePicker(true)}
              {...createSecureAccessibilityProps('Select Target Date', 'Choose a target date for your goal', false)}
            >
              <Text style={[styles.dateButtonText, { color: themeStyles.textColor }]}>
                {targetDate ? targetDate.toLocaleDateString() : 'Select target date'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tags Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeStyles.textColor }]}>
            Tags
          </Text>
          <TextInput
            style={[styles.textInput, {
              backgroundColor: themeStyles.inputBackground,
              borderColor: themeStyles.inputBorder,
              color: themeStyles.textColor,
            }]}
            value={tagsText}
            onChangeText={(text: string) => setTagsText(advancedSanitize(text))}
            placeholder="Enter tags separated by commas"
            placeholderTextColor={themeStyles.subtitleColor}
            maxLength={INPUT_SECURITY_CONFIG.TAGS_MAX_LENGTH}
            {...createSecureAccessibilityProps('Tags', 'Enter tags for your goal, separated by commas', false)}
          />
          <Text style={[styles.helperText, { color: themeStyles.subtitleColor }]}>
            e.g., fitness, quarterly, important
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: isValid && !loading ? themeStyles.buttonColor : themeStyles.disabledColor }
          ]}
          onPress={handleSubmit}
          disabled={!isValid || loading}
          {...createSecureAccessibilityProps('Create Goal', 'Submit the goal creation form', true)}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating Goal...' : 'Create Goal'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <DateTimePicker
        visible={showDatePicker}
        date={targetDate || new Date()}
        mode="date"
        onConfirm={(selectedDate: Date) => {
          setTargetDate(selectedDate);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
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
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  selectedOption: {
    backgroundColor: '#4285F420',
    borderColor: '#4285F4',
  },
  optionIcon: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#4285F4',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 0,
  },
  submitButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateGoalForm;
