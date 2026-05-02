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
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

type TabType = 'menu' | 'cart';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
}

export default function CafeCustomerScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [slipImage, setSlipImage] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/cafe/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMenuItems(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item._id);
      if (existing) {
        return prev.map(i =>
          i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          emoji: item.emoji || '☕',
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === id);
      if (!existing) return prev;
      if (existing.quantity + delta <= 0) {
        return prev.filter(i => i.menuItemId !== id);
      }
      return prev.map(i =>
        i.menuItemId === id ? { ...i, quantity: i.quantity + delta } : i
      );
    });
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSlipImage(result.assets[0]);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSlipImage(null);
    setModalVisible(true);
  };

  const confirmOrder = async () => {
    if (!slipImage) {
      Alert.alert("Slip Required", "Please upload a payment slip.");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('auth:token');
      
      const formData = new FormData();
      formData.append('items', JSON.stringify(cart));
      formData.append('notes', "Paid via uploaded slip");
      
      formData.append('paymentSlip', {
        uri: slipImage.uri,
        name: 'slip.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await fetch(`${API_BASE_URL}/cafe/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // No Content-Type header so fetch handles boundary
        },
        body: formData,
      });

      if (res.ok) {
        Alert.alert("Success", "Your order has been placed!");
        setCart([]);
        setModalVisible(false);
        setActiveTab('menu');
      } else {
        const err = await res.json();
        Alert.alert("Error", err.message || "Failed to place order");
      }
    } catch (error) {
      Alert.alert("Error", "Network error placing order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMenuItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emojiText}>{item.emoji || '☕'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        </View>
      </View>
      <Pressable onPress={() => addToCart(item)} style={styles.addBtn}>
        <Ionicons name="add" size={24} color="#ffffff" />
      </Pressable>
    </View>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => (
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
      
      <View style={styles.quantityControls}>
        <Pressable onPress={() => updateQuantity(item.menuItemId, -1)} style={styles.qtyBtn}>
          <Ionicons name="remove-circle-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <Pressable onPress={() => updateQuantity(item.menuItemId, 1)} style={styles.qtyBtn}>
          <Ionicons name="add-circle-outline" size={28} color="#1A3B2F" />
        </Pressable>
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
          <Text style={styles.headerTitle}>Welcome</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'menu' && styles.tabActive]}
            onPress={() => setActiveTab('menu')}
          >
            <Ionicons name="cafe-outline" size={20} color={activeTab === 'menu' ? '#1A3B2F' : 'rgba(26, 59, 47, 0.4)'} />
            <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>Menu</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'cart' && styles.tabActive]}
            onPress={() => setActiveTab('cart')}
          >
            <View style={styles.cartIconWrapper}>
              <Ionicons name="cart-outline" size={20} color={activeTab === 'cart' ? '#1A3B2F' : 'rgba(26, 59, 47, 0.4)'} />
              {cart.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cart.reduce((s, i) => s + i.quantity, 0)}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabText, activeTab === 'cart' && styles.tabTextActive]}>Cart</Text>
          </Pressable>
        </View>

        {activeTab === 'menu' ? (
          loading ? (
            <View style={styles.loadingArea}>
              <ActivityIndicator size="large" color="#FFD166" />
            </View>
          ) : (
            <FlatList
              data={menuItems}
              keyExtractor={(item) => item._id}
              renderItem={renderMenuItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="cafe-outline" size={48} color="rgba(26, 59, 47, 0.1)" />
                  <Text style={styles.emptyText}>No menu items available.</Text>
                </View>
              }
            />
          )
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={cart}
              keyExtractor={(item) => item.menuItemId}
              renderItem={renderCartItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="cart-outline" size={64} color="#FFD166" />
                  <Text style={styles.emptyCartText}>Your cart is empty... Treat your pet!</Text>
                </View>
              }
            />
            {cart.length > 0 && (
              <View style={styles.checkoutFooter}>
                <View style={styles.subtotalRow}>
                  <Text style={styles.subtotalLabel}>Subtotal</Text>
                  <Text style={styles.subtotalValue}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.footerActions}>
                  <Pressable style={styles.clearBtn} onPress={clearCart}>
                    <Ionicons name="trash-outline" size={18} color="#1A3B2F" />
                    <Text style={styles.clearBtnText}>Clear All</Text>
                  </Pressable>
                  <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
                    <Text style={styles.checkoutBtnText}>Checkout</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.modalTitle}>Upload Payment Slip</Text>
                  <Ionicons name="receipt-outline" size={24} color="#1A3B2F" />
                </View>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#1A3B2F" />
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>
                Please upload a screenshot or photo of your payment receipt to complete your order of ${subtotal.toFixed(2)}.
              </Text>

              <Pressable style={styles.uploadBox} onPress={handlePickImage}>
                {slipImage ? (
                  <Image source={{ uri: slipImage.uri }} style={styles.uploadedImage} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={32} color="#1A3B2F" />
                    <Text style={styles.uploadText}>Select Slip Photo</Text>
                  </>
                )}
              </Pressable>

              <Pressable 
                style={[styles.confirmBtn, isSubmitting && { opacity: 0.7 }]} 
                onPress={confirmOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Order & Slip</Text>
                )}
              </Pressable>

              <Pressable style={styles.goBackBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.goBackText}>Go Back</Text>
              </Pressable>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 59, 47, 0.05)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  cartIconWrapper: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
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
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  emojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 28,
  },
  cardInfo: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 4,
    flexShrink: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D32F2F',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    padding: 4,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A3B2F',
    minWidth: 16,
    textAlign: 'center',
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(26, 59, 47, 0.4)',
  },
  emptyCartText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  checkoutFooter: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  subtotalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.6)',
  },
  subtotalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  clearBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F0FAF5',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  clearBtnText: {
    color: '#1A3B2F',
    fontSize: 16,
    fontWeight: '800',
  },
  checkoutBtn: {
    flex: 2,
    backgroundColor: '#1A3B2F',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.6)',
    lineHeight: 22,
    marginBottom: 24,
  },
  uploadBox: {
    height: 200,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFD166',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 209, 102, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  confirmBtn: {
    backgroundColor: '#FFD166',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmBtnText: {
    color: '#1A3B2F',
    fontSize: 16,
    fontWeight: '900',
  },
  goBackBtn: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBackText: {
    color: '#1A3B2F',
    fontSize: 16,
    fontWeight: '800',
  },
});
