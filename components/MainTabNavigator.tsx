// components/MainTabNavigator.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Image,
  Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUserWorkspace } from '../hooks/useUserWorkspace';
import { ProfileMenu } from './ProfileMenu';
import DailyBriefing from './DailyBriefing';
import TaskList from './TaskList';
import Events from './Events';

// Web-compatible components
const SafeAreaView = View;
const TouchableWithoutFeedback = TouchableOpacity;
import { GoalsPage } from './GoalsPage';
import { CircuitBreakerPanel } from './CircuitBreakerPanel';
import { CommunicationDashboard } from './CommunicationDashboard';

type TabName = 'briefing' | 'events' | 'tasks' | 'goals' | 'communication';

export const MainTabNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('briefing');
  const [showEmergencyBreaker, setShowEmergencyBreaker] = useState(false);
  const { user } = useAuth();
  const { workspaceId: currentWorkspaceId, loading, error } = useUserWorkspace();
  const isDarkMode = useColorScheme() === 'dark';

  const themeStyles = {
    backgroundColor: isDarkMode ? '#000' : '#fff',
    textColor: isDarkMode ? '#fff' : '#000',
    tabBarColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
    activeTabColor: '#4285F4',
    inactiveTabColor: isDarkMode ? '#666' : '#999',
    menuBackgroundColor: isDarkMode ? '#2c2c2e' : '#fff',
    menuTextColor: isDarkMode ? '#fff' : '#000',
  };

  const handleEmergencyReset = () => {
    setShowEmergencyBreaker(false);
    // Add emergency reset logic here
  };

  const handleTimeOut = (minutes: number) => {
    setShowEmergencyBreaker(false);
    // Add timeout logic here
  };

  const handleMediatedDiscussion = () => {
    setShowEmergencyBreaker(false);
    // Add mediated discussion logic here
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeStyles.textColor }]}>
            Loading workspace...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <View style={styles.headerRight}>
            {/* ProfileMenu removed from error state - will be handled by main container */}
          </View>
        </View>
        <ProfileMenu />
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            Error loading workspace: {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentWorkspaceId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <View style={styles.headerRight}>
            {/* ProfileMenu removed from no workspace state - will be handled by main container */}
          </View>
        </View>
        <ProfileMenu />
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            No workspace found. Please try signing out and back in.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderTabButton = (tabName: TabName, label: string, icon: string) => {
    const isActive = activeTab === tabName;
    return (
      <TouchableOpacity
        key={tabName}
        style={[
          styles.tabButton,
          isActive && { borderBottomColor: themeStyles.activeTabColor },
        ]}
        onPress={() => setActiveTab(tabName)}
        accessibilityRole="tab"
        accessibilityLabel={`${label} tab`}
        accessibilityState={{ selected: isActive }}
        accessibilityHint={`Switches to ${label} section`}
      >
        <Text style={styles.tabIcon}>{icon}</Text>
        <Text
          style={[
            styles.tabLabel,
            {
              color: isActive ? themeStyles.activeTabColor : themeStyles.inactiveTabColor,
              fontWeight: isActive ? '600' : '400',
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'briefing':
        return <DailyBriefing />;
      case 'events':
        return <Events />;
      case 'tasks':
        return <TaskList />;
      case 'goals':
        return <GoalsPage />;
      case 'communication':
        return <CommunicationDashboard workspaceId={currentWorkspaceId!} />;
      default:
        return <DailyBriefing />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#333' : '#e0e0e0' }]}>
        <View style={styles.headerLeft}>
          {/* You can add a logo or title here */}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={() => setShowEmergencyBreaker(true)}
          >
            <Text style={styles.emergencyButtonText}>🚨</Text>
          </TouchableOpacity>
          {/* ProfileMenu removed from header - using absolute positioning now */}
        </View>
      </View>
      
      {/* Single ProfileMenu with absolute positioning - always on top */}
      <ProfileMenu />
      
      <View style={styles.tabBar}>
        {renderTabButton('briefing', 'Briefing', '☀️')} 
        {renderTabButton('goals', 'Goals', '🎯')}
        {renderTabButton('tasks', 'Tasks', '📋')}
        {renderTabButton('events', 'Events', '🗓️')}
        {renderTabButton('communication', 'Circuit Breaker', '🚨')}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderActiveTab()}
      </View>

      {/* Emergency Circuit Breaker Modal */}
      {showEmergencyBreaker && (
        <Modal transparent animationType="fade">
          <View style={styles.emergencyModal}>
            <CircuitBreakerPanel
              onEmergencyReset={handleEmergencyReset}
              onTimeOut={handleTimeOut}
              onMediatedDiscussion={handleMediatedDiscussion}
            />
            <TouchableOpacity 
              style={styles.modalCloseArea}
              onPress={() => setShowEmergencyBreaker(false)}
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 60, // Standard header height
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  tabBar: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  tabLabel: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  emergencyButton: {
    padding: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    marginRight: 10,
    minWidth: 36,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 0,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    fontSize: 18,
    color: '#FF3B30',
  },
  modalContent: {
    marginTop: 10,
  },
});
