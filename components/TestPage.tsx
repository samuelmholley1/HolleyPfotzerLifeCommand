// Test page to verify core functionality without authentication
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { database, Event } from '../lib/db/index';
import { generateUserIdentity, encryptEvent, decryptEvent } from '../lib/crypto.simple';

const TestPage: React.FC = () => {
    const [textInput, setTextInput] = useState('');
    const [events, setEvents] = useState<Event[]>([]);
    const [cryptoReady, setCryptoReady] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const setupCrypto = async () => {
            try {
                await generateUserIdentity();
                setCryptoReady(true);
                setMessage('Crypto initialized successfully!');
                loadEvents();
            } catch (error) {
                console.error('Crypto setup failed:', error);
                setMessage('Crypto setup failed: ' + error);
            }
        };
        
        setupCrypto();
    }, []);

    const loadEvents = async () => {
        try {
            const allEvents = await database.get<Event>('events').query().fetch();
            setEvents(allEvents);
            setMessage(`Loaded ${allEvents.length} events from database`);
        } catch (error) {
            console.error('Failed to load events:', error);
            setMessage('Failed to load events: ' + error);
        }
    };

    const testCreateEvent = async () => {
        if (!cryptoReady) {
            setMessage('Crypto not ready');
            return;
        }

        if (!textInput.trim()) {
            setMessage('Please enter some text');
            return;
        }

        try {
            const eventData = {
                name: textInput.trim(),
                notes: 'Test event'
            };

            const encryptedPayload = await encryptEvent(eventData);
            if (!encryptedPayload) {
                throw new Error('Encryption failed');
            }

            await database.write(async () => {
                await database.get<Event>('events').create((event) => {
                    event.eventType = 'test';
                    event.timestamp = Date.now();
                    event.encryptedPayload = encryptedPayload;
                    event.isSynced = false;
                    event.createdAt = new Date();
                    event.updatedAt = new Date();
                });
            });

            setTextInput('');
            loadEvents();
            setMessage('Event created successfully!');
        } catch (error) {
            console.error('Failed to create event:', error);
            setMessage('Failed to create event: ' + error);
        }
    };

    const testDecryption = async (event: Event) => {
        try {
            const decrypted = await decryptEvent(event.encryptedPayload);
            setMessage(`Decrypted: ${JSON.stringify(decrypted)}`);
        } catch (error) {
            console.error('Decryption failed:', error);
            setMessage('Decryption failed: ' + error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Life Command Test Page</Text>
            
            <Text style={styles.status}>
                Status: {cryptoReady ? '✅ Ready' : '⏳ Loading...'}
            </Text>
            
            <Text style={styles.message}>{message}</Text>

            <TextInput
                style={styles.input}
                placeholder="Enter test event text"
                value={textInput}
                onChangeText={setTextInput}
            />

            <TouchableOpacity 
                style={[styles.button, !cryptoReady && styles.disabled]}
                onPress={testCreateEvent}
                disabled={!cryptoReady}
            >
                <Text style={styles.buttonText}>Create Test Event</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={loadEvents}>
                <Text style={styles.buttonText}>Reload Events</Text>
            </TouchableOpacity>

            <Text style={styles.subtitle}>Events ({events.length}):</Text>
            
            {events.map((event, index) => (
                <View key={index} style={styles.eventItem}>
                    <Text style={styles.eventText}>
                        {event.eventType} - {new Date(event.timestamp).toLocaleTimeString()}
                    </Text>
                    <TouchableOpacity onPress={() => testDecryption(event)}>
                        <Text style={styles.decryptButton}>Decrypt</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    status: {
        fontSize: 16,
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 5,
        marginBottom: 10,
        alignItems: 'center',
    },
    disabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    eventItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 5,
        marginBottom: 5,
    },
    eventText: {
        flex: 1,
        fontSize: 14,
    },
    decryptButton: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default TestPage;
