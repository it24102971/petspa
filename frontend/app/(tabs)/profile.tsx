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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    aboutMe: '',
    experience: '',
    specialization: '',
    availableDays: '',
    availableTime: '',
  });

  const loadUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const parsed = await res.json();
        setUser(parsed);
        setFormData({
          fullName: parsed.fullName || '',
          email: parsed.email || '',
          phoneNumber: parsed.phoneNumber || '',
          address: parsed.address || '',
          aboutMe: parsed.aboutMe || '',
          experience: parsed.experience || '',
          specialization: parsed.specialization || '',
          availableDays: parsed.availableDays || '',
          availableTime: parsed.availableTime || '',
        });
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error("Load user failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

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
        setUser(data);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
        Alert.alert("Success", "Profile updated successfully!");
        setIsEditing(false);
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
      Alert.alert('Permission needed', 'We need access to your photos.');
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
      const fd = new FormData();
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      fd.append('profilePicture', {
        uri,
        name: `profile.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      const response = await fetch(`${API_BASE_URL}/auth/profile-picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        Alert.alert("Success", "Picture updated!");
      }
    } catch (error) {
      Alert.alert("Error", "Upload failed");
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
      
      {/* Custom Header to match screenshot */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="menu" size={28} color="#1A3B2F" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={24} color="#1A3B2F" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            {user?.profilePicture ? (
              <Image source={{ uri: getImageUrl(user.profilePicture) || '' }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color="#1A3B2F" />
              </View>
            )}
            {user?.role !== 'admin' && (
              <TouchableOpacity style={styles.camBadge} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#1A3B2F" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.userName}>{user?.role === 'admin' ? 'admin' : user?.fullName}</Text>
          {user?.role !== 'admin' && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#FFD166" />
              <Text style={styles.ratingText}>4.8 <Text style={styles.reviewCount}>(12 Reviews)</Text></Text>
            </View>
          )}
        </View>

        {user?.role === 'admin' ? (
          <View style={styles.infoSection}>
            <InfoRow icon="mail-outline" label="Email" value="admin@petspa.com" />
          </View>
        ) : !isEditing ? (
          <View style={styles.infoSection}>
            <InfoRow icon="call-outline" label="Phone" value={user?.phoneNumber} />
            <InfoRow icon="mail-outline" label="Email" value={user?.email} />
            {user?.role === 'groomer' && (
              <>
                <InfoRow icon="calendar-outline" label="Experience" value={user?.experience || 'N/A'} />
                <InfoRow icon="paw-outline" label="Specialization" value={user?.specialization || 'N/A'} />
                <InfoRow icon="time-outline" label="Availability" value={`${user?.availableDays || 'Mon - Sat'} (${user?.availableTime || '9AM - 6PM'})`} />
              </>
            )}
            <InfoRow icon="location-outline" label="Address" value={user?.address || 'Not set'} />

            <TouchableOpacity style={styles.mainEditBtn} onPress={() => setIsEditing(true)}>
              <Text style={styles.mainEditBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <InputGroup label="Full Name" value={formData.fullName} onChange={(t) => setFormData({...formData, fullName: t})} />
            <InputGroup label="Phone" value={formData.phoneNumber} onChange={(t) => setFormData({...formData, phoneNumber: t})} />
            <InputGroup label="Address" value={formData.address} onChange={(t) => setFormData({...formData, address: t})} multiline />
            
            {user?.role === 'groomer' && (
              <>
                <InputGroup label="Experience" value={formData.experience} onChange={(t) => setFormData({...formData, experience: t})} />
                <InputGroup label="Specialization" value={formData.specialization} onChange={(t) => setFormData({...formData, specialization: t})} />
                <InputGroup label="Available Days" value={formData.availableDays} onChange={(t) => setFormData({...formData, availableDays: t})} placeholder="e.g. Mon - Fri" />
                <InputGroup label="Available Time" value={formData.availableTime} onChange={(t) => setFormData({...formData, availableTime: t})} placeholder="e.g. 8AM - 5PM" />
                <InputGroup label="About Me" value={formData.aboutMe} onChange={(t) => setFormData({...formData, aboutMe: t})} multiline />
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#f0f0f0', flex: 1 }]} onPress={() => setIsEditing(false)}>
                <Text style={[styles.saveBtnText, { color: '#666' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { flex: 2 }]} onPress={handleUpdateProfile} disabled={updating}>
                {updating ? <ActivityIndicator color="#1A3B2F" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ icon, label, value }: any) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconBox}>
      <Ionicons name={icon} size={22} color="#1A3B2F" />
    </View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
  </View>
);

interface InputGroupProps {
  label: string;
  value: string;
  onChange: (text: string) => void;
  multiline?: boolean;
  placeholder?: string;
}

const InputGroup = ({ label, value, onChange, multiline, placeholder }: InputGroupProps) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && { height: 80, paddingTop: 12 }]}
      value={value}
      onChangeText={onChange}
      multiline={multiline}
      placeholder={placeholder}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A3B2F' },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 100 },
  profileHeader: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  avatarWrapper: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#F0FAF5', position: 'relative', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 15 },
  avatar: { width: '100%', height: '100%', borderRadius: 70 },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  camBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#FFD166', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff' },
  userName: { fontSize: 24, fontWeight: '900', color: '#1A3B2F', marginTop: 16 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ratingText: { fontSize: 15, fontWeight: '800', color: '#1A3B2F' },
  reviewCount: { color: 'rgba(26, 59, 47, 0.4)', fontWeight: '600' },
  infoSection: { paddingHorizontal: 24, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  infoIconBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 15, fontWeight: '700', color: 'rgba(26, 59, 47, 0.5)', marginLeft: 8, flex: 1 },
  infoValue: { fontSize: 15, fontWeight: '800', color: '#1A3B2F' },
  mainEditBtn: { backgroundColor: '#FFD166', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 30, shadowColor: '#FFD166', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  mainEditBtnText: { fontSize: 18, fontWeight: '900', color: '#1A3B2F' },
  form: { paddingHorizontal: 24, gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '800', color: 'rgba(26, 59, 47, 0.5)', marginLeft: 4 },
  input: { backgroundColor: '#F8FBF9', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1A3B2F', borderWidth: 1, borderColor: '#eee' },
  saveBtn: { backgroundColor: '#FFD166', height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#FFD166', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { fontSize: 16, fontWeight: '900', color: '#1A3B2F' },
});



