import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Switch,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';
import * as FileSystem from 'expo-file-system';

export default function ProfileScreen() {
  const { user, logout, session } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  
  // Initialize form data from user profile
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    photo_url: user?.photo_url || '',
  });

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        photo_url: user.photo_url || '',
      });
    }
  }, [user]);

  const [profileData, setProfileData] = useState({
    name: '',
    surname: '',
    email: '',
    telephone: '',
    photoUri: ''
  });

  const loadProfile = async () => {
    try {
      const fileUri = `${FileSystem.documentDirectory}profile.json`;
      const fileExists = await FileSystem.getInfoAsync(fileUri);
      
      if (fileExists.exists) {
        const content = await FileSystem.readAsStringAsync(fileUri);
        const savedData = JSON.parse(content);
        setProfileData(savedData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Load profile data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              setIsLoading(true);
              await logout();
              // Navigate to login screen after successful logout
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleEditProfile = () => {
    if (!user) return;
    
    // Navigate to edit profile screen with current user data
    router.push({
      pathname: '../edit-profile',
      params: {
        userId: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        photo_url: user.photo_url || ''
      }
    });
  };

  if (!user?.id) {
    return null; // or a loading spinner
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {profileData.photoUri ? (
              <Image 
                source={{ uri: profileData.photoUri }} 
                style={styles.profileImage} 
              />
            ) : user?.photo_url ? (
              <Image 
                source={{ uri: user.photo_url }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>
                  {profileData.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleEditProfile}
            >
              <Icon name="camera" size={16} color={Colors.background} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>
            {profileData.name && profileData.surname 
              ? `${profileData.name} ${profileData.surname}`
              : user?.name || 'User'}
          </Text>
          <Text style={styles.profileEmail}>{profileData.email || user?.email || 'user@example.com'}</Text>
          {profileData.telephone && (
            <Text style={styles.profilePhone}>{profileData.telephone}</Text>
          )}
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(51, 102, 255, 0.1)' }]}>
                <Icon name="user" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.menuItemText}>Personal Information</Text>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.secondaryText} />
          </View>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(0, 208, 156, 0.1)' }]}>
                <Icon name="credit-card" size={18} color={Colors.secondary} />
              </View>
              <Text style={styles.menuItemText}>Payment Methods</Text>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.secondaryText} />
          </View>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(255, 185, 70, 0.1)' }]}>
                <Icon name="mail" size={18} color="#FFB946" />
              </View>
              <Text style={styles.menuItemText}>Email Preferences</Text>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.secondaryText} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(136, 90, 248, 0.1)' }]}>
                <Icon name="bell" size={18} color="#885AF8" />
              </View>
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: Colors.border, true: `${Colors.primary}80` }}
              thumbColor={notifications ? Colors.primary : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(75, 85, 99, 0.1)' }]}>
                <Icon name="moon" size={18} color="#4B5563" />
              </View>
              <Text style={styles.menuItemText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: Colors.border, true: `${Colors.primary}80` }}
              thumbColor={darkMode ? Colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(255, 92, 92, 0.1)' }]}>
                <Icon name="shield" size={18} color="#FF5C5C" />
              </View>
              <Text style={styles.menuItemText}>Security Settings</Text>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.secondaryText} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(51, 102, 255, 0.1)' }]}>
                <Icon name="help-circle" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.secondaryText} />
          </View>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(75, 85, 99, 0.1)' }]}>
                <Icon name="settings" size={18} color="#4B5563" />
              </View>
              <Text style={styles.menuItemText}>App Settings</Text>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.secondaryText} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('../subscription')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(255, 185, 70, 0.1)' }]}>
                <Icon name="star" size={18} color="#FFB946" />
              </View>
              <Text style={styles.menuItemText}>Manage Subscription</Text>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.secondaryText} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, isLoading && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FF5C5C" style={styles.logoutLoading} />
          ) : (
            <Icon name="log-out" size={18} color="#FF5C5C" />
          )}
          <Text style={[styles.logoutButtonText, isLoading && styles.logoutButtonTextDisabled]}>
            {isLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 36,
    fontWeight: '600',
    color: Colors.background,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 16,
  },
  profilePhone: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 16,
  },
  editProfileButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(51, 102, 255, 0.1)',
    borderRadius: Theme.borderRadius.md,
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
    paddingVertical: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF5C5C',
    marginLeft: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutLoading: {
    marginRight: 8,
  },
  logoutButtonTextDisabled: {
    opacity: 0.8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.secondaryText,
    marginBottom: 24,
  },
});