import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  StatusBar,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    photo_url: ''
  });
  
  // Refs for scroll and input management
  const scrollViewRef = useRef<ScrollView>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const phoneContainerRef = useRef<View>(null);
  const emailInputRef = useRef<TextInput>(null);
  const emailContainerRef = useRef<View>(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload photos!'
      );
      return false;
    }
    return true;
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      if (user) {
        // Load data from the current user object
        setFormData({
          name: user.name || '',
          surname: user.surname || '',
          email: user.email || '',
          phone: user.phone || '',
          photo_url: '' // Keep for local photo storage, but don't save to DB
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      // Request permission only when user tries to pick an image
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        // Copy the image to app's permanent storage
        const fileName = result.assets[0].uri.split('/').pop();
        const newUri = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.copyAsync({
          from: result.assets[0].uri,
          to: newUri
        });

        setFormData(prev => ({
          ...prev,
          photo_url: newUri
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (!user?.id) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Update user in the database
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Refresh user data in the auth store
      await fetchUser(user.id);

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/profile') }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.replace('/(tabs)/profile');
  };

  const handlePhoneFocus = () => {
    // Use a simpler but more reliable approach
    setTimeout(() => {
      // Scroll to a position that should show the phone field
      scrollViewRef.current?.scrollTo({
        y: 400, // Approximate position of phone field
        animated: true
      });
    }, 200);
    
    // Additional scroll after keyboard animation completes
    setTimeout(() => {
      // More aggressive scroll to ensure visibility
      scrollViewRef.current?.scrollTo({
        y: 500, // Even further down to account for keyboard
        animated: true
      });
    }, 600);
  };

  const handleEmailFocus = () => {
    // Scroll to show email field
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 300, // Position for email field
        animated: true
      });
    }, 200);
    
    // Additional scroll after keyboard animation completes
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 350, // Ensure email field stays visible
        animated: true
      });
    }, 600);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        ref={scrollViewRef}
      >
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.photoContainer}>
          <TouchableOpacity 
            style={styles.photoButton} 
            onPress={handleImagePick}
          >
            {formData.photo_url ? (
              <Image 
                source={{ uri: formData.photo_url }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Icon name="user" size={40} color={Colors.secondaryText} />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Icon name="camera" size={16} color={Colors.background} />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter your name"
            placeholderTextColor={Colors.secondaryText}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Surname</Text>
          <TextInput
            style={styles.input}
            value={formData.surname}
            onChangeText={(text) => setFormData(prev => ({ ...prev, surname: text }))}
            placeholder="Enter your surname"
            placeholderTextColor={Colors.secondaryText}
          />
        </View>

        <View style={styles.formGroup} ref={emailContainerRef}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            placeholder="Enter your email"
            placeholderTextColor={Colors.secondaryText}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            ref={emailInputRef}
            onFocus={handleEmailFocus}
            onSubmitEditing={() => phoneInputRef.current?.focus()}
          />
        </View>

        <View style={styles.formGroup} ref={phoneContainerRef}>
          <Text style={styles.label}>Telephone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            placeholder="Enter your telephone"
            placeholderTextColor={Colors.secondaryText}
            keyboardType="phone-pad"
            returnKeyType="done"
            ref={phoneInputRef}
            onFocus={handlePhoneFocus}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={handleCancel}
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 80, // Reasonable padding for keyboard space
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 30,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoButton: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  photoHint: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: Colors.background,
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
  },
}); 