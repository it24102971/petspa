import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, FlatList, ActivityIndicator, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = "auth:token";

interface CafeOrder {
  _id: string;
  items: Array<{ name: string, quantity: number, price: number }>;
  totalPrice: number;
  status: string;
  paymentSlip: string;
  createdAt: string;
}

export default function MyCafeOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/cafe/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Fetch cafe orders failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderOrderItem = ({ item }: { item: CafeOrder }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Confirmed' ? '#4CAF5015' : '#FFC10715' }]}>
          <Text style={[styles.statusText, { color: item.status === 'Confirmed' ? '#4CAF50' : '#FFC107' }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items.map((ii, idx) => (
          <View key={idx} style={styles.orderItemRow}>
            <Text style={styles.orderItemName}>{ii.quantity}x {ii.name}</Text>
            <Text style={styles.orderItemPrice}>Rs. {ii.price * ii.quantity}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Paid</Text>
          <Text style={styles.totalValue}>Rs. {item.totalPrice}</Text>
        </View>
      </View>

      {item.paymentSlip ? (
        <Pressable style={styles.viewSlipButton} onPress={() => setSelectedSlip(item.paymentSlip)}>
          <Ionicons name="receipt-outline" size={18} color="#1A3B2F" />
          <Text style={styles.viewSlipText}>View Receipt</Text>
        </Pressable>
      ) : null}
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
          <Text style={styles.headerTitle}>My Cafe Orders</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#FFD166" style={{ marginTop: 50 }} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cafe-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>You haven't placed any cafe orders yet.</Text>
            <Pressable style={styles.shopButton} onPress={() => router.replace('/(tabs)/cafe' as any)}>
              <Text style={styles.shopButtonText}>Order Now</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.list}
            onRefresh={fetchOrders}
            refreshing={refreshing}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Modal visible={!!selectedSlip} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalClose} onPress={() => setSelectedSlip(null)}>
              <Ionicons name="close" size={30} color="#fff" />
            </Pressable>
            {selectedSlip && <Image source={{ uri: `${API_BASE_URL.replace('/api', '')}${selectedSlip}` }} style={styles.fullImage} resizeMode="contain" />}
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FAF5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A3B2F' },
  list: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderDate: { fontSize: 14, fontWeight: '600', color: '#666' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '800' },
  orderItems: { backgroundColor: '#F8FBF9', borderRadius: 12, padding: 16, marginBottom: 16 },
  orderItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderItemName: { fontSize: 14, fontWeight: '600', color: '#1A3B2F' },
  orderItemPrice: { fontSize: 14, color: '#666', fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E8F5E9' },
  totalLabel: { fontWeight: '800', color: '#1A3B2F', fontSize: 15 },
  totalValue: { fontWeight: '900', color: '#1A3B2F', fontSize: 16 },
  viewSlipButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, backgroundColor: '#F0FAF5' },
  viewSlipText: { fontWeight: '700', color: '#1A3B2F', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: '90%', height: '80%', borderRadius: 20 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 16, marginBottom: 24, fontWeight: '600' },
  shopButton: { backgroundColor: '#1A3B2F', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  shopButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
