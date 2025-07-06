// components/tasks/DateTimePicker.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Modal,
} from 'react-native';

// Web-compatible Platform object
const Platform = {
  OS: 'web' as const,
  select: (platforms: { web?: any; default?: any }) => platforms.web || platforms.default
};

interface DateTimePickerProps {
  visible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  mode?: 'date' | 'time' | 'datetime';
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  visible,
  date,
  onConfirm,
  onCancel,
  mode = 'datetime',
}) => {
  const [selectedDate, setSelectedDate] = useState(date);
  const [currentMode, setCurrentMode] = useState<'date' | 'time'>('date');
  const isDarkMode = useColorScheme() === 'dark';

  const themeStyles = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
    textColor: isDarkMode ? '#fff' : '#000',
    subtitleColor: isDarkMode ? '#ccc' : '#666',
    modalBackground: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
  };

  const handleDateChange = (increment: number, type: 'year' | 'month' | 'day' | 'hour' | 'minute') => {
    const newDate = new Date(selectedDate);
    
    switch (type) {
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + increment);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + increment);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + increment);
        break;
      case 'hour':
        newDate.setHours(newDate.getHours() + increment);
        break;
      case 'minute':
        newDate.setMinutes(newDate.getMinutes() + increment);
        break;
    }
    
    setSelectedDate(newDate);
  };

  const formatDisplayDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return selectedDate.toLocaleDateString(undefined, options);
  };

  const formatDisplayTime = () => {
    return selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderDatePicker = () => (
    <View style={styles.pickerContainer}>
      <Text style={[styles.pickerTitle, { color: themeStyles.textColor }]}>
        Select Date
      </Text>
      
      <View style={styles.dateDisplay}>
        <Text style={[styles.dateText, { color: themeStyles.textColor }]}>
          {formatDisplayDate()}
        </Text>
      </View>

      {/* Year */}
      <View style={styles.pickerRow}>
        <Text style={[styles.pickerLabel, { color: themeStyles.textColor }]}>Year</Text>
        <View style={styles.pickerControls}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handleDateChange(-1, 'year')}
          >
            <Text style={styles.pickerButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.pickerValue, { color: themeStyles.textColor }]}>
            {selectedDate.getFullYear()}
          </Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handleDateChange(1, 'year')}
          >
            <Text style={styles.pickerButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Month */}
      <View style={styles.pickerRow}>
        <Text style={[styles.pickerLabel, { color: themeStyles.textColor }]}>Month</Text>
        <View style={styles.pickerControls}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handleDateChange(-1, 'month')}
          >
            <Text style={styles.pickerButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.pickerValue, { color: themeStyles.textColor }]}>
            {selectedDate.toLocaleDateString(undefined, { month: 'short' })}
          </Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handleDateChange(1, 'month')}
          >
            <Text style={styles.pickerButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Day */}
      <View style={styles.pickerRow}>
        <Text style={[styles.pickerLabel, { color: themeStyles.textColor }]}>Day</Text>
        <View style={styles.pickerControls}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handleDateChange(-1, 'day')}
          >
            <Text style={styles.pickerButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.pickerValue, { color: themeStyles.textColor }]}>
            {selectedDate.getDate()}
          </Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handleDateChange(1, 'day')}
          >
            <Text style={styles.pickerButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {mode === 'datetime' && (
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => setCurrentMode('time')}
        >
          <Text style={styles.modeButtonText}>Set Time →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTimePicker = () => (
    <View style={styles.pickerContainer}>
      <Text style={[styles.pickerTitle, { color: themeStyles.textColor }]}>
        Select Time
      </Text>
      
      <View style={styles.dateDisplay}>
        <Text style={[styles.dateText, { color: themeStyles.textColor }]}>
          {formatDisplayTime()}
        </Text>
      </View>

      {/* Hour */}
      <View style={styles.pickerRow}>
        <Text style={[styles.pickerLabel, { color: themeStyles.textColor }]}>Hour</Text>
        <View style={styles.pickerControls}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handleDateChange(-1, 'hour')}
          >
            <Text style={styles.pickerButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.pickerValue, { color: themeStyles.textColor }]}>
            {selectedDate.getHours().toString().padStart(2, '0')}
          </Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handleDateChange(1, 'hour')}
          >
            <Text style={styles.pickerButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Minute */}
      <View style={styles.pickerRow}>
        <Text style={[styles.pickerLabel, { color: themeStyles.textColor }]}>Minute</Text>
        <View style={styles.pickerControls}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handleDateChange(-5, 'minute')}
          >
            <Text style={styles.pickerButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.pickerValue, { color: themeStyles.textColor }]}>
            {selectedDate.getMinutes().toString().padStart(2, '0')}
          </Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handleDateChange(5, 'minute')}
          >
            <Text style={styles.pickerButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {mode === 'datetime' && (
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => setCurrentMode('date')}
        >
          <Text style={styles.modeButtonText}>← Back to Date</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderQuickOptions = () => (
    <View style={styles.quickOptions}>
      <Text style={[styles.quickOptionsTitle, { color: themeStyles.textColor }]}>
        Quick Options
      </Text>
      <View style={styles.quickButtonsRow}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => {
            const today = new Date();
            today.setHours(9, 0, 0, 0);
            setSelectedDate(today);
          }}
        >
          <Text style={styles.quickButtonText}>Today 9 AM</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            setSelectedDate(tomorrow);
          }}
        >
          <Text style={styles.quickButtonText}>Tomorrow 9 AM</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(9, 0, 0, 0);
            setSelectedDate(nextWeek);
          }}
        >
          <Text style={styles.quickButtonText}>Next Week</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: themeStyles.modalBackground }]}>
        <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
          {mode === 'date' || (mode === 'datetime' && currentMode === 'date') 
            ? renderDatePicker() 
            : renderTimePicker()
          }
          
          {renderQuickOptions()}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => onConfirm(selectedDate)}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  dateDisplay: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 16,
    flex: 1,
  },
  pickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  pickerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 16,
    minWidth: 60,
    textAlign: 'center',
  },
  modeButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  modeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  quickOptions: {
    marginBottom: 20,
  },
  quickOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#e6f3ff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DateTimePicker;
