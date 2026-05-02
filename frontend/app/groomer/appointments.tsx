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
    fullName: string;
  };
  petId: {
    name: string;
    breed: string;
  };
  serviceName: string;
  price: number;
  status: string;
  paymentSlip: string;
  createdAt: string;
}

export default function GroomerAppointmentsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/spa-services/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(data);
      }
    } catch (error) {
      console.error("Fetch bookings failed:", error);
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
        Alert.alert("Success", "Appointment accepted! It's now in your today's schedule.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not accept appointment.");
    }
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.petAvatar}>
          <Ionicons name="paw" size={24} color="#1A3B2F" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.petName}>{item.petId?.name || 'Pet'}</Text>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Accepted' ? '#4CAF5015' : '#FFC10715' }]}>
          <Text style={[styles.statusText, { color: item.status === 'Accepted' ? '#4CAF50' : '#FFC107' }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Owner</Text>
          <Text style={styles.infoValue}>{item.userId?.fullName || 'User'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      {item.status === 'Confirmed' && (
        <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item._id)}>
          <Text style={styles.acceptButtonText}>Accept Appointment</Text>
        </TouchableOpacity>
      )}
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
          <Text style={styles.headerTitle}>Grooming Jobs</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#FFD166" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.list}
            onRefresh={fetchBookings}
            refreshing={refreshing}
            ListHeaderComponent={<Text style={styles.listTitle}>Available & Current Jobs</Text>}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FAF5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A3B2F' },
  list: { padding: 20 },
  listTitle: { fontSize: 18, fontWeight: '800', color: '#1A3B2F', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  petAvatar: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, marginLeft: 15 },
  petName: { fontSize: 17, fontWeight: '800', color: '#1A3B2F' },
  serviceName: { fontSize: 13, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  infoRow: { flexDirection: 'row', marginBottom: 20, gap: 30 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#1A3B2F', marginTop: 4 },
  acceptButton: { height: 50, borderRadius: 15, backgroundColor: '#1A3B2F', alignItems: 'center', justifyContent: 'center' },
  acceptButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
