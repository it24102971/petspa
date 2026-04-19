import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Sidebar } from '@/components/Sidebar';

const AUTH_USER_KEY = "auth:user";
const AUTH_STATUS_KEY = "auth:isSignedIn";
const AUTH_TOKEN_KEY = "auth:token";
const ONBOARDING_SEEN_KEY = "onboarding:seen";

// --- Components ---

const CustomerDashboardContent = ({ user, onLogout, onExplore, onOpenSidebar }: any) => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={onOpenSidebar} style={styles.menuButton} hitSlop={15}>
          <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Customer'}</Text>
        </View>
      </View>
      <Pressable style={styles.logoutButton} onPress={onLogout} hitSlop={10}>
        <Ionicons name="log-out-outline" size={18} color="#1A3B2F" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </View>

    <View style={styles.roleBadge}>
      <Text style={styles.roleText}>CUSTOMER</Text>
    </View>

    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>12</Text>
        <Text style={styles.statLabel}>Bookings</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>05</Text>
        <Text style={styles.statLabel}>Pets</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>08</Text>
        <Text style={styles.statLabel}>Reviews</Text>
      </View>
    </View>

    <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="calendar-outline" size={40} color="#FFD166" />
      </View>
      <Text style={styles.emptyStateTitle}>No appointments planned yet</Text>
      <Text style={styles.emptyStateSub}>Book an appointment to pamper your furry friend.</Text>
      <Pressable style={styles.actionButton} onPress={onExplore}>
        <Text style={styles.actionButtonText}>Book Appointment</Text>
      </Pressable>
    </View>
  </ScrollView>
);

const GroomerDashboardContent = ({ user, onLogout, onOpenSidebar }: any) => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    {/* Header */}
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={onOpenSidebar} style={styles.menuButton} hitSlop={15}>
          <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <View>
          <Text style={styles.welcomeText}>Professional Groomer,</Text>
          <Text style={styles.userName}>{user?.fullName.split(' ')[0] || 'Groomer'}</Text>
        </View>
      </View>
      <Pressable style={styles.logoutButton} onPress={onLogout} hitSlop={10}>
        <Ionicons name="log-out-outline" size={18} color="#1A3B2F" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </View>


    {/* Welcome Card */}
    <View style={styles.welcomeCardContainer}>
      <View style={styles.welcomeCardContent}>
        <View style={styles.groomerAvatarContainer}>
          <View style={styles.groomerAvatarPlaceholder}>
            <Ionicons name="person" size={50} color="#1A3B2F" />
          </View>
        </View>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeGreeting}>Hello, {user?.fullName.split(' ')[0] || 'Groomer'}! 👋</Text>
          <Text style={styles.welcomeSubtext}>Welcome back to your dashboard</Text>
        </View>
      </View>
    </View>

    {/* Stats Grid */}
    <View style={styles.statsGrid}>
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: '#ffffff' }]}>
          <View style={styles.statBoxHeader}>
            <Text style={styles.statBoxNumber}>4.8</Text>
            <Ionicons name="star" size={20} color="#FFD166" />
          </View>
          <Text style={styles.statBoxLabel}>Average Rating</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#F0F0FF' }]}>
          <Text style={styles.statBoxNumber}>12</Text>
          <Text style={styles.statBoxLabel}>Total Reviews</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
          <View style={styles.statBoxHeader}>
            <Text style={styles.statBoxNumber}>5</Text>
            <Ionicons name="calendar" size={20} color="#4CAF50" />
          </View>
          <Text style={styles.statBoxLabel}>Today's Appointments</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#E3F2FD' }]}>
          <View style={styles.statBoxHeader}>
            <Text style={styles.statBoxNumber}>32</Text>
            <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
          </View>
          <Text style={styles.statBoxLabel}>Completed Jobs</Text>
        </View>
      </View>
    </View>

    {/* Schedule Header */}
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitleText}>Today's Schedule</Text>
      <Pressable><Text style={styles.viewAllTextLink}>View All</Text></Pressable>
    </View>

    {/* Schedule List */}
    <View style={styles.scheduleList}>
      {[
        { id: '1', pet: 'Buddy', breed: 'Golden Retriever', time: '10:00 AM', status: 'Pending', color: '#E0F2F1' },
        { id: '2', pet: 'Lucy', breed: 'Poodle', time: '01:00 PM', status: 'Accepted', color: '#FFF3E0' },
        { id: '3', pet: 'Max', breed: 'Shih Tzu', time: '04:00 PM', status: 'Pending', color: '#E0F2F1' },
      ].map((item) => (
        <View key={item.id} style={styles.scheduleCard}>
          <View style={styles.petAvatarSmall}>
            <Ionicons name="paw" size={24} color="#1A3B2F" />
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.petNameText}>{item.pet}</Text>
            <Text style={styles.petBreedText}>{item.breed}</Text>
          </View>
          <View style={styles.scheduleTimeStatus}>
            <Text style={styles.scheduleTimeText}>{item.time}</Text>
            <View style={[styles.statusBadgeSmall, { backgroundColor: item.status === 'Pending' ? '#E0F7FA' : '#FFF3E0' }]}>
              <Text style={[styles.statusBadgeTextSmall, { color: item.status === 'Pending' ? '#006064' : '#E65100' }]}>{item.status}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  </ScrollView>
);

const AdminDashboardContent = ({ user, onLogout, onOpenSidebar, onAddGroomer }: any) => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={onOpenSidebar} style={styles.menuButton} hitSlop={15}>
          <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <View>
          <Text style={styles.welcomeText}>System Admin,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Admin'}</Text>
        </View>
      </View>
      <Pressable style={styles.logoutButton} onPress={onLogout} hitSlop={10}>
        <Ionicons name="log-out-outline" size={18} color="#1A3B2F" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </View>

    <View style={[styles.roleBadge, { backgroundColor: 'rgba(211, 47, 47, 0.1)' }]}>
      <Text style={[styles.roleText, { color: '#D32F2F' }]}>ADMINISTRATOR</Text>
    </View>

    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>1.2k</Text>
        <Text style={styles.statLabel}>Users</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>320</Text>
        <Text style={styles.statLabel}>Appointments</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>25</Text>
        <Text style={styles.statLabel}>Groomers</Text>
      </View>
    </View>

    <Text style={styles.sectionTitle}>Quick Actions</Text>
    <View style={styles.quickActionsGrid}>
      <Pressable style={styles.quickActionItem} onPress={onAddGroomer}>
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(46, 125, 50, 0.2)' }]}>
          <Ionicons name="person-add-outline" size={24} color="#81C784" />
        </View>
        <Text style={styles.actionLabel}>Add Groomer</Text>
      </Pressable>
    </View>

    <View style={styles.managerCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Recent Notifications</Text>
        <Pressable><Text style={styles.viewAllText}>View All</Text></Pressable>
      </View>
      <View style={styles.activityItem}>
        <View style={[styles.activityDot, { backgroundColor: '#FFD166' }]} />
        <View>
          <Text style={styles.activityText}>New groomer verification request</Text>
          <Text style={styles.activityTime}>Paws & Palms Groomer</Text>
        </View>
      </View>
      <View style={styles.activityItem}>
        <View style={[styles.activityDot, { backgroundColor: '#FFD166' }]} />
        <View>
          <Text style={styles.activityText}>Security alert: Unusual login</Text>
          <Text style={styles.activityTime}>Review required</Text>
        </View>
      </View>
    </View>
  </ScrollView>
);

// --- Main Screen ---

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Fetch user failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

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
            onOpenSidebar={() => setSidebarVisible(true)}
            onAddGroomer={() => router.push('/admin/add-groomer')}
          />
        ) : user?.role === 'groomer' ? (
          <GroomerDashboardContent 
            user={user} 
            onLogout={handleLogout} 
            onOpenSidebar={() => setSidebarVisible(true)}
          />
        ) : (
          <CustomerDashboardContent 
            user={user} 
            onLogout={handleLogout} 
            onExplore={() => router.push('/(tabs)/explore')} 
            onOpenSidebar={() => setSidebarVisible(true)}
          />
        )}
      </SafeAreaView>
      <Sidebar isVisible={isSidebarVisible} onClose={() => setSidebarVisible(false)} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 15,
    color: 'rgba(26, 59, 47, 0.6)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD166',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  logoutButtonText: {
    color: '#1A3B2F',
    fontSize: 12,
    fontWeight: '800',
  },
  roleBadge: {
    backgroundColor: 'rgba(26, 59, 47, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 28,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: 1.2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(26, 59, 47, 0.4)',
    marginTop: 4,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 18,
    letterSpacing: -0.3,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 209, 102, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 26,
  },
  actionButton: {
    backgroundColor: '#FFD166',
    height: 56,
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#1A3B2F',
    fontWeight: '900',
    fontSize: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 8,
    width: '30%',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.7)',
  },
  managerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  viewAllText: {
    fontSize: 13,
    color: '#FFD166',
    fontWeight: '800',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#81C784',
  },
  activityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  activityTime: {
    fontSize: 11,
    color: 'rgba(26, 59, 47, 0.4)',
    marginTop: 2,
  },
  // Groomer Redesign Styles
  headerTitleCenter: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
    flex: 1,
    textAlign: 'center',
    marginLeft: -4, // Adjust for notification button alignment
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FAF5',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
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
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.6)',
    lineHeight: 20,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  statBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statBoxNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  statBoxLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.5)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  viewAllTextLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD166', // Using brand yellow for consistency
  },
  scheduleList: {
    gap: 12,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  petAvatarSmall: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  petNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 2,
  },
  petBreedText: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.5)',
    fontWeight: '600',
  },
  scheduleTimeStatus: {
    alignItems: 'flex-end',
    gap: 6,
  },
  scheduleTimeText: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.7)',
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeTextSmall: {
    fontSize: 11,
    fontWeight: '900',
  },
});
