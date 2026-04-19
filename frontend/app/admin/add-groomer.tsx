import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import { SIZES } from '@/constants/spacing';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddGroomerScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    experience: '',
    specialization: '',
    availableDays: '',
    availableTime: '',
    password: '',
    isActive: true,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddGroomer = async () => {
    if (!formData.fullName || !formData.email || !formData.phoneNumber || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Email, Phone, Password).');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      
      if (!token) {
        Alert.alert("Session Expired", "Please log in again as an administrator.");
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/groomer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Groomer added successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        throw new Error(data.message || "Failed to add groomer.");
      }
    } catch (error: any) {
      console.error("Add groomer failed:", error);
      Alert.alert("API Error", error.message || "Could not connect to the database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
              <Ionicons name="chevron-back" size={24} color="#1A3B2F" />
            </Pressable>
            <Text style={styles.headerTitle}>Add New Groomer</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="rgba(26, 59, 47, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Jane Doe"
                    placeholderTextColor="rgba(26, 59, 47, 0.3)"
                    value={formData.fullName}
                    onChangeText={(text) => handleInputChange('fullName', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="rgba(26, 59, 47, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="jane@petspa.com"
                    placeholderTextColor="rgba(26, 59, 47, 0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="rgba(26, 59, 47, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="(555) 123-4567"
                    placeholderTextColor="rgba(26, 59, 47, 0.3)"
                    keyboardType="phone-pad"
                    value={formData.phoneNumber}
                    onChangeText={(text) => handleInputChange('phoneNumber', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Experience</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="time-outline" size={20} color="rgba(26, 59, 47, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 2 years"
                    placeholderTextColor="rgba(26, 59, 47, 0.3)"
                    value={formData.experience}
                    onChangeText={(text) => handleInputChange('experience', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Specialization</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="star-outline" size={20} color="rgba(26, 59, 47, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Dog Grooming, Cat Grooming"
                    placeholderTextColor="rgba(26, 59, 47, 0.3)"
                    value={formData.specialization}
                    onChangeText={(text) => handleInputChange('specialization', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Available Days</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="calendar-outline" size={20} color="rgba(26, 59, 47, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Mon-Sun"
                    placeholderTextColor="rgba(26, 59, 47, 0.3)"
                    value={formData.availableDays}
                    onChangeText={(text) => handleInputChange('availableDays', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Available Time</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="time-outline" size={20} color="rgba(26, 59, 47, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 9AM-5PM"
                    placeholderTextColor="rgba(26, 59, 47, 0.3)"
                    value={formData.availableTime}
                    onChangeText={(text) => handleInputChange('availableTime', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="rgba(26, 59, 47, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Minimum 6 characters"
                    placeholderTextColor="rgba(26, 59, 47, 0.3)"
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                  />
                </View>
              </View>

              <Pressable 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
                onPress={handleAddGroomer}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1A3B2F" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Groomer</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FAF5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 59, 47, 0.05)',
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FAF5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 20,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FBF9',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A3B2F',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#FFD166',
    height: SIZES.buttonHeight,
    borderRadius: SIZES.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#FFD166',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A3B2F',
  },
});
