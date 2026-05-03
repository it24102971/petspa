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
          <Pressable style={styles.avatarWrapper} onPress={pickImage}>
            {user?.profilePicture ? (
              <Image source={{ uri: getImageUrl(user.profilePicture) || '' }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={80} color="#1A3B2F" />
              </View>
            )}
            {user?.role !== 'admin' && (
              <View style={styles.camBadge}>
                <Ionicons name="camera" size={16} color="#1A3B2F" />
              </View>
            )}
          </Pressable>

          <Text style={styles.userName}>{user?.role === 'admin' ? 'Admin' : user?.fullName}</Text>
          {user?.role === 'groomer' ? (
            <Text style={styles.userRole}>PROFESSIONAL GROOMER</Text>
          ) : user?.role === 'customer' ? (
            <Text style={styles.userRole}>VALUED CUSTOMER</Text>
          ) : null}
        </View>

        {user?.role === 'admin' ? (
          <View style={styles.infoSection}>
            <InfoCard icon="mail-outline" label="Email" value="admin@petspa.com" />
          </View>
        ) : !isEditing ? (
          <View style={styles.infoSection}>
            <InfoCard icon="call-outline" label="Phone" value={user?.phoneNumber} />
            <InfoCard icon="mail-outline" label="Email" value={user?.email} />
            
            {user?.role === 'groomer' && (
              <>
                <InfoCard icon="calendar-outline" label="Experience" value={user?.experience || '2 Years'} />
                <InfoCard icon="medal-outline" label="Specialization" value={user?.specialization || 'Basic Grooming'} />
                
                <View style={styles.aboutCard}>
                  <Text style={styles.aboutTitle}>About Groomer</Text>
                  <Text style={styles.aboutText}>
                    {user?.aboutMe || 'This groomer has not provided a description yet.'}
                  </Text>
                </View>
              </>
            )}
            
            {user?.role === 'customer' && (
              <InfoCard icon="location-outline" label="Address" value={user?.address || 'Not set'} />
            )}

            {user?.role === 'groomer' && user?.updatedAt && (
              <Text style={styles.lastUpdatedText}>
                Profile last updated on: {new Date(user.updatedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            )}

            <TouchableOpacity 
              style={styles.doneBtn} 
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.doneBtnText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            {user?.role === 'groomer' ? (
              <>
                <InputGroup label="Full Name" value={formData.fullName} onChange={(t) => setFormData({...formData, fullName: t})} />
                <InputGroup label="Email" value={formData.email} onChange={(t) => setFormData({...formData, email: t})} />
                <InputGroup label="Experience (Years)" value={formData.experience} onChange={(t) => setFormData({...formData, experience: t})} />
                <InputGroup label="Specialization" value={formData.specialization} onChange={(t) => setFormData({...formData, specialization: t})} />
                <InputGroup label="About Me" value={formData.aboutMe} onChange={(t) => setFormData({...formData, aboutMe: t})} multiline />
              </>
            ) : (
              <>
                <InputGroup label="Full Name" value={formData.fullName} onChange={(t) => setFormData({...formData, fullName: t})} />
                <InputGroup label="Phone" value={formData.phoneNumber} onChange={(t) => setFormData({...formData, phoneNumber: t})} />
                <InputGroup label="Address" value={formData.address} onChange={(t) => setFormData({...formData, address: t})} multiline />
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

const InfoCard = ({ icon, label, value }: any) => (
  <View style={styles.infoCard}>
    <View style={styles.cardIconBox}>
      <Ionicons name={icon} size={22} color="#FFD166" />
    </View>
    <View style={styles.cardContent}>
      <Text style={styles.cardLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.cardValue}>{value || 'Not set'}</Text>
    </View>
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
  profileHeader: { alignItems: 'center', marginTop: 30, marginBottom: 40 },
  avatarWrapper: { 
    width: 160, 
    height: 160, 
    borderRadius: 45, 
    backgroundColor: '#FFD166', 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#FFD166',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 45 },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  camBadge: { 
    position: 'absolute', 
    bottom: -5, 
    right: -5, 
    backgroundColor: '#fff', 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD166'
  },
  userName: { fontSize: 28, fontWeight: '900', color: '#1A3B2F', marginTop: 24 },
  userRole: { fontSize: 14, fontWeight: '800', color: '#FFD166', marginTop: 4, letterSpacing: 0.5 },
  infoSection: { paddingHorizontal: 20, gap: 12 },
  infoCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F0FAF5', 
    borderRadius: 20, 
    padding: 16,
    height: 75,
  },
  cardIconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 15, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  cardContent: { flex: 1, marginLeft: 15 },
  cardLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(26, 59, 47, 0.4)', letterSpacing: 1 },
  cardValue: { fontSize: 16, fontWeight: '800', color: '#1A3B2F', marginTop: 2 },
  aboutCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F0FAF5',
  },
  aboutTitle: { fontSize: 15, fontWeight: '900', color: '#1A3B2F', marginBottom: 10 },
  aboutText: { fontSize: 14, color: 'rgba(26, 59, 47, 0.6)', lineHeight: 22, fontWeight: '600' },
  doneBtn: { 
    backgroundColor: '#1A3B2F', 
    height: 65, 
    borderRadius: 32.5, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 30,
    shadowColor: '#1A3B2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  doneBtnText: { fontSize: 18, fontWeight: '900', color: '#fff' },
  lastUpdatedText: { 
    fontSize: 12, 
    color: 'rgba(26, 59, 47, 0.4)', 
    textAlign: 'center', 
    marginTop: 20, 
    fontWeight: '600',
    fontStyle: 'italic'
  },
  form: { paddingHorizontal: 24, gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '800', color: 'rgba(26, 59, 47, 0.5)', marginLeft: 4 },
  input: { backgroundColor: '#F8FBF9', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1A3B2F', borderWidth: 1, borderColor: '#eee' },
  saveBtn: { backgroundColor: '#FFD166', height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#FFD166', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { fontSize: 16, fontWeight: '900', color: '#1A3B2F' },
});



