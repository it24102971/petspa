import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SIZES } from '@/constants/spacing';
import { useSidebar } from '@/context/SidebarContext';

const APPOINTMENTS_DATA = [
  {
    id: '1',
    petName: 'Buddy',
    breed: 'Golden Retriever',
    date: '20 May 2024',
    time: '10:00 AM',
    status: 'Pending',
    image: null, // Placeholder
  },
  {
    id: '2',
    petName: 'Lucy',
    breed: 'Poodle',
    date: '20 May 2024',
    time: '01:00 PM',
    status: 'Accepted', // Image shows this one doesn't have buttons, but ref has it as accepted
    image: null,
  },
  {
    id: '3',
    petName: 'Max',
    breed: 'Shih Tzu',
    date: '20 May 2024',
    time: '04:00 PM',
    status: 'Pending',
    image: null,
  },
  {
    id: '4',
    petName: 'Charlie',
    breed: 'Beagle',
    date: '21 May 2024',
    time: '11:00 AM',
    status: 'Completed',
    image: null,
  },
];

export default function AppointmentsScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const { openSidebar } = useSidebar();
  const filters = ['All', 'Pending', 'Accepted', 'Completed'];

  const renderAppointmentItem = ({ item }: any) => (
    <View style={styles.appointmentCard}>
      <View style={styles.cardMain}>
        <View style={styles.petImageContainer}>
          <View style={styles.petImagePlaceholder}>
            <Ionicons name="paw" size={32} color="rgba(26, 59, 47, 0.2)" />
          </View>
        </View>
        
        <View style={styles.appointmentDetails}>
          <Text style={styles.petName}>{item.petName}</Text>
          <Text style={styles.petBreed}>{item.breed}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666666" />
            <Text style={styles.infoText}>{item.date}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#666666" />
            <Text style={styles.infoText}>{item.time}</Text>
          </View>
        </View>

        {item.status === 'Completed' && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </View>

      {item.status === 'Pending' && (
        <View style={styles.cardActions}>
          <Pressable style={styles.rejectButton}>
            <Text style={styles.rejectButtonText}>Reject</Text>
          </Pressable>
          <Pressable style={styles.acceptButton}>
            <Text style={styles.acceptButtonText}>Accept</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={openSidebar} style={styles.headerButton} hitSlop={15}>
          <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <Text style={styles.headerTitle}>Appointments</Text>
        <Pressable style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#1A3B2F" />
        </Pressable>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterPill,
                activeFilter === filter && styles.filterPillActive
              ]}
            >
              <Text style={[
                styles.filterPillText,
                activeFilter === filter && styles.filterPillTextActive
              ]}>
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Appointment List */}
      <FlatList
        data={APPOINTMENTS_DATA.filter(item => activeFilter === 'All' || item.status === activeFilter)}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointmentItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    minWidth: 80,
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: '#FFD166',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  filterPillTextActive: {
    color: '#1A3B2F',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0FAF5',
  },
  petImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentDetails: {
    flex: 1,
    marginLeft: 16,
  },
  petName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.5)',
    fontWeight: '600',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00897B',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    height: SIZES.buttonHeight,
    borderRadius: SIZES.buttonRadius,
    borderWidth: 1.5,
    borderColor: '#EF5350',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EF5350',
  },
  acceptButton: {
    flex: 1,
    height: SIZES.buttonHeight,
    borderRadius: SIZES.buttonRadius,
    backgroundColor: '#FFD166',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3B2F',
  },
});
