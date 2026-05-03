import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, RefreshControl, Platform, Image, ActivityIndicator, Alert, Modal, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSidebar } from '@/context/SidebarContext';
import { API_BASE_URL } from '@/constants/api';

const AUTH_USER_KEY = "auth:user";
const AUTH_STATUS_KEY = "auth:isSignedIn";
const AUTH_TOKEN_KEY = "auth:token";
const ONBOARDING_SEEN_KEY = "onboarding:seen";

const getImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${url}`;
};

// --- Components ---

const CustomerDashboardContent = ({ user, stats, router, appointments, onOpenSidebar, onPets, onCafe, availableGroomers }: any) => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={onOpenSidebar} style={styles.menuButton} hitSlop={15}>
          <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <View style={styles.headerUserContainer}>
          {user?.profilePicture ? (
            <Image source={{ uri: getImageUrl(user.profilePicture) || '' }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Ionicons name="person" size={18} color="#1A3B2F" />
            </View>
          )}
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.fullName || 'Customer'}</Text>
          </View>
        </View>
      </View>
    </View>

    <View style={styles.roleBadge}>
      <Text style={styles.roleText}>CUSTOMER</Text>
    </View>

    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats?.bookings || 0}</Text>
        <Text style={styles.statLabel}>Bookings</Text>
      </View>
      <Pressable style={styles.statCard} onPress={onPets}>
        <Text style={styles.statNumber}>{stats?.pets || 0}</Text>
        <Text style={styles.statLabel}>Pets</Text>
      </Pressable>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats?.cafeOrders || 0}</Text>
        <Text style={styles.statLabel}>Cafe Orders</Text>
      </View>
    </View>

    <View style={{ marginBottom: 24 }}>
      <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Our Groomers</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {availableGroomers && availableGroomers.length > 0 ? (
          availableGroomers.map((groomer: any) => (
            <View key={groomer._id} style={styles.groomerCardSmall}>
              <View style={styles.groomerAvatarSmall}>
                {groomer.profilePicture ? (
                  <Image source={{ uri: getImageUrl(groomer.profilePicture) || '' }} style={styles.groomerImgSmall} />
                ) : (
                  <Ionicons name="person" size={30} color="#1A3B2F" />
                )}
              </View>
              <Text style={styles.groomerNameSmall} numberOfLines={1}>{groomer.fullName}</Text>
              <Text style={styles.groomerSpecSmall} numberOfLines={1}>{groomer.specialization || 'Pet Expert'}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: '#999', fontSize: 12 }}>No groomers available right now.</Text>
        )}
      </ScrollView>
    </View>

    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Recent Appointments</Text>
      <Pressable 
        style={{ backgroundColor: '#1A3B2F', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        onPress={() => router.push({ pathname: '/(tabs)/appointments', params: { view: 'book' } } as any)}
      >
        <Ionicons name="add" size={18} color="#FFD166" />
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Book New</Text>
      </Pressable>
    </View>

    {appointments && appointments.length > 0 ? (
      appointments.map((item: any) => (
        <View key={item._id} style={{ backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#eee' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A3B2F' }}>
              {item.serviceName || item.groomerName || 'Appointment'}
            </Text>
            <View style={{ backgroundColor: item.status === 'Pending' ? '#FFF3E0' : '#E0F2F1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: item.status === 'Pending' ? '#E65100' : '#00897B' }}>{item.status}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 5 }}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={{ fontSize: 13, color: '#666' }}>{item.appointmentDate} at {item.appointmentTime}</Text>
          </View>
        </View>
      ))
    ) : (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="calendar-outline" size={40} color="#FFD166" />
        </View>
        <Text style={styles.emptyStateTitle}>No appointments planned yet</Text>
        <Text style={styles.emptyStateSub}>Book an appointment to pamper your furry friend.</Text>
      </View>
    )}
  </ScrollView>
);

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Pending:   { bg: '#E8F4FF', text: '#1565C0' },
  Confirmed: { bg: '#E8F5E9', text: '#2E7D32' },
  Accepted:  { bg: '#FFF8E1', text: '#F57F17' },
  Completed: { bg: '#F3E5F5', text: '#6A1B9A' },
};

const GroomerDashboardContent = ({ user, stats, router, notifications, onMarkAsRead, availableJobs, mySchedule, reviews, onAcceptJob, onCompleteJob, onOpenSidebar, onLogout }: any) => {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onOpenSidebar} style={styles.menuButton} hitSlop={15}>
            <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
          </Pressable>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
        </View>
      </View>

      {/* Welcome Card */}
      <View style={styles.welcomeCardMain}>
        <View style={styles.welcomeAvatarContainer}>
          {user?.profilePicture ? (
            <Image source={{ uri: getImageUrl(user.profilePicture) || '' }} style={styles.welcomeAvatar} />
          ) : (
            <View style={styles.avatarPlaceholderLarge}>
              <Ionicons name="person" size={40} color="#1A3B2F" />
            </View>
          )}
        </View>
        <View style={{ flex: 1, paddingLeft: 10 }}>
          <Text style={styles.helloTitleText}>Hello, {user?.fullName?.split(' ')[0] || 'Sithumi'}! 👋</Text>
          <Text style={styles.helloSubtitleText}>Welcome back to your dashboard</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.groomerStatsRow}>
        <View style={[styles.statItemCard, { backgroundColor: '#ffffff' }]}>
          <View style={styles.statItemTop}>
            <Text style={styles.statItemValue}>{stats?.avgRating || '4.8'}</Text>
            <Ionicons name="star" size={20} color="#FFD166" />
          </View>
          <Text style={styles.statItemLabel}>Average Rating</Text>
        </View>
        <View style={[styles.statItemCard, { backgroundColor: '#F3F0FF' }]}>
          <View style={styles.statItemTop}>
            <Text style={styles.statItemValue}>{stats?.totalReviews || '12'}</Text>
          </View>
          <Text style={styles.statItemLabel}>Total Reviews</Text>
        </View>
      </View>

      <View style={styles.groomerStatsRow}>
        <View style={[styles.statItemCard, { backgroundColor: '#F0FAF5' }]}>
          <View style={styles.statItemTop}>
            <Text style={styles.statItemValue}>{mySchedule?.length || '5'}</Text>
            <Ionicons name="calendar" size={20} color="#43A047" />
          </View>
          <Text style={styles.statItemLabel}>Today's Appointments</Text>
        </View>
        <View style={[styles.statItemCard, { backgroundColor: '#E3F2FD' }]}>
          <View style={styles.statItemTop}>
            <Text style={styles.statItemValue}>{stats?.completedJobs || '32'}</Text>
            <Ionicons name="checkmark-circle" size={20} color="#1E88E5" />
          </View>
          <Text style={styles.statItemLabel}>Completed Jobs</Text>
        </View>
      </View>

      {/* Today's Schedule Section */}
      <View style={styles.groomerSectionHeader}>
        <Text style={styles.sectionHeading}>Today's Schedule</Text>
        <Pressable onPress={() => router.push('/groomer/appointments')}>
          <Text style={styles.viewAllLabel}>View All</Text>
        </Pressable>
      </View>

      {mySchedule && mySchedule.length > 0 ? (
        mySchedule.slice(0, 5).map((job: any) => {
          const sc = STATUS_COLORS[job.status] || STATUS_COLORS.Pending;
          return (
            <View key={job._id} style={styles.scheduleRowCard}>
              <View style={styles.petIconBackground}>
                <Ionicons name="paw" size={24} color="#1A3B2F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.schedulePetName}>{job.petId?.name || 'Buddy'}</Text>
                <Text style={styles.schedulePetBreed}>{job.petId?.breed || job.serviceName || 'Golden Retriever'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.scheduleTime}>{job.appointmentTime || '10:00 AM'}</Text>
                <View style={[styles.statusBadgeCapsule, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: sc.text }]}>{job.status}</Text>
                </View>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyStateCard}>
          <Ionicons name="calendar-outline" size={40} color="#ccc" />
          <Text style={styles.emptyStateLabel}>No appointments for today</Text>
        </View>
      )}

      {/* Available Jobs (Hidden if empty, but good to keep) */}
      {availableJobs && availableJobs.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionHeading}>Available Jobs</Text>
          {availableJobs.map((job: any) => (
            <View key={job._id} style={styles.availableJobCard}>
              <View style={styles.petIconBackground}>
                <Ionicons name="briefcase-outline" size={22} color="#1A3B2F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.schedulePetName}>{job.serviceName || 'Service'}</Text>
                <Text style={styles.schedulePetBreed}>{job.appointmentDate} · {job.appointmentTime}</Text>
                <Text style={styles.jobPriceValue}>Rs. {job.price}</Text>
              </View>
              <TouchableOpacity style={styles.acceptActionBtn} onPress={() => onAcceptJob(job._id)}>
                <Text style={styles.acceptActionText}>Accept</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const AdminDashboardContent = ({ user, onOpenSidebar, onAddGroomer, router, stats }: any) => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    {/* Header */}
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={onOpenSidebar} style={styles.menuButton} hitSlop={15}>
          <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <Text style={styles.dashboardTitle}>Admin Panel</Text>
      </View>
    </View>

    {/* Welcome Card */}
    <View style={styles.welcomeCardContainer}>
      <View style={styles.welcomeCardContent}>
        <View style={styles.groomerAvatarContainer}>
          {user?.profilePicture ? (
            <Image source={{ uri: getImageUrl(user.profilePicture) || '' }} style={styles.groomerAvatarImage} />
          ) : (
            <View style={styles.groomerAvatarPlaceholder}>
              <Ionicons name="shield-checkmark" size={40} color="#1A3B2F" />
            </View>
          )}
        </View>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeGreeting}>Hello, {user?.fullName || 'Admin'}! 👋</Text>
          <Text style={styles.welcomeSubtext}>System Administrator</Text>
        </View>
      </View>
    </View>

    {/* Stats Grid */}
    <View style={styles.statsGrid}>
      <View style={styles.statsRow}>
        <Pressable style={[styles.statBox, { backgroundColor: '#ffffff' }]} onPress={() => router.push('/admin/users')}>
          <View style={styles.statBoxHeader}>
            <Text style={styles.statBoxNumber}>{stats?.totalUsers || 0}</Text>
            <Ionicons name="people" size={20} color="#FFD166" />
          </View>
          <Text style={styles.statBoxLabel}>Total Users</Text>
        </Pressable>
        <Pressable style={[styles.statBox, { backgroundColor: '#ffffff' }]} onPress={() => router.push('/admin/appointments')}>
          <View style={styles.statBoxHeader}>
            <Text style={styles.statBoxNumber}>{stats?.appointments || 0}</Text>
            <Ionicons name="calendar" size={20} color="#FFD166" />
          </View>
          <Text style={styles.statBoxLabel}>Appointments</Text>
        </Pressable>
      </View>
      <View style={styles.statsRow}>
        <Pressable style={[styles.statBox, { backgroundColor: '#ffffff' }]} onPress={() => router.push('/admin/groomers')}>
          <View style={styles.statBoxHeader}>
            <Text style={styles.statBoxNumber}>{stats?.activeGroomers || 0}</Text>
            <Ionicons name="cut" size={20} color="#FFD166" />
          </View>
          <Text style={styles.statBoxLabel}>Active Groomers</Text>
        </Pressable>
        <View style={[styles.statBox, { backgroundColor: '#ffffff' }]}>
          <View style={styles.statBoxHeader}>
            <Text style={styles.statBoxNumber}>{stats?.avgRating || '0.0'}</Text>
            <Ionicons name="star" size={20} color="#FFD166" />
          </View>
          <Text style={styles.statBoxLabel}>Avg Rating</Text>
        </View>
      </View>
    </View>

    {/* Management Section */}
    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
      <Text style={styles.sectionTitleText}>Management</Text>
    </View>
    <View style={styles.managementGrid}>
      <Pressable style={styles.managementCard} onPress={() => router.push('/admin/appointments')}>
        <View style={[styles.managementIconContainer, { backgroundColor: '#E3F2FD' }]}>
          <Ionicons name="calendar-outline" size={24} color="#1976D2" />
        </View>
        <Text style={styles.managementLabel}>Appointments</Text>
      </Pressable>
      <Pressable style={styles.managementCard} onPress={() => router.push('/admin/users')}>
        <View style={[styles.managementIconContainer, { backgroundColor: '#F3E5F5' }]}>
          <Ionicons name="people-outline" size={24} color="#7B1FA2" />
        </View>
        <Text style={styles.managementLabel}>Users</Text>
      </Pressable>
      <Pressable style={styles.managementCard} onPress={() => router.push('/admin/groomers')}>
        <View style={[styles.managementIconContainer, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="cut-outline" size={24} color="#2E7D32" />
        </View>
        <Text style={styles.managementLabel}>Groomers</Text>
      </Pressable>
      <Pressable style={styles.managementCard} onPress={() => router.push('/(tabs)/spa')}>
        <View style={[styles.managementIconContainer, { backgroundColor: '#EAF5EF' }]}>
          <Ionicons name="sparkles-outline" size={24} color="#1A3B2F" />
        </View>
        <Text style={styles.managementLabel}>Services</Text>
      </Pressable>
      <Pressable style={styles.managementCard} onPress={() => router.push('/admin/cafe')}>
        <View style={[styles.managementIconContainer, { backgroundColor: '#FFF8E1' }]}>
          <Ionicons name="cafe-outline" size={24} color="#F57F17" />
        </View>
        <Text style={styles.managementLabel}>Cafe</Text>
      </Pressable>
      <Pressable style={styles.managementCard} onPress={() => router.push('/admin/reviews')}>
        <View style={[styles.managementIconContainer, { backgroundColor: '#FCE4EC' }]}>
          <Ionicons name="star-outline" size={24} color="#C62828" />
        </View>
        <Text style={styles.managementLabel}>Reviews</Text>
      </Pressable>
    </View>

    {/* Add Groomer Quick Action */}
    <Pressable
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A3B2F', borderRadius: 16, padding: 18, marginTop: 16, gap: 14 }}
      onPress={onAddGroomer}
    >
      <Ionicons name="person-add-outline" size={24} color="#FFD166" />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff' }}>Add New Groomer</Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Register a new groomer profile</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#FFD166" />
    </Pressable>
  </ScrollView>
);



// --- Main Screen ---

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [groomerStats, setGroomerStats] = useState<any>(null);
  const [customerStats, setCustomerStats] = useState<any>(null);
  const [customerAppointments, setCustomerAppointments] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [groomerAvailableJobs, setGroomerAvailableJobs] = useState<any[]>([]);
  const [groomerSchedule, setGroomerSchedule] = useState<any[]>([]);
  const [groomerReviews, setGroomerReviews] = useState<any[]>([]);
  const [availableGroomers, setAvailableGroomers] = useState<any[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const { openSidebar } = useSidebar();
  const router = useRouter();

  const markNotificationsRead = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Mark as read failed:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchUserAndStats = async () => {
        try {
          const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
          const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
          
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            if (parsedUser.role === 'groomer' && token) {
              const statsRes = await fetch(`${API_BASE_URL}/spa-services/groomer-stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (statsRes.ok) {
                const statsData = await statsRes.json();
                setGroomerStats(statsData);
              }

              const notifRes = await fetch(`${API_BASE_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (notifRes.ok) {
                const notifData = await notifRes.json();
                setNotifications(notifData);
              }

              // Fetch jobs and schedule for groomer
              const jobsRes = await fetch(`${API_BASE_URL}/spa-services/bookings`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (jobsRes.ok) {
                const jobsData = await jobsRes.json();
                setGroomerAvailableJobs(jobsData.filter((b: any) => b.status === 'Confirmed'));
                setGroomerSchedule(jobsData.filter((b: any) => b.status === 'Accepted'));
              }

              // Fetch reviews for groomer
              const reviewsRes = await fetch(`${API_BASE_URL}/admin/reviews`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                setGroomerReviews(reviewsData);
              }

              // Fetch diary feed
              const diaryRes = await fetch(`${API_BASE_URL}/diary/feed`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (diaryRes.ok) {
                setDiaryEntries(await diaryRes.json());
              }
            } else if (parsedUser.role === 'customer' && token) {
              const [statsRes, bookingsRes, groomersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/auth/dashboard-stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/spa-services/bookings`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/spa-services/groomers`, { headers: { 'Authorization': `Bearer ${token}` } })
              ]);
              if (statsRes.ok) {
                const statsData = await statsRes.json();
                setCustomerStats(statsData);
              }
              if (bookingsRes.ok) {
                const bookingsData = await bookingsRes.json();
                setCustomerAppointments(bookingsData.slice(0, 3)); // show top 3
              }
              if (groomersRes.ok) {
                const groomersData = await groomersRes.json();
                setAvailableGroomers(groomersData);
              }
            } else if (parsedUser.role === 'admin' && token) {
              const statsRes = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (statsRes.ok) {
                const statsData = await statsRes.json();
                setAdminStats(statsData);
              }
            }
          }
        } catch (error) {
          console.error("Fetch dashboard data failed:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUserAndStats();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                AUTH_USER_KEY,
                AUTH_STATUS_KEY,
                AUTH_TOKEN_KEY,
                ONBOARDING_SEEN_KEY,
              ]);
              setUser(null);
              router.dismissAll();
              router.replace("/");
            } catch (error) {
              console.warn("Logout cleanup failed:", error);
              router.dismissAll();
              router.replace("/");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FFD166" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        {user?.role === 'admin' ? (
          <AdminDashboardContent
            user={user}
            onLogout={handleLogout}
            onOpenSidebar={openSidebar}
            onAddGroomer={() => router.push('/admin/add-groomer')}
            onManageGroomers={() => router.push('/admin/groomers')}
            router={router}
            stats={adminStats}
          />
        ) : user?.role === 'groomer' ? (
          <GroomerDashboardContent
            user={user}
            onLogout={handleLogout}
            onOpenSidebar={openSidebar}
            stats={groomerStats}
            router={router}
            notifications={notifications}
            onMarkAsRead={markNotificationsRead}
            availableJobs={groomerAvailableJobs}
            mySchedule={groomerSchedule}
            reviews={groomerReviews}
            onAcceptJob={async (id: string) => {
              try {
                const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
                const response = await fetch(`${API_BASE_URL}/spa-services/bookings/${id}/accept`, {
                  method: 'PUT',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                  Alert.alert("Success", "Appointment accepted!");
                  const job = groomerAvailableJobs.find(j => j._id === id);
                  if (job) {
                    setGroomerAvailableJobs(prev => prev.filter(j => j._id !== id));
                    setGroomerSchedule(prev => [...prev, { ...job, status: 'Accepted' }]);
                  }
                }
              } catch (error) {
                Alert.alert("Error", "Could not accept appointment.");
              }
            }}
            onCompleteJob={async (id: string) => {
              try {
                const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
                const response = await fetch(`${API_BASE_URL}/spa-services/bookings/${id}/complete`, {
                  method: 'PUT',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                  Alert.alert("Success", "Job marked as completed!");
                  setGroomerSchedule(prev => prev.filter(j => j._id !== id));
                  // Refresh stats
                }
              } catch (error) {
                Alert.alert("Error", "Could not complete job.");
              }
            }}
          />
        ) : (
          <CustomerDashboardContent 
            user={user} 
            onLogout={handleLogout}
            onExplore={() => router.push('/(tabs)/appointments')}
            onOpenSidebar={openSidebar}
            onCafe={() => router.push('/cafe' as any)}
            onPets={() => router.push('/(tabs)/profile')}
            stats={customerStats}
            appointments={customerAppointments}
            router={router}
            availableGroomers={availableGroomers}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 40,
  },
  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-start',
  },
  managementCard: {
    width: '31.5%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 8,
  },
  managementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  managementLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A3B2F',
    textAlign: 'center',
    lineHeight: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  headerUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
  },
  headerAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  welcomeText: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.6)',
    fontWeight: '600',
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A3B2F',
    marginTop: -2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD166',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#FFD166',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#1A3B2F',
    fontSize: 13,
    fontWeight: '800',
  },
  roleBadge: {
    backgroundColor: '#1A3B2F',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 24,
  },
  roleText: {
    color: '#FFD166',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    minHeight: 100,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.5)',
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD16620',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3B2F',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.6)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#FFD166',
    height: 60,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD166',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  actionButtonText: {
    color: '#1A3B2F',
    fontSize: 16,
    fontWeight: '900',
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  welcomeCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  welcomeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  groomerAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F0FAF5',
    overflow: 'hidden',
  },
  groomerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  groomerAvatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  welcomeSubtext: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.6)',
    marginTop: 2,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
    minHeight: 100,
    justifyContent: 'center',
  },
  statBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statBoxNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  statBoxLabel: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.5)',
    fontWeight: '800',
  },
  // Groomer Central Styles
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  jobInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  jobAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center' },
  jobPetName: { fontSize: 16, fontWeight: '800', color: '#1A3B2F' },
  jobService: { fontSize: 12, color: '#666', marginTop: 2 },
  jobAcceptBtn: { backgroundColor: '#1A3B2F', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  jobAcceptText: { color: '#FFD166', fontSize: 12, fontWeight: '800' },
  jobFooter: { flexDirection: 'row', marginTop: 12, gap: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8 },
  jobMeta: { fontSize: 11, color: '#999', fontWeight: '600' },
  
  scheduleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 18, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: '#eee' },
  scheduleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD166' },
  scheduleText: { fontSize: 14, fontWeight: '800', color: '#1A3B2F' },
  scheduleSub: { fontSize: 11, color: '#999', marginTop: 2 },
  scheduleStatus: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  scheduleStatusText: { fontSize: 9, fontWeight: '900', color: '#2E7D32' },
  
  reviewMiniCard: { backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  reviewUser: { fontSize: 12, fontWeight: '800', color: '#1A3B2F' },
  reviewContent: { fontSize: 11, color: '#666', marginTop: 4, lineHeight: 16 },
  
  emptyInline: { padding: 20, alignItems: 'center', backgroundColor: 'rgba(26, 59, 47, 0.03)', borderRadius: 16 },
  emptyInlineText: { fontSize: 13, color: '#999', fontWeight: '600' },

  // New Groomer Slider Styles
  groomerCardSmall: {
    width: 100,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  groomerAvatarSmall: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F0FAF5',
    marginBottom: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groomerImgSmall: {
    width: '100%',
    height: '100%',
  },
  groomerNameSmall: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A3B2F',
    textAlign: 'center',
  },
  groomerSpecSmall: {
    fontSize: 9,
    color: '#999',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  jobVerifyBtn: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  jobVerifyText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A3B2F',
  },


  statsGrid: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  actionSub: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  // Notification Styles
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5252',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  notificationModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '70%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  notifText: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 2,
  },
  notifMessage: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.6)',
    lineHeight: 18,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
  },
  emptyNotif: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyNotifText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  // Groomer Dashboard New Styles

  // --- Restored Premium Groomer Dashboard Styles ---
  welcomeCardMain: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(26,59,47,0.03)',
  },
  welcomeAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FAF5',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  welcomeAvatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholderLarge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helloTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  helloSubtitleText: {
    fontSize: 14,
    color: 'rgba(26,59,47,0.5)',
    fontWeight: '500',
    marginTop: 4,
  },
  groomerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItemCard: {
    width: '48%',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(26,59,47,0.02)',
  },
  statItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItemValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  statItemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(26,59,47,0.4)',
  },
  groomerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  viewAllLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFD166',
  },
  scheduleRowCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(26,59,47,0.03)',
  },
  petIconBackground: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  schedulePetName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  schedulePetBreed: {
    fontSize: 13,
    color: 'rgba(26,59,47,0.4)',
    fontWeight: '600',
    marginTop: 2,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 6,
  },
  statusBadgeCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(26,59,47,0.1)',
  },
  emptyStateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(26,59,47,0.4)',
    marginTop: 12,
  },
  availableJobCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,59,47,0.05)',
  },
  jobPriceValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#43A047',
    marginTop: 4,
  },
  acceptActionBtn: {
    backgroundColor: '#F0FAF5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  acceptActionText: {
    color: '#1A3B2F',
    fontWeight: '900',
    fontSize: 13,
  },
});
