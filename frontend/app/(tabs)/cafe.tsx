import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable, FlatList,
  ActivityIndicator, Image, Alert, Modal, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSidebar } from '@/context/SidebarContext';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const AUTH_TOKEN_KEY = 'auth:token';

const CATEGORY_ICONS: Record<string, string> = {
  'Drinks':   '🥤',
  'Snacks':   '🍪',
  'Meals':    '🍱',
  'Treats':   '🦴',
  'Desserts': '🍰',
  'default':  '🐾',
};

interface CafeItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

interface CartItem extends CafeItem {
  quantity: number;
}

export default function CafeScreen() {
  const { openSidebar } = useSidebar();
  const [items, setItems] = useState<CafeItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [paymentSlipUri, setPaymentSlipUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cafe/items`);
      const data = await res.json();
      if (res.ok) setItems(data);
    } catch (e) {
      console.error('Fetch cafe items failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url}`;
  };

  const addToCart = (item: CafeItem) => {
    setCart(prev => {
      const ex = prev.find(i => i._id === item._id);
      if (ex) return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i._id !== id));

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i._id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setPaymentSlipUri(result.assets[0].uri);
  };

  const handlePlaceOrder = async () => {
    if (!paymentSlipUri) {
      Alert.alert('Error', 'Please upload a payment slip to continue.');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const filename = paymentSlipUri.split('/').pop() || 'receipt.jpg';
      const ext = filename.split('.').pop() || 'jpg';
      const formData = new FormData();
      formData.append('items', JSON.stringify(cart.map(i => ({ itemId: i._id, name: i.name, price: i.price, quantity: i.quantity }))));
      formData.append('totalPrice', totalPrice.toString());
      formData.append('paymentSlip', { uri: paymentSlipUri, name: filename, type: `image/${ext}` } as any);

      const res = await fetch(`${API_BASE_URL}/cafe/order`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅ Order Placed!', 'Your order is pending verification by admin.');
        setCart([]);
        setCheckoutVisible(false);
        setPaymentSlipUri(null);
      } else {
        throw new Error(data.message || 'Failed to place order');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];
  const filtered = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);

  const renderItem = ({ item, index }: { item: CafeItem; index: number }) => {
    const inCart = cart.find(c => c._id === item._id);
    const catEmoji = CATEGORY_ICONS[item.category] || CATEGORY_ICONS['default'];
    return (
      <View style={[styles.card, index % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 }]}>
        <View style={styles.imageWrapper}>
          {item.imageUrl ? (
            <Image
              source={{ uri: getImageUrl(item.imageUrl) }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ fontSize: 56 }}>{catEmoji}</Text>
            </View>
          )}
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{catEmoji} {item.category}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>Rs. {item.price}</Text>
            {inCart ? (
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item._id, -1)}>
                  <Ionicons name="remove" size={18} color="#1A3B2F" />
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{inCart.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                  <Ionicons name="add" size={18} color="#1A3B2F" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                <Ionicons name="add" size={22} color="#1A3B2F" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={openSidebar} style={styles.iconBtn}>
            <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>☕</Text>
            <Text style={styles.headerTitle}>Pet Cafe</Text>
          </View>
          <TouchableOpacity
            style={styles.cartIconBtn}
            onPress={() => cart.length > 0 && setCheckoutVisible(true)}
          >
            <Ionicons name="cart-outline" size={26} color="#1A3B2F" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Treat your pet 🐾</Text>
          <Text style={styles.heroSub}>Pet-safe drinks, snacks & meals made with love</Text>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catPillText, activeCategory === cat && styles.catPillTextActive]}>
                {cat === 'All' ? '🍽️ All' : `${CATEGORY_ICONS[cat] || '🐾'} ${cat}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Items Grid */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FFD166" />
            <Text style={{ marginTop: 12, color: '#999' }}>Loading menu...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centered}>
            <Text style={{ fontSize: 48 }}>🍽️</Text>
            <Text style={{ marginTop: 12, fontSize: 16, color: '#999' }}>No items available</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Cart FAB */}
        {cart.length > 0 && (
          <TouchableOpacity style={styles.cartFab} onPress={() => setCheckoutVisible(true)}>
            <Ionicons name="cart" size={22} color="#1A3B2F" />
            <Text style={styles.cartFabText}>View Order • Rs. {totalPrice}</Text>
            <View style={styles.cartFabBadge}>
              <Text style={styles.cartFabBadgeText}>{cartCount}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Checkout Modal */}
        <Modal visible={checkoutVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🛒 Your Order</Text>
              <TouchableOpacity onPress={() => setCheckoutVisible(false)} style={styles.iconBtn}>
                <Ionicons name="close" size={28} color="#1A3B2F" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {cart.map(item => (
                <View key={item._id} style={styles.cartRow}>
                  {item.imageUrl ? (
                    <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.cartRowImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cartRowImg, styles.cartRowImgPlaceholder]}>
                      <Text style={{ fontSize: 36 }}>{CATEGORY_ICONS[item.category] || '🐾'}</Text>
                    </View>
                  )}
                  <View style={styles.cartRowInfo}>
                    <Text style={styles.cartRowName}>{item.name}</Text>
                    <Text style={styles.cartRowPrice}>Rs. {item.price} × {item.quantity} = <Text style={{ color: '#FFD166', fontWeight: '900' }}>Rs. {item.price * item.quantity}</Text></Text>
                    <View style={styles.cartRowQty}>
                      <TouchableOpacity style={styles.qtyBtnMd} onPress={() => updateQty(item._id, -1)}>
                        <Ionicons name="remove" size={20} color="#1A3B2F" />
                      </TouchableOpacity>
                      <Text style={styles.qtyNumMd}>{item.quantity}</Text>
                      <TouchableOpacity style={styles.qtyBtnMd} onPress={() => updateQty(item._id, 1)}>
                        <Ionicons name="add" size={20} color="#1A3B2F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeFromCart(item._id)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Payment */}
              <View style={styles.paySection}>
                <Text style={styles.payTitle}>💳 Payment</Text>
                <Text style={styles.paySub}>Transfer Rs. {totalPrice} to our account and upload the receipt below.</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Ionicons
                    name={paymentSlipUri ? 'checkmark-circle' : 'cloud-upload-outline'}
                    size={32}
                    color={paymentSlipUri ? '#4CAF50' : '#1A3B2F'}
                  />
                  <Text style={styles.uploadBtnText}>
                    {paymentSlipUri ? '✅ Receipt Uploaded' : 'Upload Payment Slip'}
                  </Text>
                </TouchableOpacity>
                {paymentSlipUri && (
                  <Image source={{ uri: paymentSlipUri }} style={styles.previewImage} resizeMode="cover" />
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>Rs. {totalPrice}</Text>
              </View>
              <TouchableOpacity
                style={[styles.placeOrderBtn, (!paymentSlipUri || isSubmitting) && styles.disabledBtn]}
                onPress={handlePlaceOrder}
                disabled={!paymentSlipUri || isSubmitting}
              >
                {isSubmitting
                  ? <ActivityIndicator color="#1A3B2F" />
                  : <Text style={styles.placeOrderText}>🛍️ Place Order</Text>
                }
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A3B2F' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F0FAF5' },
  cartIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F0FAF5' },
  cartBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#FFD166', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cartBadgeText: { fontSize: 10, fontWeight: '900', color: '#1A3B2F' },

  // Hero
  hero: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#1A3B2F' },
  heroSub: { fontSize: 13, color: '#888', marginTop: 4 },

  // Categories
  catScroll: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  catPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0' },
  catPillActive: { backgroundColor: '#FFD166', borderColor: '#FFD166' },
  catPillText: { fontSize: 13, fontWeight: '700', color: '#666' },
  catPillTextActive: { color: '#1A3B2F' },

  // Grid
  grid: { paddingHorizontal: 16, paddingBottom: 120 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Card  — ALL image slots = 160, ALL action buttons = 44×44
  card: { width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  imageWrapper: { width: '100%', height: 160, position: 'relative' },
  cardImage: { width: '100%', height: 160 },
  imagePlaceholder: { width: '100%', height: 160, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center' },
  categoryPill: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(26,59,47,0.85)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  categoryPillText: { fontSize: 10, fontWeight: '800', color: '#FFD166' },
  cardBody: { padding: 12 },
  cardName: { fontSize: 15, fontWeight: '900', color: '#1A3B2F' },
  cardDesc: { fontSize: 11, color: '#999', marginTop: 3, marginBottom: 10, lineHeight: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { fontSize: 15, fontWeight: '900', color: '#1A3B2F' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFD166', alignItems: 'center', justifyContent: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 15, fontWeight: '900', color: '#1A3B2F', minWidth: 20, textAlign: 'center' },

  // FAB
  cartFab: { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: '#FFD166', borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  cartFabText: { flex: 1, fontSize: 16, fontWeight: '900', color: '#1A3B2F' },
  cartFabBadge: { backgroundColor: '#1A3B2F', borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  cartFabBadgeText: { color: '#FFD166', fontSize: 12, fontWeight: '900' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1A3B2F' },
  modalScroll: { padding: 20 },

  // Cart rows — cart image = 80×80, qty buttons = 44×44
  cartRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FBF9', borderRadius: 16, padding: 12, marginBottom: 14, gap: 12 },
  cartRowImg: { width: 80, height: 80, borderRadius: 16 },
  cartRowImgPlaceholder: { backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center' },
  cartRowInfo: { flex: 1 },
  cartRowName: { fontSize: 15, fontWeight: '900', color: '#1A3B2F' },
  cartRowPrice: { fontSize: 12, color: '#888', marginTop: 3 },
  cartRowQty: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  qtyBtnMd: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  qtyNumMd: { fontSize: 17, fontWeight: '900', color: '#1A3B2F', minWidth: 24, textAlign: 'center' },

  // Payment
  paySection: { marginTop: 16, backgroundColor: '#F0FAF5', borderRadius: 20, padding: 20 },
  payTitle: { fontSize: 18, fontWeight: '900', color: '#1A3B2F', marginBottom: 6 },
  paySub: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 16 },
  uploadBtn: { height: 100, borderStyle: 'dashed', borderWidth: 2, borderColor: '#1A3B2F', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff' },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: '#1A3B2F' },
  previewImage: { width: '100%', height: 200, borderRadius: 16, marginTop: 14 },

  // Modal footer
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#666' },
  totalAmount: { fontSize: 24, fontWeight: '900', color: '#1A3B2F' },
  placeOrderBtn: { backgroundColor: '#FFD166', height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  placeOrderText: { color: '#1A3B2F', fontSize: 18, fontWeight: '900' },
  disabledBtn: { opacity: 0.45 },
});
