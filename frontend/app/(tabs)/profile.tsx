import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Image, ActivityIndicator, Alert, TextInput, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
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
        console.log("Fetched User Profile:", parsed);
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
      } else {
        console.log("Profile fetch failed:", res.status);
        // If not ok, we might want to check if we have cached user data
        const cachedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (cachedUser) setUser(JSON.parse(cachedUser));
      }
    } catch (error) {
      console.error("Load user failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );


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
      
      <View style={styles.header}>
        <Pressable style={styles.headerBtn}>
          <Ionicons name="menu-outline" size={28} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <Pressable style={styles.avatarWrapper} onPress={pickImage}>
            {user?.profilePicture ? (
              <Image source={{ uri: getImageUrl(user.profilePicture) || '' }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={70} color="#1A3B2F" />
              </View>
            )}
            <View style={styles.camBadge}>
              <Ionicons name="camera" size={16} color="#1A3B2F" />
            </View>
          </Pressable>

          <Text style={styles.userName}>{user?.fullName || 'Guest'}</Text>
          
          {user?.role === 'groomer' && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={20} color="#FFD166" />
              <Text style={styles.ratingText}>4.8 </Text>
              <Text style={styles.reviewText}>(12 Reviews)</Text>
            </View>
          )}
        </View>

        {!isEditing ? (
          <View style={styles.infoSection}>
            <InfoCard icon="call-outline" label="Phone" value={user?.phoneNumber} />
            <InfoCard icon="mail-outline" label="Email" value={user?.email} />
            
            {user?.role === 'groomer' && (
              <>
                <InfoCard icon="calendar-outline" label="Experience" value={user?.experience || '4 Years'} />
                <InfoCard icon="paw-outline" label="Specialization" value={user?.specialization || 'Cat'} />
                <InfoCard 
                  icon="time-outline" 
                  label="Availability" 
                  value={`${user?.availableDays || 'Mon - Sat'} (${user?.availableTime || '9AM - 6PM'})`} 
                />
              </>
            )}
            
            {user?.role === 'customer' && (
              <InfoCard icon="location-outline" label="Address" value={user?.address || 'Not set'} />
            )}

            <TouchableOpacity 
              style={styles.editBtn} 
              onPress={() => {
                if (user) {
                  setFormData({
                    fullName: user.fullName || '',
                    email: user.email || '',
                    phoneNumber: user.phoneNumber || '',
                    address: user.address || '',
                    aboutMe: user.aboutMe || '',
                    experience: user.experience || '',
                    specialization: user.specialization || '',
                    availableDays: user.availableDays || '',
                    availableTime: user.availableTime || '',
                  });
                }
                setIsEditing(true);
              }}
            >
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>

          </View>
        ) : (
          <View style={styles.form}>
            <InputGroup label="Full Name" value={formData.fullName} onChange={(t) => setFormData({...formData, fullName: t})} />
            <InputGroup label="Phone" value={formData.phoneNumber} onChange={(t) => setFormData({...formData, phoneNumber: t})} />
            <InputGroup label="Email" value={formData.email} onChange={(t) => setFormData({...formData, email: t})} />
            
            {user?.role === 'groomer' && (
              <>
                <InputGroup label="Experience" value={formData.experience} onChange={(t) => setFormData({...formData, experience: t})} />
                <InputGroup label="Specialization" value={formData.specialization} onChange={(t) => setFormData({...formData, specialization: t})} />
                <InputGroup label="Available Days" value={formData.availableDays} onChange={(t) => setFormData({...formData, availableDays: t})} placeholder="e.g. Mon - Sat" />
                <InputGroup label="Available Time" value={formData.availableTime} onChange={(t) => setFormData({...formData, availableTime: t})} placeholder="e.g. 9AM - 6PM" />
                <InputGroup label="About Me" value={formData.aboutMe} onChange={(t) => setFormData({...formData, aboutMe: t})} multiline />
              </>
            )}
            
            {user?.role === 'customer' && (
              <InputGroup label="Address" value={formData.address} onChange={(t) => setFormData({...formData, address: t})} multiline />
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

const InfoCard = ({ icon, label, value }: any) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon} size={24} color="#000" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue} numberOfLines={1}>{value || 'Not set'}</Text>
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    height: 60,
    marginTop: Platform.OS === 'android' ? 30 : 0
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 60 },
  profileHeader: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  avatarWrapper: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    backgroundColor: '#F0F0F0', 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#eee'
  },
  avatar: { width: '100%', height: '100%', borderRadius: 70 },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  camBadge: { 
    position: 'absolute', 
    bottom: 5, 
    right: 5, 
    backgroundColor: '#FFD166', 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  userName: { fontSize: 26, fontWeight: 'bold', color: '#000', marginTop: 15 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingText: { fontSize: 18, fontWeight: 'bold', color: '#000', marginLeft: 8 },
  reviewText: { fontSize: 18, color: '#666' },
  
  infoSection: { paddingHorizontal: 25, marginTop: 10 },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  infoLabel: { fontSize: 16, color: '#666', fontWeight: '500' },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#000', flex: 1, textAlign: 'right', marginLeft: 20 },
  
  editBtn: { 
    backgroundColor: '#FFD166', 
    height: 60, 
    borderRadius: 30, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 40,
    width: '100%'
  },
  editBtnText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  
  form: { paddingHorizontal: 24, gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '800', color: 'rgba(0,0,0,0.5)', marginLeft: 4 },
  input: { backgroundColor: '#F8FBF9', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#eee' },
  saveBtn: { backgroundColor: '#FFD166', height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
});




