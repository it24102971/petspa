import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Image, ActivityIndicator, Alert, TextInput, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '@/constants/api';
import { StatusBar } from 'expo-status-bar';

const AUTH_USER_KEY = "auth:user";
const AUTH_TOKEN_KEY = "auth:token";

const getImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${url}`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    aboutMe: '',
    experience: '',
    specialization: '',
  });

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setFormData({
          fullName: parsed.fullName || '',
          email: parsed.email || '',
          phoneNumber: parsed.phoneNumber || '',
          address: parsed.address || '',
          aboutMe: parsed.aboutMe || '',
          experience: parsed.experience || '',
          specialization: parsed.specialization || '',
        });
      }
    } catch (error) {
      console.error("Load user failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
        setUser(data);
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("Error", data.message || "Update failed");
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to server");
    } finally {
      setUpdating(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const formData = new FormData();
      
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('profilePicture', {
        uri,
        name: `profile.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      const response = await fetch(`${API_BASE_URL}/auth/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
        Alert.alert("Success", "Profile picture updated!");
      } else {
        Alert.alert("Error", data.message || "Upload failed");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not upload image");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD166" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>Manage your personal information</Text>
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} disabled={updating}>
            <View style={styles.avatarContainer}>
              {user?.profilePicture ? (
                <Image source={{ uri: getImageUrl(user.profilePicture) || '' }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={50} color="#1A3B2F" />
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              placeholder="Enter your name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.email}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              placeholder="e.g. +94 77 123 4567"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, { height: 80, paddingTop: 12 }]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Enter your address"
              multiline
            />
          </View>

          {user?.role === 'groomer' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Specialization</Text>
                <TextInput
                  style={styles.input}
                  value={formData.specialization}
                  onChangeText={(text) => setFormData({ ...formData, specialization: text })}
                  placeholder="e.g. Cat Grooming, Large Dogs"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Years of Experience</Text>
                <TextInput
                  style={styles.input}
                  value={formData.experience}
                  onChangeText={(text) => setFormData({ ...formData, experience: text })}
                  placeholder="e.g. 5 years"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>About Me</Text>
                <TextInput
                  style={[styles.input, { height: 100, paddingTop: 12 }]}
                  value={formData.aboutMe}
                  onChangeText={(text) => setFormData({ ...formData, aboutMe: text })}
                  placeholder="Tell customers about yourself"
                  multiline
                />
              </View>
            </>
          )}

          <TouchableOpacity 
            style={[styles.saveButton, updating && styles.disabledButton]} 
            onPress={handleUpdateProfile}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#1A3B2F" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FAF5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '900', color: '#1A3B2F', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: 'rgba(26, 59, 47, 0.6)', marginTop: 4, fontWeight: '600' },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { width: 120, height: 120, borderRadius: 40, backgroundColor: '#fff', position: 'relative', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  avatar: { width: '100%', height: '100%', borderRadius: 40 },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  editBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#1A3B2F', width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#F0FAF5' },
  roleText: { marginTop: 16, fontSize: 11, fontWeight: '900', color: '#1A3B2F', backgroundColor: '#FFD166', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, letterSpacing: 1 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '800', color: '#1A3B2F', marginLeft: 4 },
  input: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1A3B2F', borderWidth: 1, borderColor: 'rgba(26, 59, 47, 0.05)' },
  disabledInput: { backgroundColor: '#f5f5f5', color: '#999' },
  saveButton: { backgroundColor: '#FFD166', height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 20, shadowColor: '#FFD166', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { fontSize: 16, fontWeight: '900', color: '#1A3B2F' },
  disabledButton: { opacity: 0.7 },
});
