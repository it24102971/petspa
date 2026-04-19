import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const HISTORY_DATA = [
  {
    id: '1',
    petName: 'Rocky',
    breed: 'German Shepherd',
    date: '18 May 2024',
    service: 'Full Grooming',
    status: 'Completed',
  },
  {
    id: '2',
    petName: 'Bella',
    breed: 'Pomeranian',
    date: '17 May 2024',
    service: 'Bath & Dry',
    status: 'Completed',
  },
  {
    id: '3',
    petName: 'Milo',
    breed: 'Labrador',
    date: '16 May 2024',
    service: 'Nail Trimming',
    status: 'Completed',
  },
  {
    id: '4',
    petName: 'Luna',
    breed: 'Shih Tzu',
    date: '15 May 2024',
    service: 'Haircut',
    status: 'Completed',
  },
];

export default function HistoryScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Completed', 'Cancelled'];

  const renderHistoryItem = ({ item }: any) => (
    <View style={styles.historyCard}>
      <View style={styles.petImageContainer}>
        <View style={styles.petImagePlaceholder}>
          <Ionicons name="paw" size={32} color="rgba(26, 59, 47, 0.2)" />
        </View>
      </View>
      
      <View style={styles.historyDetails}>
        <Text style={styles.petName}>{item.petName}</Text>
        <Text style={styles.petBreed}>{item.breed}</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666666" />
          <Text style={styles.infoText}>{item.date}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#666666" />
          <Text style={styles.infoText}>{item.service}</Text>
        </View>
      </View>

      <View style={[
        styles.statusBadge,
        { backgroundColor: item.status === 'Completed' ? '#E0F2F1' : '#FFEBEE' }
      ]}>
        <Text style={[
          styles.statusText,
          { color: item.status === 'Completed' ? '#00897B' : '#C62828' }
        ]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton}>
          <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <Text style={styles.headerTitle}>History</Text>
        <Pressable style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#1A3B2F" />
        </Pressable>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
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
        </View>
      </View>

      {/* History List */}
      <FlatList
        data={HISTORY_DATA.filter(item => activeFilter === 'All' || item.status === activeFilter)}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
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
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
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
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  petImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0FAF5',
  },
  petImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDetails: {
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },
});
