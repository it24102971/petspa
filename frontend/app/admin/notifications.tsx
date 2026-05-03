import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  Pressable, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const AUTH_TOKEN_KEY = 'auth:token';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string;
  createdAt: string;
}

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markRead = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      await fetch(`${API_BASE_URL}/notifications/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    markRead();
  }, []);

  const handlePress = (notif: Notification) => {
    if (notif.link) {
      router.push(notif.link as any);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <Pressable 
      style={[styles.card, !item.isRead && styles.unreadCard]} 
      onPress={() => handlePress(item)}
    >
      <View style={[styles.iconBox, { backgroundColor: getIconBg(item.type) }]}>
        <Ionicons name={getIconName(item.type)} size={24} color={getIconColor(item.type)} />
      </View>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
      </View>
      {!item.isRead && <View style={styles.dot} />}
    </Pressable>
  );

  const getIconName = (type: string) => {
    switch (type) {
      case 'booking': return 'calendar';
      case 'alert': return 'alert-circle';
      default: return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'booking': return '#2196F3';
      case 'alert': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'booking': return '#E3F2FD';
      case 'alert': return '#FFEBEE';
      default: return '#FFF3E0';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1A3B2F" />
        </Pressable>
        <Text style={styles.headerTitle}>System Notifications</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFD166" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchNotifications} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A3B2F' },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee'
  },
  unreadCard: {
    borderColor: '#FFD166',
    backgroundColor: '#FFFCF5'
  },
  iconBox: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '800', color: '#1A3B2F' },
  time: { fontSize: 11, color: '#999' },
  message: { fontSize: 13, color: '#666', lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD166', marginLeft: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 12, fontSize: 14, color: '#999', fontWeight: '600' }
});
