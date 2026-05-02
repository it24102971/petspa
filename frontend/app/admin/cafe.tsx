import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, FlatList, ActivityIndicator, Image, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = "auth:token";

interface CafeItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

interface CafeOrder {
  _id: string;
  userId: {
    fullName: string;
    email: string;
  };
  items: Array<{ name: string, quantity: number, price: number }>;
  totalPrice: number;
  status: string;
  paymentSlip: string;
  createdAt: string;
}

export default function AdminCafeScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CafeItem[]>([]);
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [view, setView] = useState<'items' | 'orders'>('orders');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const [itemsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cafe/items`),
        fetch(`${API_BASE_URL}/cafe/orders`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const itemsData = await itemsRes.json();
      const ordersData = await ordersRes.json();

      if (itemsRes.ok) setItems(itemsData);
      if (ordersRes.ok) setOrders(ordersData);
    } catch (error) {
      console.error("Fetch cafe data failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/cafe/orders/${id}/verify`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setOrders(orders.map(o => o._id === id ? { ...o, status: 'Confirmed' } : o));
        Alert.alert("Success", "Order confirmed!");
      }
    } catch (error) {
      Alert.alert("Error", "Could not verify order.");
    }
  };

  const renderOrderItem = ({ item }: { item: CafeOrder }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.userName}>{item.userId?.fullName || 'User'}</Text>
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
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>Rs. {item.totalPrice}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.viewSlipButton} onPress={() => setSelectedSlip(item.paymentSlip)}>
          <Text style={styles.viewSlipText}>View Receipt</Text>
        </Pressable>
        {item.status === 'Pending' && (
          <Pressable style={styles.verifyButton} onPress={() => handleVerify(item._id)}>
            <Text style={styles.verifyButtonText}>Confirm Order</Text>
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
          <Text style={styles.headerTitle}>Pet Cafe Admin</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.tabs}>
          <Pressable style={[styles.tab, view === 'orders' && styles.activeTab]} onPress={() => setView('orders')}>
            <Text style={[styles.tabText, view === 'orders' && styles.activeTabText]}>Orders</Text>
          </Pressable>
          <Pressable style={[styles.tab, view === 'items' && styles.activeTab]} onPress={() => setView('items')}>
            <Text style={[styles.tabText, view === 'items' && styles.activeTabText]}>Menu</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#FFD166" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={view === 'orders' ? (orders as any[]) : (items as any[])}
            renderItem={view === 'orders' ? renderOrderItem : ({ item }: any) => (
              <View style={styles.itemCard}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>Rs. {item.price}</Text>
                </View>
                <Ionicons name="create-outline" size={20} color="#1A3B2F" />
              </View>
            )}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.list}
            onRefresh={fetchData}
            refreshing={refreshing}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A3B2F' },
  tabs: { flexDirection: 'row', padding: 20, gap: 10 },
  tab: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
  activeTab: { backgroundColor: '#FFD166', borderColor: '#FFD166' },
  tabText: { fontWeight: '700', color: '#666' },
  activeTabText: { color: '#1A3B2F' },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  userName: { fontSize: 16, fontWeight: '800', color: '#1A3B2F' },
  orderDate: { fontSize: 12, color: '#999' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  orderItems: { backgroundColor: '#F8FBF9', borderRadius: 12, padding: 12, marginBottom: 15 },
  orderItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderItemName: { fontSize: 13, fontWeight: '600' },
  orderItemPrice: { fontSize: 13, color: '#666' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  totalLabel: { fontWeight: '800', color: '#1A3B2F' },
  totalValue: { fontWeight: '900', color: '#1A3B2F' },
  actions: { flexDirection: 'row', gap: 10 },
  viewSlipButton: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#1A3B2F', alignItems: 'center', justifyContent: 'center' },
  viewSlipText: { fontWeight: '700', color: '#1A3B2F' },
  verifyButton: { flex: 1, height: 40, borderRadius: 10, backgroundColor: '#1A3B2F', alignItems: 'center', justifyContent: 'center' },
  verifyButtonText: { fontWeight: '700', color: '#fff' },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  itemImage: { width: 50, height: 50, borderRadius: 10, marginRight: 15 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1A3B2F' },
  itemPrice: { fontSize: 13, color: '#666' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: '100%', height: '80%' },
});
