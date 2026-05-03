import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SIZES } from '@/constants/spacing';
import { useSidebar } from '@/context/SidebarContext';

import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

interface Groomer {
  _id: string;
  fullName: string;
  specialization: string;
  experience: string;
  profilePicture: string;
  availableDays: string;
  availableTime: string;
}

interface SpaService {
  _id: string;
  name: string;
  duration: string;
  price: number;
  description: string;
}

interface Booking {
  _id: string;
  serviceName?: string;
  groomerName?: string;
  petId?: {
    _id: string;
    name: string;
  };
  petName?: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  price: number;
  userId?: {
    _id: string;
    fullName: string;
  };
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string; view?: string }>();
  const { filter } = params;
  const [activeFilter, setActiveFilter] = useState('All');
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const { openSidebar } = useSidebar();
  const filters = ['All', 'Pending', 'Accepted', 'Completed'];

  useEffect(() => {
    if (filter && filters.includes(filter)) {
      setActiveFilter(filter);
    }
  }, [filter]);

  const [viewMode, setViewMode] = useState<'list' | 'book'>('list');

  // Booking states
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [services, setServices] = useState<SpaService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroomer, setSelectedGroomer] = useState<Groomer | null>(null);
  const [selectedService, setSelectedService] = useState<SpaService | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [paymentSlipUri, setPaymentSlipUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPets, setUserPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<any | null>(null);

  useEffect(() => {
    const getRole = async () => {
      const userData = await AsyncStorage.getItem("auth:user");
      if (userData) {
        setUserRole(JSON.parse(userData).role);
      }
    };
    getRole();
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchBookingData();
  }, []);

  useEffect(() => {
    if (params.view === 'book') {
      setViewMode('book');
    }
  }, [params.view]);

  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem("auth:token");
      const res = await fetch(`${API_BASE_URL}/spa-services/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAppointments(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBookingData = async () => {
    try {
      const token = await AsyncStorage.getItem("auth:token");
      const [groomersRes, servicesRes, petsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/spa-services/groomers`),
        fetch(`${API_BASE_URL}/spa-services`),
        fetch(`${API_BASE_URL}/pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      if (groomersRes.ok) setGroomers(await groomersRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (petsRes.ok) setUserPets(await petsRes.json());
    } catch (error) {
      console.error("Failed to fetch booking data", error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/uploads')) return url.startsWith('http') ? url : `${API_BASE_URL.replace('/api', '')}${url}`;
    return '';
  };

  const isEmoji = (text: string | null | undefined) => {
    if (!text) return false;
    return text.length <= 4 && !text.includes('/') && !text.includes('.');
  };

  const GROOMER_FEE = 1500;

  const calculateTotal = () => {
    let total = 0;
    if (selectedGroomer) total += GROOMER_FEE;
    if (selectedService) total += selectedService.price;
    return total;
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPaymentSlipUri(result.assets[0].uri);
    }
  };

  const handleBook = async () => {
    if (!date || !time) {
      Alert.alert("Error", "Please enter appointment date and time.");
      return;
    }
    if (!paymentSlipUri) {
      Alert.alert("Error", "Please upload a payment receipt.");
      return;
    }
    if (!selectedPet) {
      Alert.alert("Error", "Please select a pet for this appointment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("auth:token");
      const filename = paymentSlipUri.split('/').pop() || 'receipt.jpg';
      const ext = filename.split('.').pop() || 'jpg';

      const formData = new FormData();
      if (selectedService) formData.append('serviceId', selectedService._id);
      if (selectedGroomer) formData.append('groomerId', selectedGroomer._id);
      formData.append('appointmentDate', date);
      formData.append('appointmentTime', time);
      formData.append('price', calculateTotal().toString());
      formData.append('petId', selectedPet._id);
      formData.append('paymentSlip', {
        uri: paymentSlipUri,
        name: filename,
        type: `image/${ext}`
      } as any);

      const response = await fetch(`${API_BASE_URL}/spa-services/book`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Booking placed successfully. Admin will verify it soon.");
        setModalVisible(false);
        setSelectedGroomer(null);
        setSelectedService(null);
        setDate('');
        setTime('');
        setPaymentSlipUri(null);
        setViewMode('list');
        fetchAppointments(); // Refresh the list
      } else {
        throw new Error(data.message || "Booking failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAppointmentItem = ({ item }: any) => (
    <View style={styles.appointmentCard}>
      <View style={styles.cardMain}>
        <View style={styles.petImageContainer}>
          {isEmoji(item.petId?.imageUrl) ? (
            <Text style={{ fontSize: 32 }}>{item.petId.imageUrl}</Text>
          ) : item.petId?.imageUrl ? (
            <Image source={{ uri: getImageUrl(item.petId.imageUrl) }} style={styles.petImage} />
          ) : (
            <View style={styles.petImagePlaceholder}>
              <Ionicons name="paw" size={32} color="rgba(26, 59, 47, 0.2)" />
            </View>
          )}
        </View>
        
        <View style={styles.appointmentDetails}>
          {userRole === 'admin' && item.userId?.fullName && (
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFD166', marginBottom: 2 }}>{item.userId.fullName}</Text>
          )}
          <Text style={styles.petName}>
            {item.petId?.name || item.petName || 'Spa Service'}
          </Text>
          <Text style={styles.petBreed}>
            {item.serviceName ? item.serviceName : (item.groomerName ? 'Grooming' : 'Spa Treatment')}
            {item.groomerName ? ` • With ${item.groomerName}` : ''}
          </Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666666" />
            <Text style={styles.infoText}>{item.appointmentDate}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#666666" />
            <Text style={styles.infoText}>{item.appointmentTime}</Text>
          </View>
        </View>

        <View style={[
          styles.completedBadge, 
          { backgroundColor: 
            item.status === 'Pending' ? '#FFF3E0' : 
            item.status === 'Accepted' ? '#E3F2FD' :
            item.status === 'Completed' ? '#E8F5E9' : '#F5F5F7' 
          }
        ]}>
          <Text style={[
            styles.completedText, 
            { color: 
              item.status === 'Pending' ? '#E65100' : 
              item.status === 'Accepted' ? '#1976D2' :
              item.status === 'Completed' ? '#2E7D32' : '#666666' 
            }
          ]}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  if (viewMode === 'book') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Pressable onPress={() => setViewMode('list')} style={styles.headerButton} hitSlop={15}>
            <Ionicons name="chevron-back" size={28} color="#1A3B2F" />
          </Pressable>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>Select a groomer to book your appointment.</Text>

          {/* Groomers Section */}
          <Text style={styles.sectionTitle}>Available Groomers</Text>
          {groomers.map(groomer => (
            <Pressable 
              key={groomer._id} 
              style={[styles.serviceCard, selectedGroomer?._id === groomer._id && styles.selectedCard]}
              onPress={() => setSelectedGroomer(selectedGroomer?._id === groomer._id ? null : groomer)}
            >
              {groomer.profilePicture ? (
                <Image source={{ uri: getImageUrl(groomer.profilePicture) }} style={styles.groomerRowImg} />
              ) : (
                <View style={styles.groomerRowPlaceholder}>
                  <Ionicons name="person" size={24} color="#1A3B2F" />
                </View>
              )}
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{groomer.fullName}</Text>
                <Text style={styles.serviceDesc}>{groomer.specialization || 'General Grooming'}</Text>
                <Text style={styles.serviceDuration}>
                  <Ionicons name="calendar-outline" /> {groomer.availableDays || 'Mon-Sun'}  •  <Ionicons name="time-outline" /> {groomer.availableTime || '9AM-5PM'}
                </Text>
              </View>
              {selectedGroomer?._id === groomer._id && (
                <Ionicons name="checkmark-circle" size={28} color="#FFD166" style={{ marginLeft: 10 }} />
              )}
            </Pressable>
          ))}
        </ScrollView>

        {selectedGroomer && (
          <View style={styles.footer}>
            <View>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.priceText}>Rs. {calculateTotal()}</Text>
            </View>
            <Pressable style={styles.proceedButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.proceedButtonText}>Proceed</Text>
              <Ionicons name="arrow-forward" size={20} color="#1A3B2F" />
            </Pressable>
          </View>
        )}

        {/* Booking Modal */}
        <Modal visible={modalVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Booking</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#1A3B2F" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Booking Summary</Text>
                {selectedGroomer && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={styles.summaryItem}>• Groomer: {selectedGroomer.fullName}</Text>
                    <Text style={{ fontWeight: '700', color: '#1A3B2F' }}>Rs. 1,500</Text>
                  </View>
                )}
                {selectedService && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={styles.summaryItem}>• Service: {selectedService.name}</Text>
                    <Text style={{ fontWeight: '700', color: '#1A3B2F' }}>Rs. {selectedService.price}</Text>
                  </View>
                )}
                {selectedPet && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={styles.summaryItem}>• Pet: {selectedPet.name}</Text>
                    <Text style={{ fontWeight: '700', color: '#1A3B2F' }}>{selectedPet.type}</Text>
                  </View>
                )}
                <Text style={styles.summaryTotal}>Total: Rs. {calculateTotal()}</Text>
              </View>

              <Text style={styles.inputLabel}>Select Pet *</Text>
              <View style={styles.petPickerContainer}>
                {userPets.length === 0 ? (
                  <Pressable style={styles.noPetsBtn} onPress={() => { setModalVisible(false); router.push('/pets'); }}>
                    <Text style={styles.noPetsText}>No pets found. Click to add a pet first.</Text>
                  </Pressable>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 5 }}>
                    {userPets.map(pet => (
                      <Pressable 
                        key={pet._id} 
                        style={[styles.petMiniCard, selectedPet?._id === pet._id && styles.petMiniCardActive]}
                        onPress={() => setSelectedPet(pet)}
                      >
                        <Ionicons name="paw" size={20} color={selectedPet?._id === pet._id ? "#1A3B2F" : "rgba(26,59,47,0.3)"} />
                        <Text style={[styles.petMiniName, selectedPet?._id === pet._id && styles.petMiniNameActive]}>{pet.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>

              <Text style={styles.inputLabel}>Date (e.g. 20 May 2024)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter appointment date"
                value={date}
                onChangeText={setDate}
              />

              <Text style={styles.inputLabel}>Time (e.g. 10:00 AM)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter appointment time"
                value={time}
                onChangeText={setTime}
              />

              <Text style={styles.inputLabel}>Payment Receipt</Text>
              <Text style={styles.paymentSub}>Please transfer Rs. {calculateTotal()} and upload receipt.</Text>
              <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
                <Ionicons name={paymentSlipUri ? "checkmark-circle" : "cloud-upload-outline"} size={30} color={paymentSlipUri ? "#4CAF50" : "#1A3B2F"} />
                <Text style={styles.uploadBtnText}>{paymentSlipUri ? "Receipt Uploaded" : "Upload Slip"}</Text>
              </TouchableOpacity>

              {paymentSlipUri && (
                <Image source={{ uri: paymentSlipUri }} style={styles.previewImage} />
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.bookButton, (isSubmitting || !paymentSlipUri || !date || !time) && styles.bookButtonDisabled]}
                onPress={handleBook}
                disabled={isSubmitting || !paymentSlipUri || !date || !time}
              >
                {isSubmitting ? <ActivityIndicator color="#1A3B2F" /> : <Text style={styles.bookButtonText}>Confirm & Submit</Text>}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={openSidebar} style={styles.headerButton} hitSlop={15}>
            <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
          </Pressable>
          <Text style={styles.headerTitle}>Appointments</Text>
          <View style={{ flexDirection: 'row' }}>
            {userRole !== 'admin' && userRole !== 'groomer' && (
              <Pressable onPress={() => setViewMode('book')} style={styles.headerButton}>
                <Ionicons name="add-circle" size={28} color="#FFD166" />
              </Pressable>
            )}
            <Pressable style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={24} color="#1A3B2F" />
            </Pressable>
          </View>
        </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterPill,
                activeFilter === filter && styles.filterPillActive
              ]}
            >
              <Text style={[
                styles.filterPillText,
                activeFilter === filter && styles.filterPillTextActive
              ]}>
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Appointment List */}
      <FlatList
        data={appointments.filter(item => activeFilter === 'All' || item.status === activeFilter)}
        keyExtractor={(item) => item._id}
        renderItem={renderAppointmentItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 50, opacity: 0.5 }}>
            <Ionicons name="calendar-outline" size={64} color="#1A3B2F" />
            <Text style={{ marginTop: 10, fontSize: 16, color: '#1A3B2F', fontWeight: 'bold' }}>No appointments found</Text>
            <TouchableOpacity style={{ marginTop: 20, backgroundColor: '#FFD166', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }} onPress={() => setViewMode('book')}>
              <Text style={{ fontWeight: '800', color: '#1A3B2F' }}>Book Now</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {userRole !== 'admin' && userRole !== 'groomer' && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setViewMode('book')}
        >
          <Ionicons name="add" size={24} color="#1A3B2F" />
          <Text style={styles.fabText}>Book</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    minWidth: 80,
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: '#FFD166',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  filterPillTextActive: {
    color: '#1A3B2F',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentDetails: {
    flex: 1,
    marginLeft: 16,
  },
  petName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.5)',
    fontWeight: '600',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00897B',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FFD166',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    gap: 5,
  },
  fabText: {
    color: '#1A3B2F',
    fontWeight: '900',
    fontSize: 16,
  },
  content: { padding: 20, paddingBottom: 100 },
  subtitle: { color: '#475569', fontSize: 14, marginTop: 5, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A3B2F', marginTop: 25, marginBottom: 12, paddingHorizontal: 20 },
  groomerRowImg: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  groomerRowPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  selectedCard: { borderColor: '#FFD166', backgroundColor: '#FFFAED' },
  serviceCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, marginHorizontal: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '800', color: '#1A3B2F' },
  serviceDesc: { fontSize: 13, color: '#666', marginVertical: 4 },
  serviceDuration: { fontSize: 12, color: '#1A3B2F', fontWeight: '600' },
  servicePrice: { fontSize: 16, fontWeight: '900', color: '#FFD166' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#eee', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontSize: 13, color: '#666', fontWeight: '600' },
  priceText: { fontSize: 20, fontWeight: '900', color: '#1A3B2F' },
  proceedButton: { flexDirection: 'row', backgroundColor: '#FFD166', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignItems: 'center', gap: 8 },
  proceedButtonText: { fontSize: 16, fontWeight: '800', color: '#1A3B2F' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1A3B2F' },
  modalContent: { padding: 20 },
  summaryBox: { backgroundColor: '#F0FAF5', padding: 20, borderRadius: 16, marginBottom: 20 },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#1A3B2F', marginBottom: 10 },
  summaryItem: { fontSize: 14, color: '#1A3B2F', marginBottom: 5 },
  summaryTotal: { fontSize: 16, fontWeight: '900', color: '#1A3B2F', marginTop: 10, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 10 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#1A3B2F', marginBottom: 8 },
  input: { backgroundColor: '#F8FBF9', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 15, fontSize: 15, marginBottom: 20 },
  paymentSub: { fontSize: 13, color: '#666', marginBottom: 15 },
  uploadBtn: { height: 80, borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc', borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: '#1A3B2F' },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 30 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  bookButton: { backgroundColor: '#FFD166', padding: 18, borderRadius: 16, alignItems: 'center' },
  bookButtonDisabled: { opacity: 0.5 },
  bookButtonText: { fontSize: 16, fontWeight: '900', color: '#1A3B2F' },
  petPickerContainer: {
    marginBottom: 20,
  },
  noPetsBtn: {
    padding: 15,
    backgroundColor: 'rgba(26,59,47,0.05)',
    borderRadius: 12,
    alignItems: 'center',
  },
  noPetsText: {
    color: '#1A3B2F',
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  petMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,59,47,0.1)',
    gap: 8,
  },
  petMiniCardActive: {
    backgroundColor: '#FFD166',
    borderColor: '#FFD166',
  },
  petMiniName: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(26,59,47,0.5)',
  },
  petMiniNameActive: {
    color: '#1A3B2F',
  },
});
