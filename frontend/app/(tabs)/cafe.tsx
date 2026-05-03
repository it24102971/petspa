import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable, FlatList,
  ActivityIndicator, Alert, Modal, ScrollView, Image,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSidebar } from '@/context/SidebarContext';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const AUTH_TOKEN_KEY = 'auth:token';

// Map item name keywords → emoji for icon
const getItemEmoji = (name: string, category: string): string => {
  const n = name.toLowerCase();
  if (n.includes('tuna') || n.includes('cat')) return '🐱';
  if (n.includes('puppy') || n.includes('dog') || n.includes('paw')) return '🐶';
  if (n.includes('yogurt') || n.includes('cup')) return '🥛';
  if (n.includes('marshmallow') || n.includes('cloud')) return '☁️';
  if (n.includes('rainbow') || n.includes('shake')) return '🌈';
  if (n.includes('latte') || n.includes('late') || n.includes('coffee')) return '☕';
  if (n.includes('cupcake') || n.includes('cake')) return '🧁';
  if (n.includes('cookie') || n.includes('biscuit')) return '🍪';
  if (n.includes('tart') || n.includes('bow')) return '🍰';
  if (n.includes('juice') || n.includes('drink')) return '🥤';
  if (n.includes('treat') || n.includes('snack')) return '🦴';
  if (n.includes('meal') || n.includes('bowl')) return '🍱';
  const cat = category.toLowerCase();
  if (cat.includes('drink')) return '🥤';
  if (cat.includes('snack')) return '🍪';
  if (cat.includes('treat')) return '🦴';
  if (cat.includes('meal')) return '🍱';
  if (cat.includes('dessert')) return '🍰';
  return '🐾';
};

interface CafeItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

interface CartItem extends CafeItem { quantity: number; }

export default function CafeScreen() {
  const { openSidebar } = useSidebar();
  const [items, setItems] = useState<CafeItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<CafeItem | null>(null);
  const [paymentSlipUri, setPaymentSlipUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cafe/items`);
      const data = await res.json();
      if (res.ok) setItems(data);
    } catch (e) { console.error('Fetch cafe items failed:', e); }
    finally { setLoading(false); }
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
      allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled) setPaymentSlipUri(result.assets[0].uri);
  };

  const handlePlaceOrder = async () => {
    if (!paymentSlipUri) { Alert.alert('Error', 'Please upload a payment slip.'); return; }
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
        Alert.alert('✅ Order Placed!', 'Your order is pending admin verification.');
        setCart([]); setCheckoutVisible(false); setPaymentSlipUri(null);
      } else throw new Error(data.message || 'Failed to place order');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not place order.');
    } finally { setIsSubmitting(false); }
  };

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];
  const filtered = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);
  const inCartItem = (id: string) => cart.find(c => c._id === id);

  const renderItem = ({ item }: { item: CafeItem }) => {
    const emoji = getItemEmoji(item.name, item.category);
    const inCart = inCartItem(item._id);
    return (
      <TouchableOpacity style={styles.gridCard} onPress={() => setDetailItem(item)} activeOpacity={0.7}>
        <View style={styles.gridInfo}>
          <Text style={[styles.gridName, { flex: 1 }]}>{emoji} {item.name}</Text>
          <Text style={styles.gridPrice}>Rs. {item.price}</Text>
        </View>
        {inCart && (
          <View style={styles.gridBadge}>
            <Text style={styles.gridBadgeText}>{inCart.quantity}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={openSidebar} style={styles.headerBtn}>
            <Ionicons name="menu-outline" size={26} color="#1A3B2F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pet Cafe ☕</Text>
          <TouchableOpacity
            style={[styles.headerBtn, cartCount > 0 && { backgroundColor: '#FFD166' }]}
            onPress={() => cart.length > 0 && setCheckoutVisible(true)}
          >
            <Ionicons name="cart-outline" size={24} color="#1A3B2F" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Category pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catPillText, activeCategory === cat && styles.catPillTextActive]}>
                {cat === 'All' ? '🍽️ All' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FFD166" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={{ fontSize: 48 }}>🍽️</Text>
                <Text style={{ color: '#999', marginTop: 10 }}>No items available</Text>
              </View>
            }
          />
        )}

        {/* Cart FAB */}
        {cart.length > 0 && (
          <TouchableOpacity style={styles.fab} onPress={() => setCheckoutVisible(true)}>
            <Ionicons name="cart" size={22} color="#1A3B2F" />
            <Text style={styles.fabText}>View Order  •  Rs. {totalPrice}</Text>
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{cartCount}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Item Detail Modal */}
        <Modal visible={!!detailItem} animationType="slide" transparent>
          <View style={styles.detailOverlay}>
            <View style={styles.detailSheet}>
              {detailItem && (() => {
                const emoji = getItemEmoji(detailItem.name, detailItem.category);
                const inCart = inCartItem(detailItem._id);
                return (
                  <>
                    <View style={styles.detailIconBox}>
                      {detailItem.imageUrl ? (
                        <Image source={{ uri: getImageUrl(detailItem.imageUrl) }} style={styles.detailImage} resizeMode="cover" />
                      ) : (
                        <Text style={{ fontSize: 72 }}>{emoji}</Text>
                      )}
                    </View>
                    <Text style={styles.detailName}>{detailItem.name}</Text>
                    <Text style={styles.detailCategory}>{detailItem.category}</Text>
                    <Text style={styles.detailDesc}>{detailItem.description}</Text>
                    <Text style={styles.detailPrice}>Rs. {detailItem.price}</Text>

                    {inCart ? (
                      <View style={styles.detailQty}>
                        <TouchableOpacity style={styles.qtyBtnLg} onPress={() => {
                          if (inCart.quantity === 1) removeFromCart(detailItem._id);
                          else updateQty(detailItem._id, -1);
                        }}>
                          <Ionicons name="remove" size={24} color="#1A3B2F" />
                        </TouchableOpacity>
                        <Text style={styles.qtyNumLg}>{inCart.quantity}</Text>
                        <TouchableOpacity style={[styles.qtyBtnLg, { backgroundColor: '#FFD166' }]} onPress={() => addToCart(detailItem)}>
                          <Ionicons name="add" size={24} color="#1A3B2F" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.addToCartBtn} onPress={() => { addToCart(detailItem); setDetailItem(null); }}>
                        <Ionicons name="cart-outline" size={20} color="#1A3B2F" />
                        <Text style={styles.addToCartText}>Add to Order</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailItem(null)}>
                      <Text style={styles.closeBtnText}>Close</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>
          </View>
        </Modal>

        {/* Checkout Modal */}
        <Modal visible={checkoutVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🛒 Your Order</Text>
              <TouchableOpacity onPress={() => setCheckoutVisible(false)} style={styles.headerBtn}>
                <Ionicons name="close" size={28} color="#1A3B2F" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {cart.map(item => (
                <View key={item._id} style={styles.cartRow}>
                  <View style={styles.cartIconBox}>
                    {item.imageUrl ? (
                      <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.cartIconBoxImage} resizeMode="cover" />
                    ) : (
                      <Text style={{ fontSize: 32 }}>{getItemEmoji(item.name, item.category)}</Text>
                    )}
                  </View>
                  <View style={styles.cartRowInfo}>
                    <Text style={styles.cartRowName}>{item.name}</Text>
                    <Text style={styles.cartRowSub}>Rs. {item.price} × {item.quantity}</Text>
                  </View>
                  <View style={styles.cartRowRight}>
                    <Text style={styles.cartRowTotal}>Rs. {item.price * item.quantity}</Text>
                    <View style={styles.cartQtyRow}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => {
                        if (item.quantity === 1) removeFromCart(item._id);
                        else updateQty(item._id, -1);
                      }}>
                        <Ionicons name="remove" size={20} color="#1A3B2F" />
                      </TouchableOpacity>
                      <Text style={styles.qtyNum}>{item.quantity}</Text>
                      <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: '#FFD166' }]} onPress={() => updateQty(item._id, 1)}>
                        <Ionicons name="add" size={20} color="#1A3B2F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              <View style={styles.paySection}>
                <Text style={styles.payTitle}>💳 Payment</Text>
                <Text style={styles.paySub}>Transfer Rs. {totalPrice} to our account and upload the receipt below.</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Ionicons name={paymentSlipUri ? 'checkmark-circle' : 'cloud-upload-outline'} size={32} color={paymentSlipUri ? '#4CAF50' : '#1A3B2F'} />
                  <Text style={styles.uploadText}>{paymentSlipUri ? '✅ Receipt Uploaded' : 'Upload Payment Slip'}</Text>
                </TouchableOpacity>
                {paymentSlipUri && (
                  <Image source={{ uri: paymentSlipUri }} style={styles.previewImg} resizeMode="cover" />
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>Rs. {totalPrice}</Text>
              </View>
              <TouchableOpacity
                style={[styles.placeBtn, (!paymentSlipUri || isSubmitting) && { opacity: 0.45 }]}
                onPress={handlePlaceOrder}
                disabled={!paymentSlipUri || isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#1A3B2F" /> : <Text style={styles.placeBtnText}>🛍️ Place Order</Text>}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF5EF' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#EEF5EF' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A3B2F' },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#1A3B2F', borderRadius: 10, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  cartBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFD166' },

  // Categories
  catRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  catPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: '#fff' },
  catPillActive: { backgroundColor: '#FFD166' },
  catPillText: { fontSize: 13, fontWeight: '700', color: '#888' },
  catPillTextActive: { color: '#1A3B2F' },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },

  // Grid items
  gridWrapper: { justifyContent: 'flex-start', gap: 10 },
  gridCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  gridIconBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: { width: '100%', height: '100%' },
  gridEmoji: { fontSize: 32 },
  gridInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gridName: { fontSize: 16, fontWeight: '800', color: '#1A3B2F' },
  gridPrice: { fontSize: 14, fontWeight: '700', color: '#888' },
  gridBadge: {
    backgroundColor: '#FFD166',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  gridBadgeText: { fontSize: 10, fontWeight: '900', color: '#1A3B2F' },

  // List Row (legacy/other)
  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  iconBox: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  iconBoxImage: { width: 60, height: 60 },
  iconBoxEmoji: { fontSize: 34 },
  listInfo: { flex: 1, marginLeft: 14 },
  listName: { fontSize: 16, fontWeight: '800', color: '#1A3B2F' },
  listPrice: { fontSize: 14, fontWeight: '600', color: '#888', marginTop: 3 },
  inlineQty: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 16, fontWeight: '900', color: '#1A3B2F', minWidth: 22, textAlign: 'center' },

  // FAB
  fab: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#FFD166', borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  fabText: { flex: 1, fontSize: 15, fontWeight: '900', color: '#1A3B2F' },
  fabBadge: { backgroundColor: '#1A3B2F', borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  fabBadgeText: { color: '#FFD166', fontSize: 12, fontWeight: '900' },

  // Detail sheet
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  detailSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, alignItems: 'center' },
  detailIconBox: { width: 130, height: 130, borderRadius: 32, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 16 },
  detailImage: { width: 130, height: 130 },
  detailName: { fontSize: 22, fontWeight: '900', color: '#1A3B2F', textAlign: 'center' },
  detailCategory: { fontSize: 12, fontWeight: '700', color: '#FFD166', marginTop: 4, textTransform: 'uppercase' },
  detailDesc: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 10, lineHeight: 20, paddingHorizontal: 10 },
  detailPrice: { fontSize: 26, fontWeight: '900', color: '#1A3B2F', marginTop: 16, marginBottom: 20 },
  detailQty: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  qtyBtnLg: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center' },
  qtyNumLg: { fontSize: 24, fontWeight: '900', color: '#1A3B2F', minWidth: 32, textAlign: 'center' },
  addToCartBtn: { flexDirection: 'row', backgroundColor: '#FFD166', borderRadius: 16, paddingHorizontal: 30, paddingVertical: 18, alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center', marginBottom: 12 },
  addToCartText: { fontSize: 17, fontWeight: '900', color: '#1A3B2F' },
  closeBtn: { paddingVertical: 14, width: '100%', alignItems: 'center' },
  closeBtnText: { fontSize: 15, fontWeight: '700', color: '#aaa' },

  // Checkout modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1A3B2F' },
  modalScroll: { padding: 20 },

  // Checkout cart rows — icon = 60×60, qty buttons = 40×40
  cartRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FBF9', borderRadius: 16, padding: 12, marginBottom: 12, gap: 12 },
  cartIconBox: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cartIconBoxImage: { width: 60, height: 60 },
  cartRowInfo: { flex: 1 },
  cartRowName: { fontSize: 15, fontWeight: '800', color: '#1A3B2F' },
  cartRowSub: { fontSize: 12, color: '#999', marginTop: 2 },
  cartRowRight: { alignItems: 'flex-end', gap: 6 },
  cartRowTotal: { fontSize: 14, fontWeight: '900', color: '#1A3B2F' },
  cartQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  paySection: { marginTop: 16, backgroundColor: '#F0FAF5', borderRadius: 20, padding: 20 },
  payTitle: { fontSize: 18, fontWeight: '900', color: '#1A3B2F', marginBottom: 6 },
  paySub: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 16 },
  uploadBtn: { height: 100, borderStyle: 'dashed', borderWidth: 2, borderColor: '#1A3B2F', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff' },
  uploadText: { fontSize: 14, fontWeight: '700', color: '#1A3B2F' },
  previewImg: { width: '100%', height: 200, borderRadius: 16, marginTop: 14 },

  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#666' },
  totalAmount: { fontSize: 24, fontWeight: '900', color: '#1A3B2F' },
  placeBtn: { backgroundColor: '#FFD166', height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  placeBtnText: { color: '#1A3B2F', fontSize: 18, fontWeight: '900' },
});
