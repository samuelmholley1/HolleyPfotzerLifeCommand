// HolleyPfotzerLifeCommand/components/ProfileMenuFix.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Image,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useUserWorkspace } from '../hooks/useUserWorkspace';

export const ProfileMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const { workspaceId } = useUserWorkspace();
  const isDarkMode = useColorScheme() === 'dark';
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [workspaceModalVisible, setWorkspaceModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  // Image handling state with useRef to prevent re-rendering loop
  const [imageError, setImageError] = useState(false);
  const imageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageLoadAttemptedRef = useRef(false);
  const alternativeImageTriedRef = useRef(false);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current);
      }
    };
  }, []);

  // Web-specific image loading handler
  const handleImageLoad = () => {
    // Only log once to reduce console spam
    if (!imageLoadAttemptedRef.current) {
      console.log('🎉 Profile image loaded successfully!');
    }
    setImageError(false);
    
    // Clear any existing timeout
    if (imageTimeoutRef.current) {
      clearTimeout(imageTimeoutRef.current);
      imageTimeoutRef.current = null;
    }
    
    imageLoadAttemptedRef.current = true;
  };

  const handleImageLoadStart = () => {
    // Only log once to reduce console spam
    if (!imageLoadAttemptedRef.current) {
      console.log('🔄 Profile image loading started...');
    }
    
    // Clear any existing timeout
    if (imageTimeoutRef.current) {
      clearTimeout(imageTimeoutRef.current);
    }
    
    // Set a timeout to fallback to initials if image takes too long
    imageTimeoutRef.current = setTimeout(() => {
      if (!imageLoadAttemptedRef.current) {
        console.log('⏰ Profile image loading timed out, using fallback');
      }
      setImageError(true);
    }, 5000); // 5 second timeout
    
    imageLoadAttemptedRef.current = true;
  };

  const handleImageError = (error: any) => {
    console.log('❌ Profile image failed to load:', error?.nativeEvent?.error || 'Unknown error');
    setImageError(true);
    
    // Clear any existing timeout
    if (imageTimeoutRef.current) {
      clearTimeout(imageTimeoutRef.current);
      imageTimeoutRef.current = null;
    }
    
    // Prevent further attempts
    imageLoadAttemptedRef.current = true;
  };

  // Get user information
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';
  const displayName = user?.name || 'User';
  
  // Process avatar URL for Google profiles to ensure it works
  const getProcessedAvatarUrl = (url?: string) => {
    if (!url) return '';
    
    // For Google profile pictures, use a more reliable format
    if (url.includes('googleusercontent.com')) {
      // Add parameters that make it more likely to load
      if (!url.includes('c-k-no')) {
        return url + '-k-no';
      }
    }
    return url;
  };
  
  const getBackupAvatarUrl = (url?: string) => {
    if (!url) return '';
    
    // Try different format for Google profile pictures
    if (url.includes('googleusercontent.com')) {
      // Extract the base URL and try a different format
      const baseUrl = url.split('=')[0];
      return baseUrl ? `${baseUrl}=s96-rp-mo` : '';
    }
    return '';
  };
  
  const avatarUrl = getProcessedAvatarUrl(user?.avatar_url ?? undefined);
  
  // Handle invites
  const handleInvitePartner = () => {
    setMenuVisible(false);
    setInviteModalVisible(true);
  };

  // Handle sign out
  const handleSignOut = () => {
    // Close the menu first
    setMenuVisible(false);
    
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Signing out user...');
              await signOut();
              console.log('✅ Sign out successful');
              // Force reload the page on web
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            } catch (error) {
              console.error('❌ Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const themeStyles = {
    backgroundColor: isDarkMode ? '#1A1A1A' : '#F9F9F9',
    textColor: isDarkMode ? '#FFFFFF' : '#333333',
    menuBackgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    borderColor: isDarkMode ? '#444444' : '#E0E0E0',
    modalHeaderColor: isDarkMode ? '#333333' : '#F5F5F5',
    cardColor: isDarkMode ? '#3A3A3A' : '#FFFFFF',
    dangerColor: isDarkMode ? '#FF6B6B' : '#FF3B30',
  };
  
  const menuItems = [
    { 
      title: 'My Profile', 
      icon: '👤', 
      onPress: () => {
        setMenuVisible(false);
        setProfileModalVisible(true);
      }
    },
    { 
      title: 'Workspace Settings', 
      icon: '🏢', 
      onPress: () => {
        setMenuVisible(false);
        setWorkspaceModalVisible(true);
      }
    },
    { 
      title: 'Invite Partner', 
      icon: '👥', 
      onPress: handleInvitePartner
    },
    { 
      title: 'Help & Support', 
      icon: '❓', 
      onPress: () => {
        setMenuVisible(false);
        setHelpModalVisible(true);
      }
    },
    { 
      title: 'Sign Out', 
      icon: '🚪', 
      onPress: handleSignOut,
      isDangerous: true
    },
  ];

  return (
    <>
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => {
          console.log('ProfileMenu button clicked - Opening menu');
          setMenuVisible(true);
        }}
        activeOpacity={0.6}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        testID="profile-menu-button"
      >
        <View style={{ position: 'relative' }}>
          {avatarUrl && !imageError ? (
            <Image 
              source={{ uri: avatarUrl }} 
              style={styles.profileImage}
              onError={handleImageError}
              onLoad={handleImageLoad}
              onLoadStart={handleImageLoadStart}
              resizeMode="cover"
              testID="profile-image"
              alt=""
            />
          ) : (
            <View style={[
              styles.profilePlaceholder, 
              { 
                backgroundColor: isDarkMode ? '#4A90E2' : '#007AFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
                elevation: 5,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }
            ]}>
              <Text style={styles.profileText}>{userInitial}</Text>
            </View>
          )}
          <View style={styles.onlineIndicator} />
        </View>
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableOpacity>
        
        <View style={[styles.menuContainer, { backgroundColor: themeStyles.menuBackgroundColor }]}>
          <View style={[styles.menuHeader, { borderBottomColor: themeStyles.borderColor }]}>
            <Text style={[styles.menuHeaderText, { color: themeStyles.textColor }]}>
              {displayName}
            </Text>
          </View>
          
          <View style={styles.menuItems}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                <Text 
                  style={[
                    styles.menuItemText, 
                    { color: item.isDangerous ? themeStyles.dangerColor : themeStyles.textColor }
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: themeStyles.backgroundColor }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeStyles.modalHeaderColor }]}>
            <Text style={[styles.modalHeaderText, { color: themeStyles.textColor }]}>My Profile</Text>
            <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={[styles.profileCard, { backgroundColor: themeStyles.cardColor, borderColor: themeStyles.borderColor }]}>
              <View style={styles.profileCardHeader}>
                {avatarUrl && !imageError ? (
                  <Image source={{ uri: avatarUrl }} style={styles.profileCardImage} alt="" />
                ) : (
                  <View style={[styles.profileCardPlaceholder, { backgroundColor: isDarkMode ? '#4A90E2' : '#007AFF' }]}>
                    <Text style={styles.profileCardInitial}>{userInitial}</Text>
                  </View>
                )}
                <View style={styles.profileCardInfo}>
                  <Text style={[styles.profileCardName, { color: themeStyles.textColor }]}>{displayName}</Text>
                  <Text style={styles.profileCardEmail}>{user?.email}</Text>
                </View>
              </View>
              
              <View style={[styles.profileCardDivider, { backgroundColor: themeStyles.borderColor }]} />
              
              <View style={styles.profileCardSection}>
                <Text style={[styles.profileCardSectionTitle, { color: themeStyles.textColor }]}>Account Information</Text>
                <Text style={styles.profileCardDetail}>Member since: {new Date(user?.created_at || Date.now()).toLocaleDateString()}</Text>
                <Text style={styles.profileCardDetail}>Sign-in method: {user?.provider === 'google' ? 'Google' : 'Email'}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Workspace Modal */}
      <Modal
        visible={workspaceModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setWorkspaceModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: themeStyles.backgroundColor }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeStyles.modalHeaderColor }]}>
            <Text style={[styles.modalHeaderText, { color: themeStyles.textColor }]}>Workspace Settings</Text>
            <TouchableOpacity onPress={() => setWorkspaceModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={[styles.profileCard, { backgroundColor: themeStyles.cardColor, borderColor: themeStyles.borderColor }]}>
              <Text style={[styles.profileCardSectionTitle, { color: themeStyles.textColor }]}>Current Workspace</Text>
              <Text style={styles.profileCardDetail}>Workspace ID: {workspaceId || 'None'}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal
        visible={helpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: themeStyles.backgroundColor }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeStyles.modalHeaderColor }]}>
            <Text style={[styles.modalHeaderText, { color: themeStyles.textColor }]}>Help & Support</Text>
            <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={[styles.profileCard, { backgroundColor: themeStyles.cardColor, borderColor: themeStyles.borderColor }]}>
              <Text style={[styles.profileCardSectionTitle, { color: themeStyles.textColor }]}>Getting Started</Text>
              <Text style={styles.helpText}>Welcome to Life Command! This app helps you manage your goals and projects.</Text>
              
              <View style={[styles.profileCardDivider, { backgroundColor: themeStyles.borderColor }]} />
              
              <Text style={[styles.profileCardSectionTitle, { color: themeStyles.textColor }]}>Contact Support</Text>
              <Text style={styles.helpText}>If you need assistance, please contact support@lifecommand.app</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Invite Modal */}
      <Modal
        visible={inviteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: themeStyles.backgroundColor }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeStyles.modalHeaderColor }]}>
            <Text style={[styles.modalHeaderText, { color: themeStyles.textColor }]}>Invite Partner</Text>
            <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={[styles.profileCard, { backgroundColor: themeStyles.cardColor, borderColor: themeStyles.borderColor }]}>
              <Text style={[styles.profileCardSectionTitle, { color: themeStyles.textColor }]}>Invite Team Members</Text>
              <Text style={styles.helpText}>You can invite partners to collaborate with you in this workspace.</Text>
              
              <View style={styles.inviteForm}>
                <Text style={[styles.inviteFormLabel, { color: themeStyles.textColor }]}>Email Address</Text>
                <View style={[styles.inviteFormInput, { borderColor: themeStyles.borderColor }]}>
                  <Text style={{ color: themeStyles.textColor }}>partner@example.com</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.inviteButton, { backgroundColor: isDarkMode ? '#4A90E2' : '#007AFF' }]}
                  onPress={() => {
                    Alert.alert('Invite Sent', 'An invitation has been sent to the email address.');
                    setInviteModalVisible(false);
                  }}
                >
                  <Text style={styles.inviteButtonText}>Send Invitation</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 70,
    right: 20,
    width: 200,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    padding: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  menuHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuItems: {
    padding: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 24,
    color: '#888',
  },
  modalContent: {
    flex: 1,
    padding: 15,
  },
  profileCard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileCardImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileCardPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCardInitial: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  profileCardInfo: {
    marginLeft: 15,
  },
  profileCardName: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileCardEmail: {
    fontSize: 14,
    color: '#888',
  },
  profileCardDivider: {
    height: 1,
    marginVertical: 15,
  },
  profileCardSection: {
    marginBottom: 15,
  },
  profileCardSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  profileCardDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  inviteForm: {
    marginTop: 15,
  },
  inviteFormLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  inviteFormInput: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
  },
  inviteButton: {
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
