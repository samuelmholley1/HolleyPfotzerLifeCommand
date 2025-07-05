import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Goal } from '../lib/db/Goal';

interface GoalListItemProps {
  goal: Goal;
}

export const GoalListItem: React.FC<GoalListItemProps> = ({ goal }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'paused':
        return '#FF9800';
      case 'not_started':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{goal.title}</Text>
        <View style={styles.indicators}>
          <Text style={styles.priority}>{getPriorityIndicator(goal.priority)}</Text>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(goal.status) }]} />
        </View>
      </View>
      
      {goal.description && (
        <Text style={styles.description} numberOfLines={2}>
          {goal.description}
        </Text>
      )}
      
      <View style={styles.footer}>
        <Text style={[styles.status, { color: getStatusColor(goal.status) }]}>
          {goal.status.replace('_', ' ').toUpperCase()}
        </Text>
        
        {goal.completionPercentage !== undefined && (
          <Text style={styles.progress}>
            {goal.completionPercentage}%
          </Text>
        )}
        
        {goal.category && (
          <Text style={styles.category}>
            {goal.category}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priority: {
    fontSize: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  progress: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  category: {
    fontSize: 12,
    color: '#888888',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

export default GoalListItem;
