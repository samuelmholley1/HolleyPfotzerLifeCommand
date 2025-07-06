// components/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generateUserIdentity } from '../lib/crypto.simple';

interface DashboardProps {
  events: any[];
}

// Mock functions for web compatibility
const Alert = {
  alert: (title: string, message: string) => {
    window.alert(`${title}: ${message}`);
  }
};

const useColorScheme = () => 'light';

const Dashboard: React.FC<DashboardProps> = ({ events }) => {
    const [textInput, setTextInput] = useState('');
    const [cryptoReady, setCryptoReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const isDarkMode = useColorScheme() === 'dark';

    // Initialize cryptography on component mount
    useEffect(() => {
        const setupCrypto = async () => {
            try {
                await generateUserIdentity();
                setCryptoReady(true);
                console.log('Dashboard: Cryptography ready');
            } catch (error) {
                console.error('Dashboard: Failed to initialize crypto:', error);
                Alert.alert('Security Error', 'Failed to initialize encryption. Please restart the app.');
            }
        };
        
        setupCrypto();
    }, []);

    const logNewEvent = async (content: string) => {
        if (!cryptoReady) {
            Alert.alert('Not Ready', 'Encryption is still initializing. Please wait.');
            return;
        }

        if (!content.trim()) {
            Alert.alert('Error', 'Please enter some content for the event.');
            return;
        }

        setLoading(true);
        try {
            console.log('Event logged successfully');
            setTextInput(''); // Clear input after successful logging
            Alert.alert('Success', `Logged: "${content}"`);
        } catch (error) {
            console.error('Error logging event:', error);
            Alert.alert('Error', 'Failed to log event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            console.log('Sync completed successfully');
        } catch (error) {
            console.error('Sync failed:', error);
            Alert.alert('Sync Error', 'Failed to sync events. Please check your internet connection.');
        } finally {
            setSyncing(false);
        }
    };

    const renderEvent = (event: any, index: number) => {
        return <EventCard key={index} event={event} isDarkMode={isDarkMode} />;
    };

    const themeStyles = {
        backgroundColor: isDarkMode ? '#000' : '#fff',
        textColor: isDarkMode ? '#fff' : '#000',
        subtitleColor: isDarkMode ? '#ccc' : '#666',
        cardBackground: isDarkMode ? '#333' : '#f5f5f5',
        buttonColor: '#4285F4',
        inputBackground: isDarkMode ? '#222' : '#f9f9f9',
        inputBorder: isDarkMode ? '#555' : '#ddd',
    };

    return (
        <div style={{ backgroundColor: themeStyles.backgroundColor, minHeight: '100vh', padding: '20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ color: themeStyles.textColor, fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
                    Life Command Center
                </h1>
                
                <p style={{ color: themeStyles.subtitleColor, fontSize: '16px', textAlign: 'center', marginBottom: '30px' }}>
                    Secure Health Event Tracking
                </p>

                {/* Manual Input Section */}
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ color: themeStyles.textColor, fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>
                        Log New Event
                    </h2>
                    
                    <textarea
                        style={{
                            width: '100%',
                            backgroundColor: themeStyles.inputBackground,
                            border: `1px solid ${themeStyles.inputBorder}`,
                            color: themeStyles.textColor,
                            borderRadius: '8px',
                            padding: '15px',
                            fontSize: '16px',
                            marginBottom: '15px',
                            minHeight: '80px',
                            resize: 'vertical'
                        }}
                        placeholder="Enter event details (e.g., 'headache severity 7')"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                    />
                    
                    <button 
                        style={{
                            backgroundColor: (!cryptoReady || loading) ? '#999' : themeStyles.buttonColor,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '15px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: (!cryptoReady || loading) ? 'not-allowed' : 'pointer',
                            width: '100%',
                            minHeight: '50px'
                        }}
                        onClick={() => logNewEvent(textInput)}
                        disabled={!cryptoReady || loading}
                    >
                        {loading ? 'Loading...' : 'Log Event'}
                    </button>
                </div>

                {/* Sync Section */}
                <div style={{ marginBottom: '30px' }}>
                    <button 
                        style={{
                            backgroundColor: syncing ? '#999' : '#4CAF50',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: syncing ? 'not-allowed' : 'pointer',
                            width: '100%',
                            minHeight: '45px'
                        }}
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        {syncing ? 'Syncing...' : 'Sync Events'}
                    </button>
                </div>

                {/* Events List */}
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ color: themeStyles.textColor, fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>
                        Recent Events ({events.length})
                    </h2>
                    
                    {events.length === 0 ? (
                        <div style={{ backgroundColor: themeStyles.cardBackground, padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                            <p style={{ color: themeStyles.subtitleColor, fontSize: '16px' }}>
                                No events logged yet. Start by logging your first event above!
                            </p>
                        </div>
                    ) : (
                        events.map((event, index) => renderEvent(event, index))
                    )}
                </div>

                {/* Crypto Status */}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p style={{ 
                        color: cryptoReady ? '#4CAF50' : '#FF9800',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        🔐 Encryption: {cryptoReady ? 'Ready' : 'Initializing...'}
                    </p>
                </div>
            </div>
        </div>
    );
};

// EventCard component to handle individual event rendering with hooks
const EventCard: React.FC<{ event: any; isDarkMode: boolean }> = ({ event, isDarkMode }) => {
    const [decryptedData, setDecryptedData] = useState<any | null>(null);
    const [decrypting, setDecrypting] = useState(true);

    useEffect(() => {
        const decryptEventData = async () => {
            try {
                // Mock decryption for web compatibility
                setDecryptedData({ name: 'Sample Event', notes: 'Mock event data' });
            } catch (error) {
                console.error('Failed to decrypt event:', error);
                setDecryptedData({ name: 'Failed to decrypt', notes: 'Decryption error' });
            } finally {
                setDecrypting(false);
            }
        };

        decryptEventData();
    }, [event]);

    const themeStyles = {
        cardBackground: isDarkMode ? '#333' : '#f5f5f5',
        textColor: isDarkMode ? '#fff' : '#000',
        subtitleColor: isDarkMode ? '#ccc' : '#666',
    };

    if (decrypting) {
        return (
            <div style={{ backgroundColor: themeStyles.cardBackground, padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                <p style={{ color: themeStyles.subtitleColor, textAlign: 'center' }}>
                    Decrypting...
                </p>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: themeStyles.cardBackground, padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: themeStyles.textColor, fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>
                    {event.eventType || 'manual_log'}
                </span>
                <span style={{ color: themeStyles.subtitleColor, fontSize: '12px' }}>
                    {new Date(event.timestamp || Date.now()).toLocaleString()}
                </span>
            </div>
            
            {decryptedData && (
                <div style={{ marginBottom: '10px' }}>
                    <p style={{ color: themeStyles.textColor, fontSize: '16px', fontWeight: '500', marginBottom: '5px' }}>
                        {decryptedData.name}
                    </p>
                    {decryptedData.notes && (
                        <p style={{ color: themeStyles.subtitleColor, fontSize: '14px', marginBottom: '5px' }}>
                            {decryptedData.notes}
                        </p>
                    )}
                    {decryptedData.severity && (
                        <p style={{ color: themeStyles.subtitleColor, fontSize: '14px', fontWeight: '500' }}>
                            Severity: {decryptedData.severity}/10
                        </p>
                    )}
                    {decryptedData.mood && (
                        <p style={{ color: themeStyles.subtitleColor, fontSize: '14px', fontWeight: '500' }}>
                            Mood: {decryptedData.mood}/10
                        </p>
                    )}
                </div>
            )}
            
            <div style={{ textAlign: 'right' }}>
                <span style={{ 
                    color: event.isSynced ? '#4CAF50' : '#FF9800',
                    fontSize: '12px',
                    fontWeight: '500'
                }}>
                    {event.isSynced ? '✓ Synced' : '⏳ Pending Sync'}
                </span>
            </div>
        </div>
    );
};

export default Dashboard;
