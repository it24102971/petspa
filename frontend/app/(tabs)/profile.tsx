import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/api';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { SIZES } from '@/constants/spacing';
import { useSidebar } from '@/context/SidebarContext';
import { Image } from 'react-native';

const AUTH_USER_KEY = 'auth:user';
const AUTH_TOKEN_KEY = 'auth:token';

export default function ProfileScreen() {
  const { openSidebar } = useSidebar();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [experience, setExperience] = useState('5');
  const [specialization, setSpecialization] = useState('Dog Grooming');
  const [aboutMe, setAboutMe] = useState('Professional pet groomer with 5 years of experience.');
  const [image, setImage] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFullName(parsedUser.fullName || '');
        setPhoneNumber(parsedUser.phoneNumber || '');
        // For demo purposes, we'll keep the other fields as defaults if they don't exist in user object
        if (parsedUser.experience) setExperience(parsedUser.experience);
        if (parsedUser.specialization) setSpecialization(parsedUser.specialization);
        if (parsedUser.profilePicture) setImage(parsedUser.profilePicture);
      }
    };

    loadUser();
  }, []);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      const response = await fetch(`${API_BASE_URL}/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          experience,
          specialization,
          aboutMe,
          profilePicture: image,
        })
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update profile. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <Pressable onPress={() => setIsEditing(false)} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </Pressable>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.editSection}>
              <Text style={styles.sectionLabel}>Profile Picture</Text>
              <View style={styles.editAvatarContainer}>
                <Pressable onPress={pickImage} style={styles.avatarLarge}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={60} color="#666" />
                  )}
                  <View style={styles.cameraOverlay}>
                    <Ionicons name="camera" size={16} color="#fff" />
                  </View>
                </Pressable>
                <Pressable style={styles.uploadButton} onPress={pickImage}>
                  <Text style={styles.uploadButtonText}>Upload New Photo</Text>
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholder="+94 77 123 4567"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Experience (Years)</Text>
                <TextInput
                  style={styles.input}
                  value={experience}
                  onChangeText={setExperience}
                  keyboardType="numeric"
                  placeholder="5"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Specialization</Text>
                <View style={styles.dropdownContainer}>
                  <Text style={styles.dropdownText}>{specialization}</Text>
                  <Ionicons name="chevron-down" size={20} color="#000" />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>About Me</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={aboutMe}
                  onChangeText={setAboutMe}
                  multiline
                  numberOfLines={4}
                  placeholder="Tell us about yourself..."
                />
              </View>

              <Pressable style={styles.saveChangesButton} onPress={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveChangesText}>Save Changes</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={openSidebar} style={styles.headerButton} hitSlop={15}>
            <Ionicons name="menu-outline" size={28} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable style={styles.headerButton}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Profile Header Card */}
          <View style={styles.profileHeaderCard}>
            <View style={styles.avatarLarge}>
              {image ? (
                <Image source={{ uri: image }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={60} color="#666" />
              )}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </View>
            <Text style={styles.profileName}>{user?.fullName || 'John Groomer'}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#FFD166" />
              <Text style={styles.ratingText}>4.8</Text>
              <Text style={styles.reviewsText}>(12 Reviews)</Text>
            </View>
          </View>

          {/* Info List */}
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={22} color="#000" />
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phoneNumber || '+94 77 123 4567'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={22} color="#000" />
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || 'john@groomer.com'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={22} color="#000" />
              <Text style={styles.infoLabel}>Experience</Text>
              <Text style={styles.infoValue}>{experience} Years</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="paw-outline" size={22} color="#000" />
              <Text style={styles.infoLabel}>Specialization</Text>
              <Text style={styles.infoValue}>{specialization}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={22} color="#000" />
              <Text style={styles.infoLabel}>Availability</Text>
              <Text style={styles.infoValue}>Mon - Sat (9AM - 6PM)</Text>
            </View>
          </View>

          <Pressable style={styles.editProfileButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileHeaderCard: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarLarge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FFD166',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  reviewsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  infoList: {
    marginTop: 20,
    gap: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  editProfileButton: {
    backgroundColor: '#FFD166',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  // Edit Section Styles
  editSection: {
    marginTop: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    marginBottom: 12,
  },
  editAvatarContainer: {
    backgroundColor: '#F8F9FE', // Light blue/gray tint as in ref
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  uploadButton: {
    marginTop: 20,
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFD166',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: '#000',
    fontWeight: '600',
  },
  textArea: {
    height: 90,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  saveChangesButton: {
    backgroundColor: '#FFD166',
    height: SIZES.buttonHeight,
    borderRadius: SIZES.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#FFD166',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveChangesText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A3B2F',
  },
});