import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
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

export default function BookingScreen() {
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groomersRes, servicesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/spa-services/groomers`),
        fetch(`${API_BASE_URL}/spa-services`)
      ]);
      if (groomersRes.ok) setGroomers(await groomersRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
    } catch (error) {
      console.error("Failed to fetch booking data", error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url}`;
  };

  const calculateTotal = () => {
    let total = 0;
    if (selectedService) total += selectedService.price;
    // Assume groomer costs 1000 fixed if selected alone without service?
    // Let's just sum service price. If they select groomer and no service, maybe price is 1500?
    if (selectedGroomer && !selectedService) total += 1500; 
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
      formData.append('paymentSlip', {
        uri: paymentSlipUri,
        name: filename,
        type: `image/${ext}`
      } as any);

      const response = await fetch(`${API_BASE_URL}/spa-services/book`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
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
      } else {
        throw new Error(data.message || "Booking failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFD166" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Book Appointment</Text>
        </View>
        <Text style={styles.subtitle}>Select a groomer, a spa service, or both.</Text>

        {/* Groomers Section */}
        <Text style={styles.sectionTitle}>Available Groomers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {groomers.map(groomer => (
            <Pressable 
              key={groomer._id} 
              style={[styles.groomerCard, selectedGroomer?._id === groomer._id && styles.selectedCard]}
              onPress={() => setSelectedGroomer(selectedGroomer?._id === groomer._id ? null : groomer)}
            >
              {groomer.profilePicture ? (
                <Image source={{ uri: getImageUrl(groomer.profilePicture) }} style={styles.groomerImg} />
              ) : (
                <View style={styles.groomerPlaceholder}>
                  <Ionicons name="person" size={24} color="#1A3B2F" />
                </View>
              )}
              <Text style={styles.groomerName}>{groomer.fullName.split(' ')[0]}</Text>
              <Text style={styles.groomerSpec}>{groomer.specialization || 'General Grooming'}</Text>
              {selectedGroomer?._id === groomer._id && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>

        {/* Services Section */}
        <Text style={styles.sectionTitle}>Spa Services</Text>
        {services.map(service => (
          <Pressable 
            key={service._id} 
            style={[styles.serviceCard, selectedService?._id === service._id && styles.selectedCard]}
            onPress={() => setSelectedService(selectedService?._id === service._id ? null : service)}
          >
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDesc}>{service.description}</Text>
              <Text style={styles.serviceDuration}><Ionicons name="time-outline" /> {service.duration}</Text>
            </View>
            <Text style={styles.servicePrice}>Rs. {service.price}</Text>
            {selectedService?._id === service._id && (
              <Ionicons name="checkmark-circle" size={28} color="#FFD166" style={{ marginLeft: 10 }} />
            )}
          </Pressable>
        ))}
      </ScrollView>

      {(selectedGroomer || selectedService) && (
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
              {selectedGroomer && <Text style={styles.summaryItem}>• Groomer: {selectedGroomer.fullName}</Text>}
              {selectedService && <Text style={styles.summaryItem}>• Service: {selectedService.name}</Text>}
              <Text style={styles.summaryTotal}>Total: Rs. {calculateTotal()}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f8fb' },
  content: { padding: 20, paddingBottom: 100 },
  headerRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#1A3B2F' },
  subtitle: { color: '#475569', fontSize: 14, marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A3B2F', marginTop: 25, marginBottom: 12 },
  horizontalList: { gap: 15 },
  groomerCard: { width: 120, padding: 15, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  selectedCard: { borderColor: '#FFD166', backgroundColor: '#FFFAED' },
  groomerImg: { width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
  groomerPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  groomerName: { fontSize: 14, fontWeight: '800', color: '#1A3B2F' },
  groomerSpec: { fontSize: 11, color: '#666', textAlign: 'center', marginTop: 4 },
  checkBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FFD166', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  serviceCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
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
  bookButtonText: { fontSize: 16, fontWeight: '900', color: '#1A3B2F' }
});
