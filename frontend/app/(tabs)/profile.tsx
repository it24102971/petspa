import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable,
  ActivityIndicator, Image, Alert, TextInput, Platform, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';
import { StatusBar } from 'expo-status-bar';
import { useSidebar } from '@/context/SidebarContext';

const AUTH_USER_KEY = "auth:user";
const AUTH_TOKEN_KEY = "auth:token";

const getImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${url}`;
};

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { openSidebar } = useSidebar();
  const router = useRouter();

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
          setFullName(parsed.fullName || '');
          setEmail(parsed.email || '');
          setPhone(parsed.phoneNumber || '');
          setAddress(parsed.address || '');
        }
      } catch (error) {
        console.error("Fetch profile error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('phone', phone);
      formData.append('address', address);

      if (image) {
        formData.append('profilePicture', {
          uri: image.uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        } as any);
      }

      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const updatedUser = await res.json();
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        const data = await res.json();
        Alert.alert("Error", data.message || "Failed to update profile.");
      }
    } catch (error) {
      Alert.alert("Error", "Network request failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFD166" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={openSidebar} style={styles.menuButton} hitSlop={15}>
              <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
            </Pressable>
            <View>
              <Text style={styles.title}>My Profile</Text>
              <Text style={styles.subtitle}>Manage your account</Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <Pressable style={styles.avatarWrapper} onPress={handlePickImage}>
                {image || user?.profilePicture ? (
                  <Image source={{ uri: image ? image.uri : getImageUrl(user?.profilePicture) || '' }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={60} color="#1A3B2F" />
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={18} color="#ffffff" />
                </View>
              </Pressable>
              <Text style={styles.roleText}>{(user?.role || 'Customer').toUpperCase()}</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="rgba(26,59,47,0.4)" />
                  <TextInput 
                    style={styles.input} 
                    value={fullName} 
                    onChangeText={setFullName} 
                    placeholder="John Doe" 
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, styles.disabledInput]}>
                  <Ionicons name="mail-outline" size={20} color="rgba(26,59,47,0.2)" />
                  <TextInput 
                    style={[styles.input, { color: 'rgba(26,59,47,0.3)' }]} 
                    value={email} 
                    editable={false} 
                  />
                </View>
                <Text style={styles.helperText}>Email cannot be changed.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="rgba(26,59,47,0.4)" />
                  <TextInput 
                    style={styles.input} 
                    value={phone} 
                    onChangeText={setPhone} 
                    placeholder="+1 234 567 890" 
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Home Address</Text>
                <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 14 }]}>
                  <Ionicons name="location-outline" size={20} color="rgba(26,59,47,0.4)" />
                  <TextInput 
                    style={[styles.input, styles.textArea]} 
                    value={address} 
                    onChangeText={setAddress} 
                    placeholder="123 Street Name, City" 
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              <Pressable 
                style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed, saving && styles.saveButtonDisabled]} 
                onPress={handleUpdateProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#1A3B2F" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#1A3B2F" />
                    <Text style={styles.saveButtonText}>Update Profile</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.dangerZone}>
              <Text style={styles.dangerTitle}>Account Security</Text>
              <Pressable style={styles.dangerButton} onPress={() => Alert.alert("Coming Soon", "Password reset will be available soon.")}>
                <Ionicons name="lock-closed-outline" size={20} color="#D32F2F" />
                <Text style={styles.dangerButtonText}>Change Password</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FAF5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FAF5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 10 : 30, paddingBottom: 16,
  },
  menuButton: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(26, 59, 47, 0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  title: { fontSize: 28, fontWeight: '900', color: '#1A3B2F', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: 'rgba(26,59,47,0.5)', fontWeight: '500', marginTop: 2 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#ffffff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
    position: 'relative',
  },
  avatar: { width: '100%', height: '100%', borderRadius: 60 },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5E9', borderRadius: 60 },
  cameraIcon: {
    position: 'absolute', bottom: 4, right: 4,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#1A3B2F', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#ffffff',
  },
  roleText: {
    marginTop: 16, fontSize: 12, fontWeight: '900', color: '#1A3B2F',
    backgroundColor: 'rgba(255,209,102,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    letterSpacing: 1,
  },

  formSection: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '800', color: '#1A3B2F', marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(26,59,47,0.08)',
    minHeight: 56,
  },
  disabledInput: { backgroundColor: 'rgba(26,59,47,0.02)', borderColor: 'rgba(26,59,47,0.03)' },
  input: { flex: 1, fontSize: 16, color: '#1A3B2F', fontWeight: '600' },
  textArea: { height: 80, textAlignVertical: 'top' },
  helperText: { fontSize: 11, color: 'rgba(26,59,47,0.4)', marginLeft: 16, fontWeight: '600' },

  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFD166', height: 60, borderRadius: 20, marginTop: 12,
    shadowColor: '#FFD166', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  saveButtonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  saveButtonDisabled: { backgroundColor: 'rgba(255,209,102,0.5)', shadowOpacity: 0 },
  saveButtonText: { fontSize: 16, fontWeight: '900', color: '#1A3B2F' },

  dangerZone: { marginTop: 40, borderTopWidth: 1, borderTopColor: 'rgba(26,59,47,0.05)', paddingTop: 24 },
  dangerTitle: { fontSize: 16, fontWeight: '800', color: '#1A3B2F', marginBottom: 16, marginLeft: 4 },
  dangerButton: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(211,47,47,0.05)', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(211,47,47,0.1)',
  },
  dangerButtonText: { fontSize: 15, fontWeight: '700', color: '#D32F2F' },
});
