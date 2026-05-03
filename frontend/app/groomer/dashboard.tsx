import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Pressable, Image, ActivityIndicator, Alert, TouchableOpacity,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import { useSidebar } from '@/context/SidebarContext';

const AUTH_USER_KEY = 'auth:user';
const AUTH_TOKEN_KEY = 'auth:token';
const AUTH_STATUS_KEY = 'auth:isSignedIn';
const ONBOARDING_SEEN_KEY = 'onboarding:seen';

const getImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL.replace('/api', '')}${url}`;
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Pending:   { bg: '#E8F4FF', text: '#1565C0' },
  Confirmed: { bg: '#E8F5E9', text: '#2E7D32' },
  Accepted:  { bg: '#FFF8E1', text: '#F57F17' },
  Completed: { bg: '#F3E5F5', text: '#6A1B9A' },
};

export default function GroomerDashboardScreen() {
  const router = useRouter();
  const { openSidebar } = useSidebar();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (userData) setUser(JSON.parse(userData));

      if (!token) return;

      const [statsRes, jobsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/spa-services/groomer-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/spa-services/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());

      if (jobsRes.ok) {
        const jobs: any[] = await jobsRes.json();
        setAvailableJobs(jobs.filter(b => b.status === 'Confirmed'));
        setSchedule(jobs.filter(b => b.status === 'Accepted' || b.status === 'Pending'));
      }
    } catch (e) {
      console.error('GroomerDashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleAccept = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/spa-services/bookings/${id}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        Alert.alert('Success', 'Job accepted!');
        fetchData();
      }
    } catch {
      Alert.alert('Error', 'Could not accept job.');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/spa-services/bookings/${id}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        Alert.alert('Success', 'Job marked complete!');
        fetchData();
      }
    } catch {
      Alert.alert('Error', 'Could not complete job.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove([AUTH_USER_KEY, AUTH_STATUS_KEY, AUTH_TOKEN_KEY, ONBOARDING_SEEN_KEY]);
          router.dismissAll();
          router.replace('/');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFD166" />
      </View>
    );
  }

  const todaySchedule = schedule.slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={openSidebar} style={styles.menuBtn} hitSlop={12}>
          <Ionicons name="menu" size={28} color="#1A3B2F" />
        </Pressable>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#1A3B2F" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Welcome Card ── */}
        <View style={styles.welcomeCard}>
          <View style={styles.avatarBox}>
            {user?.profilePicture ? (
              <Image source={{ uri: getImageUrl(user.profilePicture) || '' }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={36} color="#1A3B2F" />
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.helloText}>Hello, {user?.fullName?.split(' ')[0] || 'Groomer'}! 👋</Text>
            <Text style={styles.helloSub}>Welcome back to your dashboard</Text>
          </View>
        </View>

        {/* ── Stats Grid ── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#FFFDE7' }]}>
            <View style={styles.statRow}>
              <Text style={styles.statNum}>{stats?.avgRating || '4.8'}</Text>
              <Ionicons name="star" size={22} color="#FFC107" />
            </View>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#EDE7F6' }]}>
            <View style={styles.statRow}>
              <Text style={styles.statNum}>{stats?.totalReviews || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Total Reviews</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={styles.statRow}>
              <Text style={styles.statNum}>{stats?.todayCount || schedule.length}</Text>
              <Ionicons name="calendar" size={22} color="#43A047" />
            </View>
            <Text style={styles.statLabel}>Today's Appointments</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <View style={styles.statRow}>
              <Text style={styles.statNum}>{stats?.completedJobs || 0}</Text>
              <Ionicons name="checkmark-circle" size={22} color="#1E88E5" />
            </View>
            <Text style={styles.statLabel}>Completed Jobs</Text>
          </View>
        </View>

        {/* ── Today's Schedule ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Pressable onPress={() => router.push('/groomer/appointments' as any)}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        {todaySchedule.length > 0 ? (
          todaySchedule.map((job: any) => {
            const sc = STATUS_COLORS[job.status] || STATUS_COLORS.Pending;
            return (
              <View key={job._id} style={styles.scheduleCard}>
                <View style={styles.pawIcon}>
                  <Ionicons name="paw" size={26} color="#1A3B2F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.petName}>{job.petId?.name || 'Pet'}</Text>
                  <Text style={styles.breedText}>{job.petId?.breed || job.serviceName || 'Service'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.timeText}>{job.appointmentTime || '—'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{job.status}</Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={44} color="#ccc" />
            <Text style={styles.emptyText}>No appointments today</Text>
          </View>
        )}

        {/* ── Available Jobs ── */}
        {availableJobs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 28, marginBottom: 14 }]}>New Jobs</Text>
            {availableJobs.map((job: any) => (
              <View key={job._id} style={styles.jobCard}>
                <View style={styles.pawIcon}>
                  <Ionicons name="briefcase-outline" size={22} color="#1A3B2F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.petName}>{job.serviceName || 'Service'}</Text>
                  <Text style={styles.breedText}>{job.appointmentDate} · {job.appointmentTime}</Text>
                  <Text style={styles.priceLabel}>Rs. {job.price}</Text>
                </View>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(job._id)}>
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F8F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F8F5' },
  scroll: { paddingHorizontal: 20, paddingBottom: 30, paddingTop: Platform.OS === 'ios' ? 8 : 16 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
    backgroundColor: '#F2F8F5',
  },
  menuBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(26,59,47,0.08)',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A3B2F' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFD166', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 22,
  },
  logoutText: { fontSize: 13, fontWeight: '800', color: '#1A3B2F' },

  /* Welcome card */
  welcomeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  avatarBox: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0FAF5',
    alignItems: 'center', justifyContent: 'center',
  },
  helloText: { fontSize: 18, fontWeight: '900', color: '#1A3B2F' },
  helloSub: { fontSize: 13, color: 'rgba(26,59,47,0.5)', fontWeight: '600', marginTop: 4 },

  /* Stats */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 28 },
  statCard: {
    width: '46.5%', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  statNum: { fontSize: 30, fontWeight: '900', color: '#1A3B2F' },
  statLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(26,59,47,0.55)' },

  /* Section header */
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1A3B2F' },
  viewAll: { fontSize: 14, fontWeight: '800', color: '#FFD166' },

  /* Schedule cards */
  scheduleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(26,59,47,0.06)',
  },
  pawIcon: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center',
  },
  petName: { fontSize: 16, fontWeight: '800', color: '#1A3B2F' },
  breedText: { fontSize: 13, color: 'rgba(26,59,47,0.5)', fontWeight: '600', marginTop: 2 },
  timeText: { fontSize: 13, fontWeight: '800', color: '#1A3B2F' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '900' },

  /* Job cards */
  jobCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(26,59,47,0.06)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  priceLabel: { fontSize: 13, fontWeight: '800', color: '#4CAF50', marginTop: 4 },
  acceptBtn: {
    backgroundColor: '#1A3B2F', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
  },
  acceptBtnText: { color: '#FFD166', fontWeight: '900', fontSize: 13 },

  /* Empty */
  emptyBox: { alignItems: 'center', paddingVertical: 40, opacity: 0.5 },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#1A3B2F', marginTop: 10 },
});
