import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      
      if (!token) {
        Alert.alert("Session Expired", "Please log in again as an administrator.");
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/reviews`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setReviews(data);
      } else {
        throw new Error(data.message || "Failed to fetch reviews.");
      }
    } catch (error: any) {
      console.error("Fetch reviews failed:", error);
      Alert.alert("API Error", error.message || "Could not connect to the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Ionicons 
        key={index} 
        name={index < rating ? "star" : "star-outline"} 
        size={14} 
        color="#FFD166" 
      />
    ));
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.reviewCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(item.user?.fullName || "U")[0].toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{item.user?.fullName || "Unknown User"}</Text>
            <Text style={styles.petInfo}>{item.petName} ({item.petType}) - {item.serviceDate}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          {renderStars(item.rating)}
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.content}>{item.content}</Text>
      </View>

      <View style={styles.footer}>
        <View style={[styles.statusBadge, item.isPublic ? styles.publicBadge : styles.privateBadge]}>
          <Text style={[styles.statusText, item.isPublic ? styles.publicText : styles.privateText]}>
            {item.isPublic ? "PUBLIC" : "PRIVATE"}
          </Text>
        </View>
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
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
          <Text style={styles.headerTitle}>Reviews & Feedback</Text>
          <Pressable onPress={fetchReviews} style={styles.refreshButton} hitSlop={15}>
            <Ionicons name="refresh" size={20} color="#1A3B2F" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#FFD166" />
            <Text style={styles.loadingText}>Loading reviews...</Text>
          </View>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="star-outline" size={48} color="rgba(26, 59, 47, 0.1)" />
                <Text style={styles.emptyText}>No reviews found.</Text>
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
  reviewCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  userName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  petInfo: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.6)',
    fontWeight: '600',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  contentContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 6,
  },
  content: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.7)',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publicBadge: {
    backgroundColor: '#E8F5E9',
  },
  privateBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  publicText: {
    color: '#2E7D32',
  },
  privateText: {
    color: '#C62828',
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '600',
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
