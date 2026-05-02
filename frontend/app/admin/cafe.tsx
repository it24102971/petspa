import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TabType = 'shop' | 'orders';

const getImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${url}`;
};

export default function AdminCafeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('shop');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Modal states for Menu Item
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [emoji, setEmoji] = useState('☕');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      if (!token) {
        router.replace('/login');
        return;
      }

      if (activeTab === 'shop') {
        const res = await fetch(`${API_BASE_URL}/cafe/admin/menu`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setMenuItems(data);
      } else {
        const res = await fetch(`${API_BASE_URL}/cafe/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setOrders(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    if (!name.trim() || !price) {
      Alert.alert('Error', 'Name and price are required.');
      return;
    }
    try {
      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('auth:token');
      const url = editingItem
        ? `${API_BASE_URL}/cafe/admin/menu/${editingItem._id}`
        : `${API_BASE_URL}/cafe/admin/menu`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, price: Number(price), emoji }),
      });

      if (res.ok) {
        setModalVisible(false);
        fetchData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    Alert.alert('Confirm', 'Delete this menu item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('auth:token');
            const res = await fetch(`${API_BASE_URL}/cafe/admin/menu/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete item.');
          }
        },
      },
    ]);
  };

  const handleUpdateOrderStatus = async (id: string, action: 'verify' | 'reject') => {
    try {
      const token = await AsyncStorage.getItem('auth:token');
      const res = await fetch(`${API_BASE_URL}/cafe/admin/orders/${id}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} order.`);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    Alert.alert('Confirm', 'Delete this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('auth:token');
            const res = await fetch(`${API_BASE_URL}/cafe/admin/orders/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete order.');
          }
        },
      },
    ]);
  };

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setPrice(item.price.toString());
      setEmoji(item.emoji);
    } else {
      setEditingItem(null);
      setName('');
      setPrice('');
      setEmoji('☕');
    }
    setModalVisible(true);
  };

  const renderMenuItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emojiText}>{item.emoji}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Pressable onPress={() => openModal(item)} style={styles.actionBtn}>
          <Ionicons name="pencil-outline" size={20} color="#1A3B2F" />
        </Pressable>
        <Pressable onPress={() => handleDeleteItem(item._id)} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={20} color="#D32F2F" />
        </Pressable>
      </View>
    </View>
  );

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order: #{item._id.slice(-6)}</Text>
        <View style={[styles.statusBadge, item.status === 'verified' && styles.statusVerified, item.status === 'rejected' && styles.statusRejected]}>
          <Text style={[styles.statusText, item.status === 'verified' && styles.statusTextVerified, item.status === 'rejected' && styles.statusTextRejected]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        <Pressable onPress={() => handleDeleteOrder(item._id)} style={styles.deleteOrderBtn}>
          <Ionicons name="trash-outline" size={18} color="rgba(26, 59, 47, 0.4)" />
        </Pressable>
      </View>
      
      <View style={styles.orderItems}>
        {item.items.map((orderItem: any, idx: number) => (
          <Text key={idx} style={styles.orderItemText}>
            {orderItem.emoji} {orderItem.name} x{orderItem.quantity} (${orderItem.price.toFixed(2)})
          </Text>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.orderTotal}>Total: ${item.total.toFixed(2)}</Text>
          {item.paymentSlip && (
            <Pressable 
              onPress={() => Linking.openURL(getImageUrl(item.paymentSlip)!)} 
              style={styles.slipBtn}
            >
              <Ionicons name="document-text-outline" size={14} color="#1A3B2F" />
              <Text style={styles.slipBtnText}>View Slip</Text>
            </Pressable>
          )}
        </View>
        {item.status === 'pending' && (
          <View style={styles.orderActions}>
            <Pressable onPress={() => handleUpdateOrderStatus(item._id, 'verify')} style={styles.verifyBtn}>
              <Text style={styles.verifyBtnText}>Verify</Text>
            </Pressable>
            <Pressable onPress={() => handleUpdateOrderStatus(item._id, 'reject')} style={styles.rejectBtn}>
              <Text style={styles.rejectBtnText}>Reject</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
            <Ionicons name="chevron-back" size={24} color="#1A3B2F" />
          </Pressable>
          <Text style={styles.headerTitle}>Cafe Orders</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'shop' && styles.tabActive]}
            onPress={() => setActiveTab('shop')}
          >
            <Ionicons name="cafe-outline" size={20} color={activeTab === 'shop' ? '#1A3B2F' : 'rgba(26, 59, 47, 0.4)'} />
            <Text style={[styles.tabText, activeTab === 'shop' && styles.tabTextActive]}>Shop</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Ionicons name="cart-outline" size={20} color={activeTab === 'orders' ? '#1A3B2F' : 'rgba(26, 59, 47, 0.4)'} />
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>Orders</Text>
          </Pressable>
        </View>

        {activeTab === 'shop' && (
          <View style={styles.subHeader}>
            <Text style={styles.subHeaderTitle}>Admin Menu Manager</Text>
            <Pressable onPress={() => openModal()} style={styles.addBtn}>
              <Ionicons name="add" size={18} color="#1A3B2F" />
              <Text style={styles.addBtnText}>Add New</Text>
            </Pressable>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#FFD166" />
          </View>
        ) : (
          <FlatList
            data={activeTab === 'shop' ? menuItems : orders}
            keyExtractor={(item) => item._id}
            renderItem={activeTab === 'shop' ? renderMenuItem : renderOrderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name={activeTab === 'shop' ? 'cafe-outline' : 'cart-outline'} size={48} color="rgba(26, 59, 47, 0.1)" />
                <Text style={styles.emptyText}>No {activeTab === 'shop' ? 'items' : 'orders'} found.</Text>
              </View>
            }
          />
        )}

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'New Menu Item'}</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#1A3B2F" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Emoji</Text>
                  <TextInput
                    style={styles.input}
                    value={emoji}
                    onChangeText={setEmoji}
                    placeholder="☕"
                    maxLength={2}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Puppy Latte"
                    placeholderTextColor="rgba(26, 59, 47, 0.4)"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Price ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor="rgba(26, 59, 47, 0.4)"
                    keyboardType="decimal-pad"
                  />
                </View>

                <Pressable 
                  style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]} 
                  onPress={handleSaveItem}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <ActivityIndicator color="#1A3B2F" /> : <Text style={styles.saveBtnText}>Save Item</Text>}
                </Pressable>
              </ScrollView>
            </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 59, 47, 0.05)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: '#FFD166',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.4)',
  },
  tabTextActive: {
    color: '#1A3B2F',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  subHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD166',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  cardInfo: {
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D32F2F', // Same red as screenshot
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A3B2F',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFD166', // pending
    marginRight: 8,
  },
  statusVerified: {
    backgroundColor: '#81C784',
  },
  statusRejected: {
    backgroundColor: '#E57373',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  statusTextVerified: {
    color: '#ffffff',
  },
  statusTextRejected: {
    color: '#ffffff',
  },
  deleteOrderBtn: {
    padding: 4,
  },
  orderItems: {
    width: '100%',
    marginBottom: 16,
    gap: 4,
  },
  orderItemText: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.7)',
    fontWeight: '600',
  },
  orderFooter: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 59, 47, 0.05)',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  verifyBtn: {
    backgroundColor: '#1A3B2F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  rejectBtn: {
    backgroundColor: '#F0FAF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rejectBtnText: {
    color: '#1A3B2F',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(26, 59, 47, 0.4)',
  },
  slipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0FAF5',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  slipBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F0FAF5',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
    color: '#1A3B2F',
  },
  saveBtn: {
    backgroundColor: '#FFD166',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A3B2F',
  },
});
