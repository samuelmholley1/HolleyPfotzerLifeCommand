import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Event, EventDataType } from '../lib/db/index';
import { decryptEvent } from '../lib/crypto.simple';

interface EventCardProps {
    event: Event;
    index: number;
    isDarkMode: boolean;
    styles: any;
}

export const EventCard: React.FC<EventCardProps> = ({ event, index, isDarkMode, styles }) => {
    const [decryptedData, setDecryptedData] = useState<EventDataType | null>(null);
    const [decrypting, setDecrypting] = useState(true);

    useEffect(() => {
        const decryptEventData = async () => {
            try {
                const data = await decryptEvent(event.encryptedPayload);
                setDecryptedData(data as EventDataType);
            } catch (error) {
                console.error('Failed to decrypt event:', error);
                setDecryptedData({ name: 'Failed to decrypt', notes: 'Decryption error' });
            } finally {
                setDecrypting(false);
            }
        };

        decryptEventData();
    }, [event.encryptedPayload]);

    const themeStyles = {
        cardBackground: isDarkMode ? '#333' : '#f5f5f5',
        textColor: isDarkMode ? '#fff' : '#000',
        subtitleColor: isDarkMode ? '#ccc' : '#666',
    };

    if (decrypting) {
        return (
            <View key={index} style={[styles.eventCard, { backgroundColor: themeStyles.cardBackground }]}>
                <ActivityIndicator size="small" color={themeStyles.textColor} />
                <Text style={[styles.eventDecrypting, { color: themeStyles.subtitleColor }]}>
                    Decrypting...
                </Text>
            </View>
        );
    }

    return (
        <View key={index} style={[styles.eventCard, { backgroundColor: themeStyles.cardBackground }]}>
            <View style={styles.eventHeader}>
                <Text style={[styles.eventType, { color: themeStyles.textColor }]}>
                    {event.eventType}
                </Text>
                <Text style={[styles.eventTime, { color: themeStyles.subtitleColor }]}>
                    {new Date(event.timestamp).toLocaleString()}
                </Text>
            </View>
            
            {decryptedData && (
                <View style={styles.eventContent}>
                    <Text style={[styles.eventName, { color: themeStyles.textColor }]}>
                        {decryptedData.name}
                    </Text>
                    {decryptedData.notes && (
                        <Text style={[styles.eventNotes, { color: themeStyles.subtitleColor }]}>
                            {decryptedData.notes}
                        </Text>
                    )}
                    {decryptedData.severity && (
                        <Text style={[styles.eventSeverity, { color: themeStyles.subtitleColor }]}>
                            Severity: {decryptedData.severity}/10
                        </Text>
                    )}
                    {decryptedData.mood && (
                        <Text style={[styles.eventMood, { color: themeStyles.subtitleColor }]}>
                            Mood: {decryptedData.mood}/10
                        </Text>
                    )}
                </View>
            )}
            
            <View style={styles.eventFooter}>
                <Text style={[styles.syncStatus, { 
                    color: event.isSynced ? '#4CAF50' : '#FF9800' 
                }]}>
                    {event.isSynced ? '✓ Synced' : '⏳ Pending Sync'}
                </Text>
            </View>
        </View>
    );
};
