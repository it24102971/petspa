import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth:token';
const petTypes = ['all', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Turtle', 'Guinea Pig', 'Other'];

export default function AdminPetManagementScreen() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [cuteness, setCuteness] = useState('10');
  const [errors, setErrors] = useState<any>({});

  const router = useRouter();

  const fetchPets = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      if (!token) {
        Alert.alert("Session Expired", "Please log in again as an administrator.");
        router.replace("/login");
        return;
      }

      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedType !== 'all') queryParams.append('type', selectedType);

      const response = await fetch(`${API_BASE_URL}/admin/pets?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setPets(data);
      } else {
        throw new Error(data.message || "Failed to fetch pets.");
      }
    } catch (error: any) {
      console.error("Fetch pets failed:", error);
      Alert.alert("API Error", error.message || "Could not connect to the database.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [selectedType]); // Re-fetch when type filter changes

  // Handle Search Debounce (Simulated)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search.length >= 0) {
        fetchPets();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleOpenEdit = (pet: any) => {
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
    Alert.alert("Delete Pet", "Are you sure you want to remove this pet profile permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            const res = await fetch(`${API_BASE_URL}/admin/pets/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (!res.ok) throw new Error('Delete failed');
            setPets(pets.filter(p => p._id !== id));
            Alert.alert("Success", "Pet profile deleted.");
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
    if (!breed.trim()) newErrors.breed = 'Breed is required.';
    if (!age.trim() || isNaN(parseInt(age))) newErrors.age = 'Valid age is required.';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      const payload = {
        name: name.trim(),
        type,
        breed: breed.trim(),
        age: parseInt(age),
        cutenessLevel: parseInt(cuteness) || 10,
      };

      const res = await fetch(`${API_BASE_URL}/admin/pets/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update');

      setPets(pets.map(p => p._id === editingId ? data : p));
      setModalVisible(false);
      Alert.alert("Success", "Pet details updated.");
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not update pet.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.petCard}>
      <View style={styles.petHeader}>
        <View style={styles.petImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: `${API_BASE_URL}${item.imageUrl}` }} style={styles.petImage} />
          ) : (
            <Ionicons name="paw" size={30} color="rgba(26, 59, 47, 0.2)" />
          )}
        </View>
        <View style={styles.petMainInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.petName}>{item.name}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.petBreed}>{item.breed} • {item.age} years</Text>
        </View>
        <View style={styles.actionButtons}>
          <Pressable style={styles.editIcon} onPress={() => handleOpenEdit(item)}>
            <Ionicons name="pencil" size={18} color="#1A3B2F" />
          </Pressable>
          <Pressable style={styles.deleteIcon} onPress={() => handleDelete(item._id)}>
            <Ionicons name="trash" size={18} color="#D32F2F" />
          </Pressable>
        </View>
      </View>
      
      <View style={styles.ownerInfo}>
        <Ionicons name="person-circle-outline" size={16} color="rgba(26, 59, 47, 0.4)" />
        <Text style={styles.ownerLabel}>Owner:</Text>
        <Text style={styles.ownerName}>{item.owner?.fullName || 'Unknown'}</Text>
        <Text style={styles.ownerEmail}>({item.owner?.email || 'N/A'})</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#1A3B2F" />
          </Pressable>
          <Text style={styles.headerTitle}>Pet Management</Text>
          <View style={{ width: 44 }} /> 
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="rgba(26, 59, 47, 0.4)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, owner, or breed..."
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="rgba(26, 59, 47, 0.4)" />
              </Pressable>
            )}
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            {petTypes.map((t) => (
              <Pressable
                key={t}
                style={[styles.filterPill, selectedType === t && styles.filterPillActive]}
                onPress={() => setSelectedType(t)}
              >
                <Text style={[styles.filterText, selectedType === t && styles.filterTextActive]}>
                  {t === 'all' ? 'All Types' : t}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {loading && !isRefreshing ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#FFD166" />
            <Text style={styles.loadingText}>Fetching pet profiles...</Text>
          </View>
        ) : (
          <FlatList
            data={pets}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchPets();
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="paw-outline" size={60} color="rgba(26, 59, 47, 0.1)" />
                <Text style={styles.emptyText}>No pets found matching your criteria.</Text>
              </View>
            }
          />
        )}

        {/* Edit Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Pet Details</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#1A3B2F" />
                </Pressable>
              </View>

              <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Pet Name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Type</Text>
                    <View style={styles.typeSelector}>
                      {petTypes.filter(t => t !== 'all').map((t) => (
                        <Pressable
                          key={t}
                          style={[styles.typeChip, type === t && styles.typeChipActive]}
                          onPress={() => setType(t)}
                        >
                          <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Breed</Text>
                    <TextInput style={styles.input} value={breed} onChangeText={setBreed} />
                    {errors.breed && <Text style={styles.errorText}>{errors.breed}</Text>}
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Age</Text>
                      <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Cuteness (1-10)</Text>
                      <TextInput style={styles.input} value={cuteness} onChangeText={setCuteness} keyboardType="numeric" />
                    </View>
                  </View>

                  <Pressable style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                    {isSaving ? <ActivityIndicator color="#1A3B2F" /> : <Text style={styles.saveBtnText}>Update Profile</Text>}
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FAF5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 59, 47, 0.05)',
  },
  backButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FAF5' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A3B2F' },
  searchContainer: { backgroundColor: '#ffffff', paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF5',
    margin: 16,
    paddingHorizontal: 12,
    height: 50,
    borderRadius: 15,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A3B2F' },
  filterScroll: { paddingLeft: 16 },
  filterContent: { paddingRight: 16, gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(26, 59, 47, 0.1)' },
  filterPillActive: { backgroundColor: '#FFD166', borderColor: '#FFD166' },
  filterText: { fontSize: 13, fontWeight: '700', color: 'rgba(26, 59, 47, 0.6)' },
  filterTextActive: { color: '#1A3B2F' },
  listContent: { padding: 16, gap: 16 },
  petCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(26, 59, 47, 0.05)' },
  petHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  petImageContainer: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  petImage: { width: '100%', height: '100%' },
  petMainInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  petName: { fontSize: 18, fontWeight: '900', color: '#1A3B2F' },
  typeBadge: { backgroundColor: 'rgba(26, 59, 47, 0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '900', color: '#1A3B2F' },
  petBreed: { fontSize: 14, color: 'rgba(26, 59, 47, 0.5)', fontWeight: '600', marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  editIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFD166', alignItems: 'center', justifyContent: 'center' },
  deleteIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(211, 47, 47, 0.1)', alignItems: 'center', justifyContent: 'center' },
  ownerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(26, 59, 47, 0.05)' },
  ownerLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(26, 59, 47, 0.4)' },
  ownerName: { fontSize: 12, fontWeight: '800', color: '#1A3B2F' },
  ownerEmail: { fontSize: 11, color: 'rgba(26, 59, 47, 0.4)', fontWeight: '600' },
  loadingArea: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: 'rgba(26, 59, 47, 0.6)', fontWeight: '600' },
  emptyState: { marginTop: 100, alignItems: 'center', gap: 16 },
  emptyText: { color: 'rgba(26, 59, 47, 0.4)', fontSize: 16, fontWeight: '700', textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1A3B2F' },
  formScroll: { marginBottom: 20 },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: '800', color: 'rgba(26, 59, 47, 0.4)', textTransform: 'uppercase' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, color: '#1A3B2F', fontWeight: '600' },
  errorText: { color: '#D32F2F', fontSize: 12, fontWeight: '600' },
  typeSelector: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  typeChipActive: { backgroundColor: '#1A3B2F', borderColor: '#1A3B2F' },
  typeChipText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  typeChipTextActive: { color: '#ffffff' },
  row: { flexDirection: 'row', gap: 16 },
  saveBtn: { height: 54, backgroundColor: '#FFD166', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#1A3B2F' },
});
