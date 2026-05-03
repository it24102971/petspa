import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, FlatList, ActivityIndicator, Image, Alert, Modal, TextInput, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

const AUTH_TOKEN_KEY = "auth:token";

interface CafeItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  imageUrl?: string;
  isAvailable?: boolean;
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

const QUICK_EXAMPLES = [
  { emoji: '🐶', name: 'Puppyccino', price: '450', category: 'Drink', desc: 'A special treat for your puppy' },
  { emoji: '🍪', name: 'Dog Biscuits', price: '250', category: 'Snack', desc: 'Crunchy and delicious' },
  { emoji: '🐱', name: 'Cat Tuna Treats', price: '350', category: 'Treat', desc: 'Yummy tuna flavor' },
  { emoji: '🥛', name: 'Pet Yogurt Cup', price: '300', category: 'Snack', desc: 'Probiotic yogurt for healthy digestion' },
];

export default function AdminCafeScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CafeItem[]>([]);
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [view, setView] = useState<'items' | 'orders'>('orders');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  // Form State
  const [isItemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CafeItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('Snack');
  const [itemImage, setItemImage] = useState<string>(''); // For emoji or image URL
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const [itemsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cafe/items?all=true`),
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

  const handleSaveItem = async () => {
    if (!itemName || !itemDescription || !itemPrice) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      const payload = {
        name: itemName,
        description: itemDescription,
        price: Number(itemPrice),
        category: itemCategory,
        imageUrl: itemImage,
        isAvailable: true
      };

      const url = editingItem ? `${API_BASE_URL}/cafe/items/${editingItem._id}` : `${API_BASE_URL}/cafe/items`;
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchData();
        closeModal();
      } else {
        const data = await response.json();
        Alert.alert("Error", data.message || "Failed to save item");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    Alert.alert("Confirm", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch(`${API_BASE_URL}/cafe/items/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
              setItems(items.filter(i => i._id !== id));
              closeModal();
            } else {
              Alert.alert("Error", "Failed to delete item");
            }
          } catch (error) {
            Alert.alert("Error", "An error occurred");
          }
        }
      }
    ]);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemCategory('Snack');
    setItemImage('');
    setItemModalVisible(true);
  };

  const openEditModal = (item: CafeItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description);
    setItemPrice(item.price.toString());
    setItemCategory(item.category || 'Snack');
    setItemImage(item.imageUrl || '');
    setItemModalVisible(true);
  };

  const closeModal = () => {
    setItemModalVisible(false);
  };

  const applyQuickExample = (ex: any) => {
    setItemName(ex.name);
    setItemPrice(ex.price);
    setItemCategory(ex.category);
    setItemImage(ex.emoji);
    setItemDescription(ex.desc);
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
          {view === 'items' ? (
            <Pressable onPress={openAddModal} style={styles.addButton}>
              <Ionicons name="add" size={24} color="#fff" />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
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
              <Pressable style={styles.itemCard} onPress={() => openEditModal(item)}>
                {item.imageUrl && (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/uploads')) ? (
                  <Image source={{ uri: item.imageUrl.startsWith('http') ? item.imageUrl : `${API_BASE_URL.replace('/api', '')}${item.imageUrl}` }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, { backgroundColor: '#F0FAF5', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 24 }}>{item.imageUrl || '🐾'}</Text>
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>Rs. {item.price}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </Pressable>
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

        {/* Add/Edit Menu Item Bottom Sheet Modal */}
        <Modal visible={isItemModalVisible} animationType="slide" transparent={true}>
          <View style={styles.bottomSheetOverlay}>
            <Pressable style={styles.bottomSheetBackdrop} onPress={closeModal} />
            <View style={styles.bottomSheetContainer}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</Text>
                <Pressable onPress={closeModal} style={styles.closeIconBtn}>
                  <Ionicons name="close" size={24} color="#1A3B2F" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScrollContent}>
                <Text style={styles.inputLabel}>Item Name</Text>
                <TextInput
                  style={styles.input}
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="Marshmallow Cloud"
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>Price (Rs.)</Text>
                <TextInput
                  style={styles.input}
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  placeholder="250"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryRow}>
                  {['Drink', 'Snack', 'Treat'].map((cat) => (
                    <Pressable
                      key={cat}
                      style={[styles.categoryPill, itemCategory === cat && styles.categoryPillActive]}
                      onPress={() => setItemCategory(cat)}
                    >
                      <Text style={[styles.categoryPillText, itemCategory === cat && styles.categoryPillTextActive]}>{cat}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Emoji or Image URL</Text>
                <TextInput
                  style={styles.input}
                  value={itemImage}
                  onChangeText={setItemImage}
                  placeholder="☁️"
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={itemDescription}
                  onChangeText={setItemDescription}
                  placeholder="Probiotic yogurt for healthy digestion"
                  multiline
                  placeholderTextColor="#999"
                />

                <View style={styles.quickExamplesWrapper}>
                  <Text style={styles.quickExamplesTitle}>Quick Examples:</Text>
                  {QUICK_EXAMPLES.map((ex, idx) => (
                    <Pressable key={idx} style={styles.examplePill} onPress={() => applyQuickExample(ex)}>
                      <Text style={styles.exampleText}>{ex.emoji} {ex.name} - Rs.{ex.price}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.formActionsRow}>
                {editingItem ? (
                  <Pressable style={styles.deleteButtonForm} onPress={() => handleDeleteItem(editingItem._id)}>
                    <Ionicons name="trash-outline" size={24} color="#fff" />
                  </Pressable>
                ) : (
                  <View style={styles.deleteButtonPlaceholder} />
                )}
                <Pressable style={styles.saveButtonForm} onPress={handleSaveItem} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonTextForm}>Save Item</Text>}
                </Pressable>
              </View>
            </View>
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
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A3B2F', alignItems: 'center', justifyContent: 'center' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: '100%', height: '80%' },

  // Bottom Sheet Form Styles
  bottomSheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheetBackdrop: { ...StyleSheet.absoluteFillObject },
  bottomSheetContainer: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: height * 0.9, paddingBottom: 30 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 10 },
  sheetTitle: { fontSize: 22, fontWeight: '900', color: '#1A3B2F' },
  closeIconBtn: { padding: 4 },
  sheetScrollContent: { paddingHorizontal: 24, paddingBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '800', color: '#1A3B2F', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#F0FAF5', borderRadius: 12, padding: 16, fontSize: 15, color: '#1A3B2F', fontWeight: '600' },
  categoryRow: { flexDirection: 'row', gap: 10 },
  categoryPill: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center' },
  categoryPillActive: { backgroundColor: '#FFD166' },
  categoryPillText: { fontSize: 14, fontWeight: '700', color: '#666' },
  categoryPillTextActive: { color: '#1A3B2F' },
  quickExamplesWrapper: { backgroundColor: '#F8FBF9', padding: 16, borderRadius: 16, marginTop: 24 },
  quickExamplesTitle: { fontSize: 15, fontWeight: '800', color: '#1A3B2F', marginBottom: 12 },
  examplePill: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  exampleText: { fontSize: 14, fontWeight: '600', color: '#1A3B2F' },
  formActionsRow: { flexDirection: 'row', paddingHorizontal: 24, paddingTop: 10, gap: 16 },
  deleteButtonForm: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#FF5252', alignItems: 'center', justifyContent: 'center' },
  deleteButtonPlaceholder: { width: 0, height: 0 },
  saveButtonForm: { flex: 1, height: 60, borderRadius: 16, backgroundColor: '#1A3B2F', alignItems: 'center', justifyContent: 'center' },
  saveButtonTextForm: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
