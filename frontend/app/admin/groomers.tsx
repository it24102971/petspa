import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GroomerManagementScreen() {
  const [groomers, setGroomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const router = useRouter();

  const fetchGroomers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      
      if (!token) {
        Alert.alert("Session Expired", "Please log in again as an administrator.");
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        // Filter only groomers
        setGroomers(data.filter((u: any) => u.role === 'groomer'));
      } else {
        throw new Error(data.message || "Failed to fetch groomers.");
      }
    } catch (error: any) {
      console.error("Fetch groomers failed:", error);
      Alert.alert("API Error", error.message || "Could not connect to the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroomers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? "deactivate" : "activate";
    
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${action} groomer ${name}'s account?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: action.toUpperCase(), 
          style: currentStatus ? "destructive" : "default",
          onPress: async () => {
            try {
              setTogglingId(userId);
              const token = await AsyncStorage.getItem('auth:token');
              const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              const data = await response.json();
              if (response.ok) {
                setGroomers(prev => prev.map(u => 
                  u.id === userId ? { ...u, isActive: data.isActive } : u
                ));
              } else {
                throw new Error(data.message || `Failed to ${action} account.`);
              }
            } catch (err: any) {
              Alert.alert("Error", err.message);
            } finally {
              setTogglingId(null);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: any) => (
    <View style={[styles.card, !item.isActive && styles.cardInactive]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="cut" size={24} color="#1A3B2F" />
          {!item.isActive && (
            <View style={styles.inactiveAvatarOverlay}>
              <Ionicons name="lock-closed" size={12} color="#ffffff" />
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>{item.fullName}</Text>
          <Text style={styles.emailText}>{item.email}</Text>
        </View>
        
        <Pressable 
          disabled={togglingId === item.id}
          onPress={() => handleToggleStatus(item.id, item.isActive, item.fullName)}
          style={[styles.toggleBtn, item.isActive ? styles.btnDeactivate : styles.btnActivate]}
        >
          {togglingId === item.id ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons 
              name={item.isActive ? "power" : "checkmark-circle"} 
              size={18} 
              color="#ffffff" 
            />
          )}
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={[styles.statValue, { color: item.isActive ? '#2E7D32' : '#D32F2F' }]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Rating</Text>
          <Text style={styles.statValue}>4.8 ★</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Services</Text>
          <Text style={styles.statValue}>12</Text>
        </View>
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
          <Text style={styles.headerTitle}>Groomer Management</Text>
          <Pressable onPress={fetchGroomers} style={styles.refreshButton} hitSlop={15}>
            <Ionicons name="refresh" size={20} color="#1A3B2F" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#FFD166" />
            <Text style={styles.loadingText}>Loading groomers...</Text>
          </View>
        ) : (
          <FlatList
            data={groomers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={48} color="rgba(26, 59, 47, 0.1)" />
                <Text style={styles.emptyText}>No groomers registered yet.</Text>
              </View>
            }
          />
        )}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 59, 47, 0.05)',
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FAF5',
  },
  refreshButton: {
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
    letterSpacing: -0.5,
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.6)',
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInactive: {
    backgroundColor: 'rgba(239, 239, 239, 0.5)',
    borderColor: 'rgba(211, 47, 47, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFD166',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  inactiveAvatarOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#D32F2F',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.5)',
    fontWeight: '600',
  },
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  btnDeactivate: {
    backgroundColor: '#1A3B2F',
  },
  btnActivate: {
    backgroundColor: '#81C784',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(26, 59, 47, 0.05)',
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.4)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: 'rgba(26, 59, 47, 0.4)',
    fontSize: 16,
    fontWeight: '700',
  },
});
