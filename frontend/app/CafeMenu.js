import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  SafeAreaView,
  Alert,
  Modal,
  Image,
  TextInput,
  ScrollView,
  Dimensions,
  Linking
} from 'react-native';
import { 
  Coffee, 
  ShoppingCart, 
  ChevronLeft, 
  Trash2, 
  Edit2, 
  Plus, 
  Camera, 
  X, 
  PlusCircle, 
  MinusCircle, 
  Trash,
  User,
  Settings,
  Download
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../constants/AuthContext';
import BACKEND_URL from '../constants/config';

const { width } = Dimensions.get('window');

const THEME = {
  primary: '#F06292', // Lighter Pink for active tab
  secondary: '#FFF1F3', // Very Light Pink
  accent: '#D81B60', // Dark Pink for Navbar
  text: '#880E4F', // Deep Pink/Maroon for text
  white: '#FFFFFF',
  cardBg: '#FFFFFF',
  dot: '#FFFFFF',
};

export default function CafeMenu({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [treats, setTreats] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'cart', or 'orders'
  const [orders, setOrders] = useState([]);

  const isAdmin = user?.role === 'admin';

  // Form State for Admin
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTreat, setEditingTreat] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Drinks');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Checkout State
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [slipImage, setSlipImage] = useState(null);

  // Admin Slip Viewing
  const [viewSlipImage, setViewSlipImage] = useState(null);


  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin && activeTab === 'orders') {
        const res = await fetch(`${BACKEND_URL}/api/orders`, {
          headers: { 'Authorization': `Bearer ${user?.token}` }
        });
        const data = await res.json();
        setOrders(data);
      } else {
        const res = await fetch(`${BACKEND_URL}/api/treats`);
        const data = await res.json();
        setTreats(data);
      }
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === itemId);
      if (existing.quantity > 1) {
        return prev.map(i => i._id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i._id !== itemId);
    });
  };

  const clearCart = () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to empty your cart?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", onPress: () => setCart([]), style: "destructive" }
      ]
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const pickImage = async (type = 'treat') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      if (type === 'slip') setSlipImage(result.assets[0].uri);
      else setImage(result.assets[0].uri);
    }
  };

  const handleCheckout = async () => {
    if (!slipImage) {
      Alert.alert('Payment Slip Required', 'Please upload your payment slip to complete the order! 🐾');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload Slip
      const formData = new FormData();
      formData.append('image', { uri: slipImage, name: 'slip.jpg', type: 'image/jpeg' });
      
      const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        // React Native fetch handles boundary automatically
      });
      const uploadData = await uploadRes.json();
      const paymentSlip = uploadData.image;

      // 2. Create Order
      const orderPayload = {
        items: cart.map(item => ({ name: item.name, price: item.price, emoji: item.emoji || '🧁' })),
        total: subtotal,
        paymentSlip
      };

      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        Alert.alert('Success! ✨', 'Your order has been placed. We will check your slip soon!');
        setCart([]);
        setSlipImage(null);
        setCheckoutModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while placing your order.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTreat = async () => {
    if (!name || !price) {
      Alert.alert('Error', 'Please fill name and price');
      return;
    }
    setUploading(true);
    let imageUrl = editingTreat?.imageUrl || '';
    try {
      if (image && !image.startsWith('/uploads')) {
        const formData = new FormData();
        formData.append('image', { uri: image, name: 'treat.jpg', type: 'image/jpeg' });
        const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.image;
      }
      const payload = { name, price: parseFloat(price), category, imageUrl };
      const endpoint = editingTreat ? `${BACKEND_URL}/api/treats/${editingTreat._id}` : `${BACKEND_URL}/api/treats`;
      const method = editingTreat ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) { resetForm(); fetchData(); }
    } catch (error) {
      Alert.alert('Error', 'Failed to save treat');
    } finally { setUploading(false); }
  };

  const deleteTreat = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/treats/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      fetchData();
    } catch (error) { Alert.alert('Error', 'Could not delete item'); }
  };

  const updateOrderStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update order status');
    }
  };


  const resetForm = () => {
    setModalVisible(false);
    setEditingTreat(null);
    setName('');
    setPrice('');
    setImage(null);
  };

  const PolkaDots = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={{ flex: 1, backgroundColor: THEME.secondary, flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: 100 }).map((_, i) => (
          <View key={i} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.dot, opacity: 0.5 }} />
          </View>
        ))}
      </View>
    </View>
  );

  const renderTreatCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardImageWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: `${BACKEND_URL}${item.imageUrl}` }} style={styles.treatImage} />
        ) : (
          <Text style={styles.emojiText}>{item.emoji || '🧁'}</Text>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.treatName}>{item.name}</Text>
        <Text style={styles.treatPrice}>${item.price.toFixed(2)}</Text>
      </View>
      {isAdmin ? (
        <View style={styles.adminActions}>
          <TouchableOpacity onPress={() => { setEditingTreat(item); setName(item.name); setPrice(item.price.toString()); setCategory(item.category); setImage(item.imageUrl ? `${BACKEND_URL}${item.imageUrl}` : null); setModalVisible(true); }}>
            <Edit2 size={20} color={THEME.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteTreat(item._id)} style={{ marginLeft: 15 }}>
            <Trash2 size={20} color="#FF5252" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity onPress={() => removeFromCart(item._id)}>
          <MinusCircle size={22} color={THEME.accent} />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => addToCart(item)}>
          <PlusCircle size={22} color={THEME.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Dark Navbar */}
      <View style={styles.navbar}>
        <View style={{ width: 40 }} />
        <View style={styles.headerTitleWrap}>
          <Text style={styles.bowIcon}>🎀</Text>
          <Text style={styles.navbarTitle}>Welcome</Text>
        </View>
        <View style={styles.navActions}>
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={() => {
              Alert.alert("Logout", "Are you sure?", [{text: "No"}, {text: "Yes", onPress: () => logout()}]);
            }}
          >
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PolkaDots />

      <View style={styles.content}>
        {/* Sub-navbar for Customer View */}
        <View style={styles.tabBar}>
          {isAdmin ? (
            <>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'menu' && styles.tabActive]} 
                onPress={() => setActiveTab('menu')}
              >
                <Coffee size={20} color={activeTab === 'menu' ? 'white' : THEME.accent} />
                <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'orders' && styles.tabActive]} 
                onPress={() => setActiveTab('orders')}
              >
                <ShoppingCart size={20} color={activeTab === 'orders' ? 'white' : THEME.accent} />
                <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>Orders</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'menu' && styles.tabActive]} 
                onPress={() => setActiveTab('menu')}
              >
                <Coffee size={20} color={activeTab === 'menu' ? 'white' : THEME.accent} />
                <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>Menu</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'cart' && styles.tabActive]} 
                onPress={() => setActiveTab('cart')}
              >
                <View>
                  <ShoppingCart size={20} color={activeTab === 'cart' ? 'white' : THEME.accent} />
                  {cart.length > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{cart.reduce((a, b) => a + b.quantity, 0)}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabText, activeTab === 'cart' && styles.tabTextActive]}>Cart</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator size="large" color={THEME.accent} style={{ marginTop: 50 }} />
          ) : (
            <>
              {activeTab === 'menu' ? (
                <>
                  {isAdmin && (
                    <View style={styles.adminHeader}>
                      <Text style={styles.adminTitle}>Admin Menu Manager</Text>
                      <TouchableOpacity style={styles.addTreatBtn} onPress={() => setModalVisible(true)}>
                        <Plus size={20} color="white" />
                        <Text style={styles.addTreatText}>Add New</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <FlatList
                    data={treats}
                    keyExtractor={(item) => item._id}
                    renderItem={renderTreatCard}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyMsg}>No treats available yet! 🧁</Text>}
                  />
                </>
              ) : activeTab === 'cart' ? (
                <View style={{ flex: 1 }}>
                  <FlatList
                    data={cart}
                    keyExtractor={(item) => item._id}
                    renderItem={renderCartItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                      <View style={styles.emptyCart}>
                        <Text style={styles.emptyCartEmoji}>🛒</Text>
                        <Text style={styles.emptyCartMsg}>Your cart is empty... Treat your pet!</Text>
                      </View>
                    }
                  />
                  {cart.length > 0 && (
                    <View style={styles.cartFooter}>
                      <View style={styles.subtotalRow}>
                        <Text style={styles.subtotalLabel}>Subtotal</Text>
                        <Text style={styles.subtotalValue}>${subtotal.toFixed(2)}</Text>
                      </View>
                      <View style={styles.footerActions}>
                        <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
                          <Trash size={18} color="white" />
                          <Text style={styles.footerBtnText}>Clear All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.checkoutBtn} onPress={() => setCheckoutModalVisible(true)}>
                          <Text style={styles.footerBtnText}>Checkout</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                /* Orders View for Admin */
                <FlatList
                  data={orders}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <View style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.orderId}>Order: #{item._id.slice(-6)}</Text>
                          <Text style={[
                            styles.orderStatus, 
                            item.status === 'Verified' ? styles.statusVerified : styles.statusPending
                          ]}>
                            {item.status || 'Pending'}
                          </Text>
                        </View>
                        <TouchableOpacity style={styles.deleteOrderBtn} onPress={() => {
                          Alert.alert("Delete Order", "Are you sure?", [
                            { text: "No" },
                            { text: "Yes", onPress: async () => {
                              await fetch(`${BACKEND_URL}/api/orders/${item._id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${user?.token}` }
                              });
                              fetchData();
                            }}
                          ]);
                        }}>
                          <Trash2 size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.orderItems}>
                        {item.items.map((i, idx) => (
                          <Text key={idx} style={styles.orderItemText}>{i.emoji} {i.name} x{i.quantity || 1} (${i.price.toFixed(2)})</Text>
                        ))}
                      </View>
                      <View style={styles.orderFooter}>
                        <View>
                          <Text style={styles.orderTotal}>Total: ${item.total.toFixed(2)}</Text>
                          {item.status !== 'Verified' && (
                            <TouchableOpacity style={styles.verifyBtn} onPress={() => updateOrderStatus(item._id, 'Verified')}>
                              <Text style={styles.verifyBtnText}>Verify Payment</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        {item.paymentSlip ? (
                          <TouchableOpacity style={styles.downloadBtnCard} onPress={() => {
                            const slipUrl = item.paymentSlip.replace('/src/uploads', '/uploads');
                            Linking.openURL(`${BACKEND_URL}${slipUrl}`);
                          }}>
                            <Download size={16} color="white" />
                            <Text style={styles.downloadBtnCardText}>Download Slip</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.noSlip}>No slip uploaded</Text>
                        )}
                      </View>
                    </View>
                  )}
                  contentContainerStyle={styles.list}
                  ListEmptyComponent={<Text style={styles.emptyMsg}>No orders to review yet. 🐾</Text>}
                />
              )}
            </>
          )}
        </View>
      </View>

      {/* Admin Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingTreat ? 'Edit Treat' : 'Add New Treat'} 🧁</Text>
              <TouchableOpacity onPress={resetForm}><X size={24} color={THEME.text} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.imageSelector} onPress={pickImage}>
                {image ? <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} /> : (
                  <View style={{ alignItems: 'center' }}>
                    <Camera size={40} color={THEME.primary} />
                    <Text style={{ color: THEME.primary, marginTop: 10, fontWeight: '600' }}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.label}>Item Name</Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="e.g. Puppy Latte"
              />
              <Text style={styles.label}>Price ($)</Text>
              <TextInput 
                style={styles.input} 
                value={price} 
                onChangeText={setPrice} 
                keyboardType="numeric"
                placeholder="0.00"
              />
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {['Drinks', 'Pastries', 'Snacks'].map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.catBtn, category === cat && styles.catBtnActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveTreat}>
                {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Treat</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Checkout Modal */}
      <Modal visible={checkoutModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Payment Slip 🧾</Text>
              <TouchableOpacity onPress={() => setCheckoutModalVisible(false)}><X size={24} color={THEME.text} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.instructionText}>Please upload a screenshot or photo of your payment receipt to complete your order of ${subtotal.toFixed(2)}.</Text>
              
              <TouchableOpacity style={styles.imageSelector} onPress={() => pickImage('slip')}>
                {slipImage ? <Image source={{ uri: slipImage }} style={{ width: '100%', height: '100%' }} /> : (
                  <View style={{ alignItems: 'center' }}>
                    <Camera size={40} color={THEME.primary} />
                    <Text style={{ color: THEME.primary, marginTop: 10, fontWeight: '600' }}>Select Slip Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleCheckout} disabled={uploading}>
                {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Confirm Order & Slip</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelLink} onPress={() => setCheckoutModalVisible(false)}>
                <Text style={styles.cancelLinkText}>Go Back</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.secondary },
  navbar: { 
    height: 60, 
    backgroundColor: THEME.accent, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 10
  },
  navBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  navActions: { flexDirection: 'row', alignItems: 'center' },
  logoutBtn: { backgroundColor: '#F48FB1', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  logoutBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  bowIcon: { fontSize: 24, marginRight: 8 },
  navbarTitle: { color: 'white', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  content: { flex: 1, zIndex: 1 },
  tabBar: { 
    flexDirection: 'row', 
    margin: 15, 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row', 
    paddingVertical: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 15 
  },
  tabActive: { backgroundColor: THEME.primary },
  tabText: { fontWeight: '700', color: THEME.accent, marginLeft: 8 },
  tabTextActive: { color: 'white' },
  badge: { 
    position: 'absolute', 
    top: -8, 
    right: -10, 
    backgroundColor: '#FF5252', 
    borderRadius: 10, 
    width: 18, 
    height: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  list: { padding: 15 },
  card: { 
    backgroundColor: 'white', 
    marginBottom: 15, 
    borderRadius: 20, 
    padding: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardImageWrap: { 
    width: 70, 
    height: 70, 
    borderRadius: 15, 
    backgroundColor: THEME.secondary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden' 
  },
  treatImage: { width: '100%', height: '100%' },
  emojiText: { fontSize: 30 },
  cardInfo: { flex: 1, marginLeft: 15 },
  treatName: { fontSize: 17, fontWeight: '700', color: THEME.text },
  treatPrice: { fontSize: 15, color: THEME.accent, marginTop: 4, fontWeight: '800' },
  addBtn: { 
    backgroundColor: THEME.accent, 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  adminActions: { flexDirection: 'row', alignItems: 'center' },
  cartItem: { 
    backgroundColor: 'white', 
    marginBottom: 10, 
    borderRadius: 15, 
    padding: 15, 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 16, fontWeight: '700', color: THEME.text },
  cartItemPrice: { fontSize: 14, color: THEME.accent, marginTop: 2, fontWeight: '600' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.secondary, borderRadius: 20, padding: 5 },
  quantityText: { marginHorizontal: 12, fontSize: 16, fontWeight: '700', color: THEME.text },
  cartFooter: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  subtotalLabel: { fontSize: 18, fontWeight: '600', color: '#666' },
  subtotalValue: { fontSize: 22, fontWeight: '800', color: THEME.text },
  footerActions: { flexDirection: 'row', gap: 10 },
  clearBtn: { 
    flex: 1, 
    backgroundColor: '#FF5252', 
    borderRadius: 15, 
    paddingVertical: 15, 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'center' 
  },
  checkoutBtn: { 
    flex: 2, 
    backgroundColor: THEME.accent, 
    borderRadius: 15, 
    paddingVertical: 15, 
    alignItems: 'center' 
  },
  footerBtnText: { color: 'white', fontWeight: '800', fontSize: 16, marginLeft: 5 },
  emptyCart: { alignItems: 'center', marginTop: 100 },
  emptyCartEmoji: { fontSize: 60, marginBottom: 20 },
  emptyCartMsg: { fontSize: 18, color: THEME.text, fontWeight: '600', textAlign: 'center' },
  adminHeader: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adminTitle: { fontSize: 20, fontWeight: '800', color: THEME.text },
  addTreatBtn: { 
    backgroundColor: THEME.accent, 
    flexDirection: 'row', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20, 
    alignItems: 'center' 
  },
  addTreatText: { color: 'white', fontWeight: '700', marginLeft: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: THEME.text },
  imageSelector: { 
    width: '100%', 
    height: 180, 
    borderRadius: 20, 
    backgroundColor: THEME.secondary, 
    borderStyle: 'dashed', 
    borderWidth: 2, 
    borderColor: THEME.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20, 
    overflow: 'hidden' 
  },
  label: { fontSize: 14, fontWeight: '700', color: THEME.text, marginBottom: 8 },
  input: { backgroundColor: THEME.secondary, borderRadius: 15, padding: 15, marginBottom: 20, color: THEME.text, fontWeight: '600' },
  categoryRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  catBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: THEME.secondary, alignItems: 'center' },
  catBtnActive: { backgroundColor: THEME.primary },
  catBtnText: { fontWeight: '700', color: THEME.text },
  catBtnTextActive: { color: 'white' },
  saveBtn: { backgroundColor: THEME.accent, borderRadius: 20, padding: 18, alignItems: 'center', marginBottom: 20 },
  saveBtnText: { color: 'white', fontSize: 17, fontWeight: '800' },
  emptyMsg: { textAlign: 'center', marginTop: 100, color: THEME.text, opacity: 0.5, fontSize: 16 },
  instructionText: { fontSize: 15, color: '#666', marginBottom: 20, textAlign: 'center', lineHeight: 22 },
  cancelLink: { alignItems: 'center', marginTop: 10, padding: 10 },
  cancelLinkText: { color: THEME.accent, fontWeight: '700', fontSize: 14 },
  orderCard: { backgroundColor: 'white', borderRadius: 20, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: THEME.secondary, paddingBottom: 10 },
  orderId: { fontWeight: '800', color: THEME.text, marginRight: 8 },
  orderStatus: { fontWeight: '800', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  statusPending: { backgroundColor: '#FFD54F', color: '#E65100' }, // Yellow/Orange for pending
  statusVerified: { backgroundColor: '#81C784', color: 'white' }, // Green for verified
  orderItems: { marginBottom: 10 },
  orderItemText: { fontSize: 14, color: '#555', marginBottom: 4 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: THEME.secondary, paddingTop: 10 },
  orderTotal: { fontSize: 18, fontWeight: '800', color: THEME.text, marginBottom: 5 },
  verifyBtn: { backgroundColor: THEME.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  verifyBtnText: { color: 'white', fontSize: 12, fontWeight: '800' },
  downloadBtnCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F48FB1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  downloadBtnCardText: { color: 'white', fontSize: 11, fontWeight: '800', marginLeft: 5 },
  noSlip: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  deleteOrderBtn: { backgroundColor: '#CE93D8', padding: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});

