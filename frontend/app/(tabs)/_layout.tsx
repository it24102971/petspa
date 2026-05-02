import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import Sidebar from '@/components/Sidebar';

const AUTH_USER_KEY = "auth:user";

function TabLayoutContent() {
  const colorScheme = useColorScheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isSidebarVisible, closeSidebar } = useSidebar();

  useEffect(() => {
    const checkRole = async () => {
      try {
        const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (userData) {
          const user = JSON.parse(userData);
          setUserRole(user?.role || 'customer');
        }
      } catch (error) {
        console.error("Layout role check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    checkRole();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FAF5' }}>
        <ActivityIndicator size="small" color="#FFD166" />
      </View>
    );
  }

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#1A3B2F', // Dark forest green tint for active tab
          tabBarInactiveTintColor: 'rgba(26, 59, 47, 0.4)',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: 'rgba(26, 59, 47, 0.05)',
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            height: Platform.OS === 'ios' ? 90 : 72,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
          },
        }}>

        
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons size={26} name="home" color={color} />,
          }}
        />
        
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <Ionicons size={26} name="search" color={color} />,
            href: userRole === 'groomer' ? null : '/explore',
          }}
        />


        
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Appointments',
            tabBarIcon: ({ color }) => <Ionicons size={26} name="calendar" color={color} />,
          }}
        />

        <Tabs.Screen
          name="spa"
          options={{
            title: 'Spa',
            tabBarIcon: ({ color }) => <Ionicons size={26} name="sparkles" color={color} />,
            href: userRole === 'groomer' ? null : '/spa',
          }}
        />
        
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <Ionicons size={26} name="time" color={color} />,
          }}
        />
        
        <Tabs.Screen
          name="diary"
          options={{
            title: 'Diary',
            tabBarIcon: ({ color }) => <Ionicons size={26} name="book" color={color} />,
          }}
        />
        
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Ionicons size={26} name="person" color={color} />,
          }}
        />
      </Tabs>
      
      <Sidebar 
        isVisible={isSidebarVisible} 
        onClose={closeSidebar} 
      />
    </>
  );
}

export default function TabLayout() {
  return (
    <SidebarProvider>
      <TabLayoutContent />
    </SidebarProvider>
  );
}
