import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Goal } from '../lib/db/Goal';
import { goalService } from '../services/goalService';
import { GoalListItem } from './GoalListItem';
import { CreateGoalForm } from './CreateGoalForm';
import { useUserWorkspace } from '../hooks/useUserWorkspace';
import { useAuth } from '../contexts/AuthContext';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const isDarkMode = useColorScheme() === 'dark';
  const { user } = useAuth();
  const { workspaceId } = useUserWorkspace();

  const themeStyles = {
    backgroundColor: isDarkMode ? '#000' : '#f0f2f5',
    textColor: isDarkMode ? '#fff' : '#000',
    cardBackground: isDarkMode ? '#1a1a1a' : '#fff',
    subtitleColor: isDarkMode ? '#ccc' : '#666',
    errorColor: '#FF6B6B',
    emptyStateColor: isDarkMode ? '#666' : '#999',
  };

  const loadGoals = useCallback(async () => {
    if (!user?.id || !workspaceId) {
      setError('No user or workspace found');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      
      // Call our hardened goalService to fetch goals
      const fetchedGoals = await goalService.getGoalsForWorkspace(workspaceId);
      
      // Sort by creation date (newest first) for consistent ordering
      const sortedGoals = fetchedGoals.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setGoals(sortedGoals);
    } catch (err) {
      console.error('Error loading goals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, workspaceId]);

  // Load goals on component mount and when workspace changes
  useEffect(() => {
    loadGoals();
  }, [user?.id, workspaceId, loadGoals]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadGoals();
  };

  // This is the ONLY place that calls goalService.createGoal()
  // Single source of truth for goal creation
  const handleCreateGoal = async (formData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'health' | 'career' | 'financial' | 'personal' | 'relationships' | 'learning';
    hasTargetDate: boolean;
    targetDate: Date | null;
    tags: string[];
  }) => {
    if (!user?.id || !workspaceId) {
      Alert.alert('Error', 'No user or workspace found');
      return;
    }

    try {
      setCreating(true);
      
      // Call our hardened goalService
      const newGoal = await goalService.createGoal({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        targetDate: formData.hasTargetDate && formData.targetDate 
          ? formData.targetDate.getTime() 
          : undefined,
        tags: formData.tags,
        workspaceId,
      });

      // Success: Close form and refresh goals list
      setShowCreateForm(false);
      await loadGoals(); // Refresh the list to show new goal
      
      Alert.alert('Success', 'Goal created successfully!');
    } catch (err) {
      console.error('Error creating goal:', err);
      
      // Show user-friendly error message
      const errorMessage = err instanceof Error ? err.message : 'Failed to create goal';
      Alert.alert('Error Creating Goal', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const renderGoal = ({ item }: { item: Goal }) => (
    <GoalListItem goal={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: themeStyles.emptyStateColor }]}>
        No goals yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: themeStyles.emptyStateColor }]}>
        Create your first goal to start tracking your progress
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: themeStyles.cardBackground }]}>
      <View style={styles.headerContent}>
        <View>
          <Text style={[styles.title, { color: themeStyles.textColor }]}>
            🎯 Goals
          </Text>
          <Text style={[styles.subtitle, { color: themeStyles.subtitleColor }]}>
            {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: '#4285F4' }]}
          onPress={() => setShowCreateForm(true)}
        >
          <Text style={styles.createButtonText}>+ Create Goal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: themeStyles.backgroundColor }]}>
        <ActivityIndicator size="large" color={themeStyles.subtitleColor} />
        <Text style={[styles.loadingText, { color: themeStyles.subtitleColor }]}>
          Loading goals...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: themeStyles.backgroundColor }]}>
        <Text style={[styles.errorTitle, { color: themeStyles.errorColor }]}>
          ⚠️ Error Loading Goals
        </Text>
        <Text style={[styles.errorText, { color: themeStyles.textColor }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={(item: any) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={themeStyles.subtitleColor}
          />
        }
        contentContainerStyle={goals.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Goal Modal */}
      <Modal
        visible={showCreateForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateForm(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowCreateForm(false)}
              disabled={creating}
            >
              <Text style={[styles.modalCancelText, { 
                color: creating ? themeStyles.subtitleColor : '#007AFF' 
              }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: themeStyles.textColor }]}>
              Create New Goal
            </Text>
            
            <View style={styles.modalSpacer} />
          </View>
          
          <CreateGoalForm 
            onSubmit={handleCreateGoal}
            loading={creating}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSpacer: {
    width: 60, // Same width as cancel button to center title
  },
});

export default GoalsPage;
