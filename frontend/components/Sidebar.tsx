import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
  Image,
  Alert,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.8, 310); // Standard drawer width with a max limit

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

const Sidebar = ({ isVisible, onClose }: SidebarProps) => {
  const [user, setUser] = useState<any>(null);
  const [shouldRender, setShouldRender] = useState(isVisible);
  const router = useRouter();
  
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('auth:user');
      if (userData) setUser(JSON.parse(userData));
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setShouldRender(false);
      });
    }
  }, [isVisible, opacityAnim, slideAnim]);

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path as any);
  };

  if (!shouldRender) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isVisible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.backdropTint, { opacity: opacityAnim }]} />
      </Pressable>

      {/* Sidebar Panel */}
      <Animated.View
        style={[
          styles.panel,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <SafeAreaView style={styles.safeContent}>
          <View style={styles.sidebarHeader}>
            <View style={styles.avatarCircle}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.sidebarAvatarImage} />
              ) : (
                <Ionicons name="person" size={40} color="#1A3B2F" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sidebarName} numberOfLines={2}>{user?.fullName || 'Guest'}</Text>
              <Text style={styles.sidebarRole}>{(user?.role || 'customer').toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={styles.menuList} 
            showsVerticalScrollIndicator={false}
            bounces={true}
          >


            <SidebarItem
              icon="home-outline"
              label="Home"
              onPress={() => handleNavigate('/(tabs)')}
            />
            {user?.role !== 'groomer' && (
              <SidebarItem
                icon="search-outline"
                label="Explore"
                onPress={() => handleNavigate('/(tabs)/explore')}
              />
            )}
            {user?.role !== 'groomer' && (
              <SidebarItem
                icon="sparkles-outline"
                label="Spa Services"
                onPress={() => handleNavigate('/(tabs)/spa')}
              />
            )}
            <SidebarItem
              icon="calendar-outline"
              label={user?.role === 'groomer' ? "My Appointments" : "My Bookings"}
              onPress={() => handleNavigate(user?.role === 'groomer' ? '/groomer/appointments' : '/(tabs)/history')}
            />
            {user?.role === 'groomer' && (
              <SidebarItem
                icon="time-outline"
                label="Appointment History"
                onPress={() => handleNavigate('/(tabs)/history')}
              />
            )}
            <SidebarItem
              icon="person-outline"
              label="My Profile"
              onPress={() => handleNavigate('/(tabs)/profile')}
            />
            {user?.role !== 'admin' && (
              <SidebarItem
                icon="book-outline"
                label="Spa Diary"
                onPress={() => handleNavigate('/(tabs)/diary')}
              />
            )}
            {user?.role === 'customer' && (
              <SidebarItem
                icon="paw-outline"
                label="My Pets"
                onPress={() => handleNavigate('/pets')}
              />
            )}
            <SidebarItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => {}}
            />
            {user?.role === 'admin' && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>ADMIN TOOLS</Text>
                <SidebarItem
                  icon="people-outline"
                  label="User Management"
                  onPress={() => handleNavigate('/admin/users')}
                />
                <SidebarItem
                  icon="paw-outline"
                  label="Pet Management"
                  onPress={() => handleNavigate('/admin/pets')}
                />
                <SidebarItem
                  icon="business-outline"
                  label="Groomer Management"
                  onPress={() => handleNavigate('/admin/groomers')}
                />
                <SidebarItem
                  icon="calendar-outline"
                  label="Appointment Management"
                  onPress={() => handleNavigate('/admin/appointments')}
                />
                <SidebarItem
                  icon="sparkles-outline"
                  label="Service Management"
                  onPress={() => handleNavigate('/(tabs)/spa')}
                />
                <SidebarItem
                  icon="cafe-outline"
                  label="Cafe Management"
                  onPress={() => handleNavigate('/admin/cafe')}
                />
              </>
            )}
            <View style={styles.divider} />
            <SidebarItem
              icon="settings-outline"
              label="Settings"
              onPress={() => {}}
            />
            <SidebarItem
              icon="help-circle-outline"
              label="Help Center"
              onPress={() => {}}
            />

          </ScrollView>

          <View style={styles.footer}>
            <Pressable 
              style={({ pressed }) => [styles.logoutSidebarButton, pressed && { opacity: 0.7 }]}
              onPress={() => {
                Alert.alert(
                  "Logout",
                  "Are you sure you want to logout?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Logout", 
                      style: "destructive",
                      onPress: async () => {
                        onClose();
                        try {
                          await AsyncStorage.multiRemove([
                            'auth:user', 
                            'auth:token', 
                            'auth:isSignedIn',
                            'onboarding:seen'
                          ]);
                          router.dismissAll();
                          router.replace("/");
                        } catch (e) {
                          console.error(e);
                          router.replace("/");
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#ffffff" />
              <Text style={styles.logoutSidebarText}>Logout</Text>
            </Pressable>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>

        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const SidebarItem = ({ icon, label, onPress }: any) => (
  <Pressable
    style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    onPress={onPress}
  >
    <Ionicons name={icon} size={22} color="#1A3B2F" />
    <Text style={styles.menuLabel}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#F0FAF5',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  safeContent: {
    flex: 1,
  },
  sidebarHeader: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    overflow: 'hidden',
  },
  sidebarAvatarImage: {
    width: '100%',
    height: '100%',
  },
  sidebarName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  sidebarRole: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.5)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(26, 59, 47, 0.4)',
    marginLeft: 14,
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(26, 59, 47, 0.05)',
    marginHorizontal: 24,
    marginVertical: 12,
  },
  menuList: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 14,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(26, 59, 47, 0.05)',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 59, 47, 0.05)',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '600',
  },
  logoutSidebarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3B2F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutSidebarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});


export default Sidebar;
