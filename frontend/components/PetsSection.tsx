import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/api';
import PetCard from './PetCard';

const AUTH_TOKEN_KEY = 'auth:token';

interface Pet {
  _id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
  cutenessLevel: number;
  imageUrl?: string;
}

export default function PetsSection() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [cuteness, setCuteness] = useState('10');
  
  const [errors, setErrors] = useState<{name?: string, breed?: string, age?: string, cuteness?: string}>({});

  const petTypes = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Turtle', 'Guinea Pig', 'Other'];

  const fetchPets = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/pets`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch pets');
      const data = await res.json();
      setPets(data);
    } catch (error) {
      console.warn("Could not load pets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setType('Dog');
    setBreed('');
    setAge('');
    setCuteness('10');
    setErrors({});
    setModalVisible(true);
  };

  const handleOpenEdit = (pet: Pet) => {
    setEditingId(pet._id);
    setName(pet.name);
    setType(pet.type || 'Dog');
    setBreed(pet.breed);
    setAge(pet.age.toString());
    setCuteness(pet.cutenessLevel.toString());
    setErrors({});
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Pet", "Are you sure you want to remove this pet?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            const res = await fetch(`${API_BASE_URL}/pets/${id}`, {
              method: 'DELETE',
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });
            if (!res.ok) throw new Error('Delete failed');
            setPets(pets.filter(p => p._id !== id));
          } catch (error) {
            Alert.alert('Error', 'Could not delete pet.');
          }
        }
      }
    ]);
  };

  const handleSave = async () => {
    const newErrors: any = {};
    
    if (!name.trim()) newErrors.name = 'Name is required.';
    else if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters.';
    
    if (!breed.trim()) newErrors.breed = 'Breed is required.';
    if (!age.trim()) newErrors.age = 'Age is required.';
    
    const numAge = parseInt(age, 10);
    const numCuteness = parseInt(cuteness, 10) || 10;
    
    if (age.trim() && (isNaN(numAge) || numAge < 0)) newErrors.age = 'Please enter a valid positive age.';
    if (numCuteness < 1 || numCuteness > 10) newErrors.cuteness = 'Cuteness must be between 1 and 10.';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      const payload = {
        name: name.trim(),
        type,
        breed: breed.trim(),
        age: numAge,
        cutenessLevel: numCuteness,
      };

      const url = editingId ? `${API_BASE_URL}/pets/${editingId}` : `${API_BASE_URL}/pets`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');

      if (editingId) {
        setPets(pets.map(p => p._id === editingId ? data : p));
      } else {
        setPets([...pets, data]);
      }
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not save pet.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pets</Text>
        <Pressable style={styles.addBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={16} color="#1A3B2F" />
          <Text style={styles.addBtnText}>Add Pet</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#FFD166" style={{ marginVertical: 20 }} />
      ) : pets.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="paw-outline" size={40} color="rgba(26, 59, 47, 0.2)" />
          <Text style={styles.emptyText}>You haven&apos;t added any pets yet.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {pets.map(pet => (
            <PetCard
              key={pet._id}
              name={pet.name}
              type={pet.type || 'Dog'}
              breed={pet.breed}
              age={pet.age}
              cutenessLevel={pet.cutenessLevel}
              imageUrl={pet.imageUrl ? `${API_BASE_URL}${pet.imageUrl}` : undefined}
              onEdit={() => handleOpenEdit(pet)}
              onDelete={() => handleDelete(pet._id)}
            />
          ))}
        </View>
      )}

      {/* Pet Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Pet' : 'Add New Pet'}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1A3B2F" />
              </Pressable>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pet Type *</Text>
                <View style={styles.typeSelector}>
                  {petTypes.map((t) => (
                    <Pressable
                      key={t}
                      style={[styles.typeChip, type === t && styles.typeChipActive]}
                      onPress={() => { setType(t); setErrors({...errors, type: undefined}); }}
                    >
                      <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                        {t}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={name}
                  onChangeText={(text) => { setName(text); setErrors({...errors, name: undefined}); }}
                  placeholder="e.g. Bella"
                />
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Breed *</Text>
                <TextInput
                  style={[styles.input, errors.breed && styles.inputError]}
                  value={breed}
                  onChangeText={(text) => { setBreed(text); setErrors({...errors, breed: undefined}); }}
                  placeholder="e.g. Golden Retriever"
                />
                {errors.breed ? <Text style={styles.errorText}>{errors.breed}</Text> : null}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Age (Years) *</Text>
                  <TextInput
                    style={[styles.input, errors.age && styles.inputError]}
                    value={age}
                    onChangeText={(text) => { setAge(text); setErrors({...errors, age: undefined}); }}
                    keyboardType="numeric"
                    placeholder="e.g. 3"
                  />
                  {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Cuteness (1-10)</Text>
                  <TextInput
                    style={[styles.input, errors.cuteness && styles.inputError]}
                    value={cuteness}
                    onChangeText={(text) => { setCuteness(text); setErrors({...errors, cuteness: undefined}); }}
                    keyboardType="numeric"
                    placeholder="10"
                  />
                  {errors.cuteness ? <Text style={styles.errorText}>{errors.cuteness}</Text> : null}
                </View>
              </View>

              <Pressable 
                style={styles.saveBtn} 
                onPress={handleSave} 
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#1A3B2F" />
                ) : (
                  <Text style={styles.saveBtnText}>{editingId ? 'Save Changes' : 'Add Pet'}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD166',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  list: {
    gap: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.5)',
    fontWeight: '600',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.4)',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    color: '#1A3B2F',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  saveBtn: {
    height: 54,
    backgroundColor: '#FFD166',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeChipActive: {
    backgroundColor: '#1A3B2F',
    borderColor: '#1A3B2F',
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  typeChipTextActive: {
    color: '#ffffff',
  },
});
