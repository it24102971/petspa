import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, FlatList, ActivityIndicator, Alert, Modal, TouchableOpacity } from 'react-native';
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
  appointmentDate: string;
  appointmentTime: string;
  price: number;
  status: string;
  paymentSlip: string;
  createdAt: string;
  petId?: {
    name: string;
    breed: string;
  };
}

export default function GroomerAppointmentsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Confirmed', 'Accepted', 'Completed'];

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

  const handleAccept = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/spa-services/bookings/${id}/accept`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setBookings(bookings.map(b => b._id === id ? { ...b, status: 'Accepted' } : b));
        Alert.alert("Success", "Appointment accepted!");
      }
    } catch (error) {
      Alert.alert("Error", "Could not accept appointment.");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/spa-services/bookings/${id}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setBookings(bookings.map(b => b._id === id ? { ...b, status: 'Completed' } : b));
        Alert.alert("Success", "Job marked as completed!");
      }
    } catch (error) {
      Alert.alert("Error", "Could not complete job.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return '#2196F3';
      case 'Accepted': return '#FF9800';
      case 'Completed': return '#4CAF50';
      case 'Pending': return '#9E9E9E';
      default: return '#757575';
    }
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.serviceName}>{item.petId?.name || 'Pet'} - {item.serviceName || 'Spa Service'}</Text>
          <Text style={styles.userName}>Customer: {item.userId?.fullName || 'User'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.appointmentDate} at {item.appointmentTime}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="paw-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.petId?.breed || 'Unknown Breed'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Reward: Rs. {item.price ? item.price.toLocaleString() : '0'}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {item.status === 'Confirmed' && (
          <TouchableOpacity 
            style={styles.acceptButton} 
            onPress={() => handleAccept(item._id)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
            <Text style={styles.buttonText}>Accept Job</Text>
          </TouchableOpacity>
        )}
        {item.status === 'Accepted' && (
          <TouchableOpacity 
            style={styles.completeButton} 
            onPress={() => handleComplete(item._id)}
          >
            <Ionicons name="flag-outline" size={18} color="#ffffff" />
            <Text style={styles.buttonText}>Mark Complete</Text>
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Groomer Jobs</Text>
          <Pressable onPress={fetchBookings} style={styles.refreshButton}>
            <Ionicons name="refresh" size={22} color="#1A3B2F" />
          </Pressable>
        </View>

        <View style={styles.filterContainer}>
          {filters.map(f => (
            <Pressable 
              key={f} 
              onPress={() => setActiveFilter(f)}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FFD166" />
          </View>
        ) : (
          <FlatList
            data={bookings.filter(b => activeFilter === 'All' || b.status === activeFilter)}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            onRefresh={fetchBookings}
            refreshing={refreshing}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No jobs found</Text>
              </View>
            }
          />
        )}
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
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center',
  },
  refreshButton: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20, fontWeight: '900', color: '#1A3B2F',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#fff',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
  },
  filterPillActive: {
    backgroundColor: '#FFD166',
  },
  filterText: {
    fontSize: 13, fontWeight: '700', color: '#666',
  },
  filterTextActive: {
    color: '#1A3B2F',
  },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  listContent: {
    padding: 20, paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 17, fontWeight: '900', color: '#1A3B2F',
  },
  userName: {
    fontSize: 14, fontWeight: '600', color: '#666', marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  statusText: {
    fontSize: 11, fontWeight: '800', textTransform: 'uppercase',
  },
  detailsContainer: {
    backgroundColor: '#F8FBF9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  detailText: {
    fontSize: 13, color: '#444', fontWeight: '500',
  },
  actions: {
    flexDirection: 'row', gap: 12,
  },
  acceptButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 44, borderRadius: 12, backgroundColor: '#1A3B2F',
  },
  completeButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 44, borderRadius: 12, backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 14, fontWeight: '800', color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 100, opacity: 0.5,
  },
  emptyText: {
    fontSize: 16, fontWeight: '600', color: '#1A3B2F', marginTop: 10,
  },
});
