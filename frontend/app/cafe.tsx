import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, FlatList, ActivityIndicator, Image, Alert, Modal, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const AUTH_TOKEN_KEY = "auth:token";

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
  const router = useRouter();
  const [items, setItems] = useState<CafeItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [paymentSlipUri, setPaymentSlipUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cafe/items`);
      const data = await response.json();
      if (response.ok) {
        setItems(data);
      }
    } catch (error) {
      console.error("Fetch cafe items failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: CafeItem) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i._id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i._id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPaymentSlipUri(result.assets[0].uri);
    }
  };

  const handlePlaceOrder = async () => {
    if (!paymentSlipUri) {
      Alert.alert("Error", "Please upload a payment slip to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const filename = paymentSlipUri.split('/').pop() || 'receipt.jpg';
      const ext = filename.split('.').pop() || 'jpg';

      const formData = new FormData();
      formData.append('items', JSON.stringify(cart.map(i => ({
        itemId: i._id,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      }))));
      formData.append('totalPrice', getTotalPrice().toString());
      formData.append('paymentSlip', {
        uri: paymentSlipUri,
        name: filename,
        type: `image/${ext}`
      } as any);

      const response = await fetch(`${API_BASE_URL}/cafe/order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Your order has been placed and is pending verification!");
        setCart([]);
        setCheckoutVisible(false);
        setPaymentSlipUri(null);
        router.back();
      } else {
        throw new Error(data.message || "Failed to place order");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: CafeItem }) => (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.categoryText}>{item.category}</Text>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>Rs. {item.price}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
            <Ionicons name="add" size={20} color="#1A3B2F" />
          </TouchableOpacity>
        </View>
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
          <Text style={styles.headerTitle}>Pet Cafe</Text>
          <TouchableOpacity 
            style={styles.cartButton} 
            onPress={() => cart.length > 0 && setCheckoutVisible(true)}
          >
            <Ionicons name="cart-outline" size={26} color="#1A3B2F" />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FFD166" />
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.hero}>
                <Text style={styles.heroTitle}>Treat your pet (and yourself!)</Text>
                <Text style={styles.heroSub}>Selection of pet-safe drinks and snacks</Text>
              </View>
            }
          />
        )}

        {/* Checkout Modal */}
        <Modal visible={checkoutVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Order</Text>
              <Pressable onPress={() => setCheckoutVisible(false)}>
                <Ionicons name="close" size={28} color="#1A3B2F" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {cart.map(item => (
                <View key={item._id} style={styles.cartItem}>
                  <Image source={{ uri: item.imageUrl }} style={styles.cartItemImage} />
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>Rs. {item.price}</Text>
                    <View style={styles.qtyContainer}>
                      <TouchableOpacity onPress={() => updateQuantity(item._id, -1)} style={styles.qtyBtn}>
                        <Ionicons name="remove" size={16} color="#1A3B2F" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item._id, 1)} style={styles.qtyBtn}>
                        <Ionicons name="add" size={16} color="#1A3B2F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeFromCart(item._id)}>
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.paymentSection}>
                <Text style={styles.paymentTitle}>Payment Verification</Text>
                <Text style={styles.paymentSub}>Please transfer Rs. {getTotalPrice()} to our bank account and upload the receipt.</Text>
                
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Ionicons name={paymentSlipUri ? "checkmark-circle" : "cloud-upload-outline"} size={30} color={paymentSlipUri ? "#4CAF50" : "#1A3B2F"} />
                  <Text style={styles.uploadBtnText}>{paymentSlipUri ? "Receipt Uploaded" : "Upload Payment Slip"}</Text>
                </TouchableOpacity>

                {paymentSlipUri && (
                  <Image source={{ uri: paymentSlipUri }} style={styles.previewImage} />
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Price</Text>
                <Text style={styles.totalAmount}>Rs. {getTotalPrice()}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.placeOrderBtn, (isSubmitting || !paymentSlipUri) && styles.disabledBtn]} 
                onPress={handlePlaceOrder}
                disabled={isSubmitting || !paymentSlipUri}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.placeOrderBtnText}>Place Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FAF5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A3B2F' },
  cartButton: { padding: 5 },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FFD166', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 11, fontWeight: '900', color: '#1A3B2F' },
  list: { padding: 20 },
  hero: { marginBottom: 25 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#1A3B2F' },
  heroSub: { fontSize: 14, color: '#666', marginTop: 5 },
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  itemImage: { width: 120, height: 120 },
  itemInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  categoryText: { fontSize: 10, fontWeight: '800', color: '#FFD166', textTransform: 'uppercase' },
  itemName: { fontSize: 17, fontWeight: '900', color: '#1A3B2F', marginVertical: 2 },
  itemDesc: { fontSize: 12, color: '#888', marginBottom: 8 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemPrice: { fontSize: 16, fontWeight: '900', color: '#1A3B2F' },
  addButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFD166', alignItems: 'center', justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1A3B2F' },
  modalScroll: { padding: 20 },
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cartItemImage: { width: 60, height: 60, borderRadius: 12 },
  cartItemInfo: { flex: 1, marginLeft: 15 },
  cartItemName: { fontSize: 16, fontWeight: '800', color: '#1A3B2F' },
  cartItemPrice: { fontSize: 14, color: '#666' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 10 },
  qtyBtn: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '700' },
  paymentSection: { marginTop: 30, padding: 20, backgroundColor: '#F0FAF5', borderRadius: 20 },
  paymentTitle: { fontSize: 18, fontWeight: '900', color: '#1A3B2F', marginBottom: 5 },
  paymentSub: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 20 },
  uploadBtn: { height: 100, borderStyle: 'dashed', borderWidth: 2, borderColor: '#1A3B2F', borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 10 },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: '#1A3B2F' },
  previewImage: { width: '100%', height: 200, borderRadius: 15, marginTop: 15 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 16, color: '#666' },
  totalAmount: { fontSize: 22, fontWeight: '900', color: '#1A3B2F' },
  placeOrderBtn: { height: 56, borderRadius: 16, backgroundColor: '#1A3B2F', alignItems: 'center', justifyContent: 'center' },
  placeOrderBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  disabledBtn: { opacity: 0.5 },
});
