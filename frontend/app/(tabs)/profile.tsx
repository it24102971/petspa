import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, TextInput, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '@/constants/api';
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
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [experience, setExperience] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [availability, setAvailability] = useState('');
  const [profilePictureUri, setProfilePictureUri] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        updateLocalState(parsedUser);
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const freshUser = await response.json();
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(freshUser));
        updateLocalState(freshUser);
      }
    } catch (error) {
      console.error("Fetch profile failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateLocalState = (data: any) => {
    setUser(data);
    setFullName(data.fullName || '');
    setPhoneNumber(data.phoneNumber || '');
    setExperience(data.experience || '');
    setSpecialization(data.specialization || '');
    setAvailability(data.availableDays ? `${data.availableDays} (${data.availableTime})` : '');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePictureUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('phoneNumber', phoneNumber);
      formData.append('experience', experience);
      formData.append('specialization', specialization);
      
      // Parse availability back (rough parse)
      const availMatch = availability.match(/(.*)\((.*)\)/);
      if (availMatch) {
        formData.append('availableDays', availMatch[1].trim());
        formData.append('availableTime', availMatch[2].trim());
      } else {
        formData.append('availableDays', availability);
      }

      if (profilePictureUri) {
        const filename = profilePictureUri.split('/').pop() || 'profile.jpg';
        const ext = filename.split('.').pop() || 'jpg';
        formData.append('profilePicture', {
          uri: profilePictureUri,
          name: filename,
          type: `image/${ext}`
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        throw new Error(data.message || "Update failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const InfoRow = ({ icon, label, value, stateValue, onChange, editable }: any) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={24} color="#1A3B2F" style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      {editable ? (
        <TextInput 
          style={styles.rowInput} 
          value={stateValue} 
          onChangeText={onChange}
          placeholder={`Enter ${label}`}
        />
      ) : (
        <Text style={styles.rowValue}>{value || 'Not set'}</Text>
      )}
    </View>
  );

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#FFD166" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={openSidebar} hitSlop={15}>
          <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable hitSlop={15}>
          <Ionicons name="notifications-outline" size={24} color="#1A3B2F" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Pressable onPress={isEditing ? pickImage : undefined}>
              <View style={styles.avatarContainer}>
                {profilePictureUri ? (
                  <Image source={{ uri: profilePictureUri }} style={styles.avatar} />
                ) : user?.profilePicture ? (
                  <Image source={{ uri: getImageUrl(user.profilePicture) || '' }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.placeholder]}>
                    <Ionicons name="person" size={80} color="#1A3B2F" />
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              </View>
            </Pressable>
          </View>

          {isEditing ? (
            <TextInput 
              style={styles.nameInput} 
              value={fullName} 
              onChangeText={setFullName} 
              placeholder="Your Name"
            />
          ) : (
            <Text style={styles.userNameText}>{user?.fullName}</Text>
          )}

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={20} color="#FFD166" />
            <Text style={styles.ratingText}>
              <Text style={{ fontWeight: '900' }}>4.8</Text> (12 Reviews)
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <InfoRow 
            icon="call-outline" 
            label="Phone" 
            value={user?.phoneNumber} 
            stateValue={phoneNumber}
            onChange={setPhoneNumber}
            editable={isEditing}
          />
          <InfoRow 
            icon="mail-outline" 
            label="Email" 
            value={user?.email} 
            editable={false} 
          />
          <InfoRow 
            icon="calendar-outline" 
            label="Experience" 
            value={user?.experience} 
            stateValue={experience}
            onChange={setExperience}
            editable={isEditing}
          />
          <InfoRow 
            icon="paw-outline" 
            label="Specialization" 
            value={user?.specialization} 
            stateValue={specialization}
            onChange={setSpecialization}
            editable={isEditing}
          />
          <InfoRow 
            icon="time-outline" 
            label="Availability" 
            value={availability} 
            stateValue={availability}
            onChange={setAvailability}
            editable={isEditing}
          />
        </View>

        {/* Action Button */}
        <View style={styles.footer}>
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsEditing(false); fetchProfile(); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A3B2F' },
  scrollContent: { paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  avatarWrapper: { marginBottom: 20 },
  avatarContainer: { width: 180, height: 180, borderRadius: 90, position: 'relative' },
  avatar: { width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: '#eee' },
  placeholder: { backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center' },
  cameraBadge: { position: 'absolute', bottom: 15, right: 15, width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFD166', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  userNameText: { fontSize: 32, fontWeight: '900', color: '#000', marginBottom: 10 },
  nameInput: { fontSize: 24, fontWeight: '900', color: '#000', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#FFD166', paddingHorizontal: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingText: { fontSize: 18, color: '#666' },
  infoContainer: { paddingHorizontal: 25, gap: 25 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { width: 30 },
  rowLabel: { flex: 1, fontSize: 18, fontWeight: '600', color: '#666', marginLeft: 10 },
  rowValue: { fontSize: 18, fontWeight: '800', color: '#000' },
  rowInput: { flex: 1.5, fontSize: 16, fontWeight: '800', color: '#000', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 5 },
  footer: { padding: 25, marginTop: 20 },
  editBtn: { height: 65, borderRadius: 32, backgroundColor: '#FFD166', alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 20, fontWeight: '900', color: '#1A3B2F' },
  editActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 60, borderRadius: 30, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 18, fontWeight: '700', color: '#666' },
  saveBtn: { flex: 2, height: 60, borderRadius: 30, backgroundColor: '#1A3B2F', alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
