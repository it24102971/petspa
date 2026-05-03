import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, FlatList, ActivityIndicator, Image, Alert, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = "auth:token";

interface Booking {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  serviceId: {
    _id: string;
    name: string;
  };
  serviceName?: string;
  groomerId?: {
    _id: string;
    fullName: string;
  };
  groomerName?: string;
  petId?: {
    _id: string;
    name: string;
    type: string;
    breed: string;
    imageUrl?: string;
  };
  petName?: string;
  appointmentDate: string;
  appointmentTime: string;
  price: number;
  status: string;
  paymentSlip: string;
  createdAt: string;
}

export default function AdminAppointmentsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/spa-services/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(data);
      } else {
        throw new Error(data.message || "Failed to fetch bookings");
      }
    } catch (error: any) {
      console.error("Fetch bookings failed:", error);
      Alert.alert("Error", error.message || "Could not load appointments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/spa-services/bookings/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(bookings.map(b => b._id === id ? { ...b, status: 'Confirmed' } : b));
        Alert.alert("Success", "Appointment verified successfully!");
      } else {
        throw new Error(data.message || "Failed to verify booking");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not verify appointment.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return '#4CAF50';
      case 'Pending': return '#FFC107';
      default: return '#757575';
    }
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          {item.serviceName && <Text style={styles.serviceName}>Spa: {item.serviceName}</Text>}
          {item.groomerName && <Text style={styles.serviceName}>Groomer: {item.groomerName}</Text>}
          {item.petName && <Text style={styles.petName}>Pet: {item.petName}</Text>}
          <Text style={styles.userName}>Customer: {item.userId?.fullName || 'Unknown User'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.userId?.email || 'No email'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.appointmentDate} at {item.appointmentTime}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Rs. {item.price ? item.price.toLocaleString() : '0'}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable 
          style={styles.viewSlipButton} 
          onPress={() => setSelectedSlip(item.paymentSlip)}
        >
          <Ionicons name="image-outline" size={18} color="#1A3B2F" />
          <Text style={styles.viewSlipText}>View Slip</Text>
        </Pressable>

        {item.status === 'Pending' && (
          <Pressable 
            style={styles.verifyButton} 
            onPress={() => handleVerify(item._id)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
            <Text style={styles.verifyButtonText}>Verify</Text>
          </Pressable>
        )}
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
          <Text style={styles.headerTitle}>Appointments</Text>
          <Pressable onPress={fetchBookings} style={styles.refreshButton}>
            <Ionicons name="refresh" size={22} color="#1A3B2F" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FFD166" />
          </View>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            onRefresh={fetchBookings}
            refreshing={refreshing}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No appointments found</Text>
              </View>
            }
          />
        )}

        {/* Payment Slip Modal */}
        <Modal
          visible={!!selectedSlip}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedSlip(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment Receipt</Text>
                <Pressable onPress={() => setSelectedSlip(null)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#ffffff" />
                </Pressable>
              </View>
              {selectedSlip && (
                <Image 
                  source={{ uri: `${API_BASE_URL.replace('/api', '')}${selectedSlip}` }} 
                  style={styles.fullSlipImage} 
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  petName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFD166',
    marginTop: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailsContainer: {
    backgroundColor: '#F8FBF9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewSlipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A3B2F',
  },
  viewSlipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  verifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1A3B2F',
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3B2F',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullSlipImage: {
    flex: 1,
    width: '100%',
    borderRadius: 20,
  },
});
