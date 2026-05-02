import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable,
  ActivityIndicator, Image, Alert, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '@/constants/api';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

const AUTH_TOKEN_KEY = "auth:token";

const getImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${url}`;
};

export default function PetProfileScreen() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  
  // Form State
  const [editingPet, setEditingPet] = useState<any>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<any>(null);

  const fetchPets = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/pets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPets(data);
      }
    } catch (error) {
      console.error("Fetch pets failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

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

  const handleSave = async () => {
    if (!name.trim() || !type.trim()) {
      Alert.alert("Error", "Name and Type are required.");
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('type', type);
      formData.append('breed', breed);
      formData.append('age', age);
      formData.append('gender', gender);
      formData.append('weight', weight);
      formData.append('notes', notes);

      if (image) {
        formData.append('image', {
          uri: image.uri,
          name: 'pet.jpg',
          type: 'image/jpeg',
        } as any);
      }

      const method = editingPet ? 'PUT' : 'POST';
      const url = editingPet ? `${API_BASE_URL}/pets/${editingPet._id}` : `${API_BASE_URL}/pets`;

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setModalVisible(false);
        fetchPets();
        resetForm();
      } else {
        const data = await res.json();
        Alert.alert("Error", data.message || "Failed to save pet profile.");
      }
    } catch (error) {
      Alert.alert("Error", "Network request failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Pet", "Are you sure you want to remove this pet?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
          await fetch(`${API_BASE_URL}/pets/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchPets();
        }
      }
    ]);
  };

  const resetForm = () => {
    setEditingPet(null);
    setName('');
    setType('dog');
    setBreed('');
    setAge('');
    setGender('male');
    setWeight('');
    setNotes('');
    setImage(null);
  };

  const openEdit = (pet: any) => {
    setEditingPet(pet);
    setName(pet.name);
    setType(pet.type);
    setBreed(pet.breed || '');
    setAge(pet.age?.toString() || '');
    setGender(pet.gender || 'male');
    setWeight(pet.weight?.toString() || '');
    setNotes(pet.notes || '');
    setImage(null);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1A3B2F" />
            </Pressable>
            <Text style={styles.title}>My Pets</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => { resetForm(); setModalVisible(true); }}>
            <Ionicons name="add" size={24} color="#1A3B2F" />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#FFD166" style={{ marginTop: 50 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.petList} showsVerticalScrollIndicator={false}>
            {pets.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="paw-outline" size={80} color="#FFD166" />
                <Text style={styles.emptyText}>No pets added yet</Text>
                <Pressable style={styles.emptyAddButton} onPress={() => setModalVisible(true)}>
                  <Text style={styles.emptyAddButtonText}>Add your first pet</Text>
                </Pressable>
              </View>
            ) : (
              pets.map((pet) => (
                <View key={pet._id} style={styles.petCard}>
                  <Image
                    source={pet.imageUrl ? { uri: getImageUrl(pet.imageUrl) } : require('@/assets/images/icon.png')}
                    style={styles.petImage}
                  />
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petSub}>{pet.breed || pet.type} • {pet.age} years</Text>
                    <View style={styles.genderBadge}>
                      <Ionicons name={pet.gender === 'male' ? 'male' : 'female'} size={12} color="#1A3B2F" />
                      <Text style={styles.genderText}>{pet.gender}</Text>
                    </View>
                  </View>
                  <View style={styles.petActions}>
                    <Pressable style={styles.actionIcon} onPress={() => openEdit(pet)} hitSlop={10}>
                      <Ionicons name="create-outline" size={22} color="#1A3B2F" />
                    </Pressable>
                    <Pressable style={[styles.actionIcon, { backgroundColor: '#FFEBEE' }]} onPress={() => handleDelete(pet._id)} hitSlop={10}>
                      <Ionicons name="trash-outline" size={22} color="#D32F2F" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#1A3B2F" />
                </Pressable>
                <Text style={styles.modalTitle}>{editingPet ? 'Edit Pet' : 'New Pet'}</Text>
                <Pressable onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#1A3B2F" /> : <Text style={styles.saveText}>Save</Text>}
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.formContent}>
                <Pressable style={styles.imagePicker} onPress={handlePickImage}>
                  {image || (editingPet && editingPet.imageUrl) ? (
                    <Image source={{ uri: image ? image.uri : getImageUrl(editingPet.imageUrl) }} style={styles.pickedImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera-outline" size={32} color="#1A3B2F" />
                      <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                    </View>
                  )}
                </Pressable>

                <Text style={styles.label}>Pet Name *</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Buddy" />

                <Text style={styles.label}>Type</Text>
                <View style={styles.typeRow}>
                  {['dog', 'cat', 'bird', 'rabbit', 'other'].map((t) => (
                    <Pressable key={t} style={[styles.typeChip, type === t && styles.typeChipActive]} onPress={() => setType(t)}>
                      <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.inputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Breed</Text>
                    <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="Golden Retriever" />
                  </View>
                  <View style={{ width: 80, marginLeft: 12 }}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="2" keyboardType="numeric" />
                  </View>
                </View>

                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderRow}>
                  <Pressable style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]} onPress={() => setGender('male')}>
                    <Ionicons name="male" size={20} color={gender === 'male' ? '#ffffff' : '#1A3B2F'} />
                    <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>Male</Text>
                  </Pressable>
                  <Pressable style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]} onPress={() => setGender('female')}>
                    <Ionicons name="female" size={20} color={gender === 'female' ? '#ffffff' : '#1A3B2F'} />
                    <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>Female</Text>
                  </Pressable>
                </View>

                <Text style={styles.label}>Notes</Text>
                <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Any medical conditions or preferences..." multiline />
              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FAF5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 10 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(26,59,47,0.05)' },
  title: { fontSize: 28, fontWeight: '900', color: '#1A3B2F' },
  addButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFD166', alignItems: 'center', justifyContent: 'center' },
  petList: { padding: 24, gap: 16 },
  petCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(26,59,47,0.05)' },
  petImage: { width: 70, height: 70, borderRadius: 15, backgroundColor: '#F0FAF5' },
  petInfo: { flex: 1, marginLeft: 16 },
  petName: { fontSize: 18, fontWeight: '800', color: '#1A3B2F' },
  petSub: { fontSize: 14, color: 'rgba(26,59,47,0.5)', marginTop: 2 },
  genderBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(26,59,47,0.05)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  genderText: { fontSize: 11, fontWeight: '700', color: '#1A3B2F', textTransform: 'capitalize' },
  petActions: { gap: 8 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(26,59,47,0.05)', alignItems: 'center', justifyContent: 'center' },
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#F0FAF5' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(26,59,47,0.05)' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1A3B2F' },
  saveText: { fontSize: 16, fontWeight: '800', color: '#1A3B2F' },
  formContent: { padding: 24 },
  imagePicker: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ffffff', alignSelf: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(26,59,47,0.1)', overflow: 'hidden' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  imagePlaceholderText: { fontSize: 12, fontWeight: '700', color: 'rgba(26,59,47,0.4)' },
  pickedImage: { width: '100%', height: '100%' },
  label: { fontSize: 14, fontWeight: '800', color: '#1A3B2F', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 16, color: '#1A3B2F', borderWidth: 1, borderColor: 'rgba(26,59,47,0.1)',
    minHeight: 56,
  },
  inputRow: { flexDirection: 'row' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(26,59,47,0.1)' },
  typeChipActive: { backgroundColor: '#1A3B2F', borderColor: '#1A3B2F' },
  typeChipText: { fontSize: 14, fontWeight: '700', color: '#1A3B2F', textTransform: 'capitalize' },
  typeChipTextActive: { color: '#ffffff' },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(26,59,47,0.1)' },
  genderButtonActive: { backgroundColor: '#1A3B2F', borderColor: '#1A3B2F' },
  genderButtonText: { fontSize: 14, fontWeight: '700', color: '#1A3B2F' },
  genderButtonTextActive: { color: '#ffffff' },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '800', color: 'rgba(26,59,47,0.3)', marginTop: 16 },
  emptyAddButton: { marginTop: 24, backgroundColor: '#FFD166', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  emptyAddButtonText: { fontSize: 16, fontWeight: '900', color: '#1A3B2F' },
});
