import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'reminder' | 'deadline' | 'personal';
}

const Events: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [events] = useState<CalendarEvent[]>([
    { 
      id: '1', 
      title: 'Team Standup', 
      date: '2025-07-02', 
      time: '9:00 AM',
      type: 'meeting'
    },
    { 
      id: '2', 
      title: 'Project Deadline', 
      date: '2025-07-03', 
      time: '5:00 PM',
      type: 'deadline'
    },
    { 
      id: '3', 
      title: 'Lunch with Sarah', 
      date: '2025-07-02', 
      time: '12:30 PM',
      type: 'personal'
    },
    { 
      id: '4', 
      title: 'Review Daily Briefings', 
      date: '2025-07-02', 
      time: '4:00 PM',
      type: 'reminder'
    },
  ]);
  
  const themeStyles = {
    backgroundColor: isDarkMode ? '#000' : '#f0f2f5',
    textColor: isDarkMode ? '#fff' : '#000',
    cardBackground: isDarkMode ? '#1a1a1a' : '#fff',
    borderColor: isDarkMode ? '#333' : '#ddd',
    typeColors: {
      meeting: '#4285F4',
      deadline: '#DB4437',
      reminder: '#F4B400',
      personal: '#0F9D58',
    },
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '👥';
      case 'deadline': return '⏰';
      case 'reminder': return '📝';
      case 'personal': return '🏠';
      default: return '📅';
    }
  };

  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date === today || event.date === '2025-07-02');
  };

  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date > today || event.date === '2025-07-03');
  };

  const todayEvents = getTodayEvents();
  const upcomingEvents = getUpcomingEvents();

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      {/* Header Card */}
      <View style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
        <Text style={[styles.title, { color: themeStyles.textColor }]}>
          🗓️ Events
        </Text>
        <Text style={[styles.subtitle, { color: themeStyles.textColor }]}>
          {todayEvents.length} events today • {upcomingEvents.length} upcoming
        </Text>
      </View>

      {/* Today's Events */}
      <View style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: themeStyles.textColor }]}>
          Today&apos;s Events
        </Text>
        
        {todayEvents.length === 0 ? (
          <Text style={[styles.emptyText, { color: themeStyles.textColor }]}>
            No events scheduled for today
          </Text>
        ) : (
          todayEvents.map((event) => (
            <TouchableOpacity 
              key={event.id} 
              style={[styles.eventItem, { borderColor: themeStyles.borderColor }]}
            >
              <View style={styles.eventLeft}>
                <View style={[
                  styles.eventTypeIndicator,
                  { backgroundColor: themeStyles.typeColors[event.type] }
                ]}>
                  <Text style={styles.eventTypeIcon}>{getTypeIcon(event.type)}</Text>
                </View>
                <View style={styles.eventDetails}>
                  <Text style={[styles.eventTitle, { color: themeStyles.textColor }]}>
                    {event.title}
                  </Text>
                  <Text style={[styles.eventTime, { color: themeStyles.textColor, opacity: 0.7 }]}>
                    {event.time}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.eventTypeBadge,
                { backgroundColor: themeStyles.typeColors[event.type] }
              ]}>
                <Text style={styles.eventTypeText}>{event.type}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Upcoming Events */}
      <View style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: themeStyles.textColor }]}>
          Upcoming Events
        </Text>
        
        {upcomingEvents.length === 0 ? (
          <Text style={[styles.emptyText, { color: themeStyles.textColor }]}>
            No upcoming events
          </Text>
        ) : (
          upcomingEvents.map((event) => (
            <TouchableOpacity 
              key={event.id} 
              style={[styles.eventItem, { borderColor: themeStyles.borderColor }]}
            >
              <View style={styles.eventLeft}>
                <View style={[
                  styles.eventTypeIndicator,
                  { backgroundColor: themeStyles.typeColors[event.type] }
                ]}>
                  <Text style={styles.eventTypeIcon}>{getTypeIcon(event.type)}</Text>
                </View>
                <View style={styles.eventDetails}>
                  <Text style={[styles.eventTitle, { color: themeStyles.textColor }]}>
                    {event.title}
                  </Text>
                  <Text style={[styles.eventTime, { color: themeStyles.textColor, opacity: 0.7 }]}>
                    {new Date(event.date).toLocaleDateString()} • {event.time}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.eventTypeBadge,
                { backgroundColor: themeStyles.typeColors[event.type] }
              ]}>
                <Text style={styles.eventTypeText}>{event.type}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: themeStyles.textColor }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: themeStyles.typeColors.meeting }]}>
            <Text style={styles.quickActionText}>📅 Add Event</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: themeStyles.typeColors.reminder }]}>
            <Text style={styles.quickActionText}>⏰ Set Reminder</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Card */}
      <View style={[styles.card, { backgroundColor: themeStyles.cardBackground }]}>
        <Text style={[styles.infoTitle, { color: themeStyles.textColor }]}>
          📊 About Events
        </Text>
        <Text style={[styles.infoText, { color: themeStyles.textColor }]}>
          This is a demo calendar view. In the full version, events will sync with your calendar apps, send notifications, and integrate with your daily briefings and task management.
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
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventTypeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventTypeIcon: {
    fontSize: 18,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 14,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontWeight: '600',
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
});

export default Events;
