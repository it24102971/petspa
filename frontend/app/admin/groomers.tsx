import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Pressable, ActivityIndicator, Alert, Platform, Modal, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GroomerManagementScreen() {
  const [groomers, setGroomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroomer, setSelectedGroomer] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
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

      const response = await fetch(`${API_BASE_URL}/admin/groomers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setGroomers(data);
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
    <Pressable 
      style={[styles.card, !item.isActive && styles.cardInactive]}
      onPress={() => {
        setSelectedGroomer(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {item.profilePicture ? (
            <Image 
              source={{ uri: item.profilePicture.startsWith('http') ? item.profilePicture : `${API_BASE_URL.replace('/api', '')}${item.profilePicture}` }} 
              style={styles.avatarImage} 
            />
          ) : (
            <Ionicons name="person" size={24} color="#1A3B2F" />
          )}
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
          disabled={togglingId === item._id}
          onPress={() => handleToggleStatus(item._id, item.isActive, item.fullName)}
          style={[styles.toggleBtn, item.isActive ? styles.btnDeactivate : styles.btnActivate]}
        >
          {togglingId === item._id ? (
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
          <Text style={styles.statLabel}>Specialization</Text>
          <Text style={styles.statValue} numberOfLines={1}>{item.specialization || 'General'}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Exp</Text>
          <Text style={styles.statValue}>{item.experience || '0'}y</Text>
        </View>
      </View>
    </Pressable>
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
            keyExtractor={(item) => item._id}
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

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Groomer Profile</Text>
                <Pressable onPress={() => setModalVisible(false)} hitSlop={15}>
                  <Ionicons name="close" size={24} color="#1A3B2F" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalBody}>
                  <View style={styles.largeAvatar}>
                    {selectedGroomer?.profilePicture ? (
                      <Image 
                        source={{ uri: selectedGroomer.profilePicture.startsWith('http') ? selectedGroomer.profilePicture : `${API_BASE_URL.replace('/api', '')}${selectedGroomer.profilePicture}` }} 
                        style={styles.largeAvatarImage} 
                      />
                    ) : (
                      <Ionicons name="person" size={60} color="#1A3B2F" />
                    )}
                  </View>
                  
                  <Text style={styles.modalName}>{selectedGroomer?.fullName}</Text>
                  <Text style={styles.modalRole}>Professional Groomer</Text>

                  <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                      <Ionicons name="call-outline" size={20} color="#FFD166" />
                      <View>
                        <Text style={styles.detailLabel}>Phone</Text>
                        <Text style={styles.detailValue}>{selectedGroomer?.phoneNumber || 'Not provided'}</Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="mail-outline" size={20} color="#FFD166" />
                      <View>
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{selectedGroomer?.email}</Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="paw-outline" size={20} color="#FFD166" />
                      <View>
                        <Text style={styles.detailLabel}>Experience</Text>
                        <Text style={styles.detailValue}>{selectedGroomer?.experience || '0'} Years</Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="medal-outline" size={20} color="#FFD166" />
                      <View>
                        <Text style={styles.detailLabel}>Specialization</Text>
                        <Text style={styles.detailValue}>{selectedGroomer?.specialization || 'All pets'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.aboutSection}>
                    <Text style={styles.aboutLabel}>About Groomer</Text>
                    <Text style={styles.aboutText}>
                      {selectedGroomer?.aboutMe || 'This groomer has not provided a description yet.'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
              
              <Pressable 
                style={styles.closeBtn} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Done</Text>
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  modalBody: {
    alignItems: 'center',
  },
  largeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 40,
    backgroundColor: '#FFD166',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  largeAvatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  modalName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 4,
  },
  modalRole: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD166',
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  detailGrid: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FAF5',
    padding: 16,
    borderRadius: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.4)',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  aboutSection: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
    marginBottom: 24,
  },
  aboutLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(26, 59, 47, 0.7)',
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: '#1A3B2F',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
});
