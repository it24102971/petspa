import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

type PetService = {
  name: string;
  duration: string;
  type: string;
  description: string;
};

const PET_SERVICES: PetService[] = [
  {
    name: 'Full Grooming Package',
    duration: '2 Hours',
    type: 'Grooming',
    description: 'Includes bath, brush, haircut, nail trim, and ear cleaning.',
  },
  {
    name: 'Bath & Brush',
    duration: '1 Hour',
    type: 'Basic',
    description: 'A refreshing bath with premium shampoo and a thorough brush out.',
  },
  {
    name: 'Nail Trim & Grind',
    duration: '15 Mins',
    type: 'Quick Service',
    description: 'Safe and smooth nail trimming and grinding for your pet.',
  },
  {
    name: 'Teeth Cleaning',
    duration: '30 Mins',
    type: 'Health',
    description: 'Gentle teeth brushing for fresh breath and dental health.',
  },
  {
    name: 'Flea & Tick Treatment',
    duration: '45 Mins',
    type: 'Treatment',
    description: 'Effective flea and tick bath and preventative application.',
  },
  {
    name: 'De-Shedding Treatment',
    duration: '1.5 Hours',
    type: 'Specialty',
    description: 'Specialized treatment to reduce shedding and remove loose undercoat.',
  },
];

export default function SearchPlacesScreen() {
  const [query, setQuery] = useState('');

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return PET_SERVICES;

    return PET_SERVICES.filter((service) => {
      return (
        service.name.toLowerCase().includes(normalizedQuery) ||
        service.duration.toLowerCase().includes(normalizedQuery) ||
        service.type.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Search Pet Services</Text>
          <IconSymbol name="magnifyingglass" size={22} color="#0b3a53" />
        </View>
        <Text style={styles.subtitle}>
          Find services by name, duration, or type.
        </Text>

        <View style={styles.searchWrapper}>
          <IconSymbol name="magnifyingglass" size={18} color="#64748b" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search services like Grooming, Bath, Health"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>{filteredServices.length} services found</Text>
        </View>

        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={36} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No services found. Try another keyword.</Text>
          </View>
        ) : (
          filteredServices.map((service) => (
            <View key={service.name} style={styles.card}>
              <View style={styles.cardTopRow}>
                <Text style={styles.placeName}>{service.name}</Text>
                <Text style={styles.badge}>{service.type}</Text>
              </View>
              <Text style={styles.district}>{service.duration}</Text>
              <Text style={styles.description}>{service.description}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fb',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  headerRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  searchWrapper: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e3ea',
    paddingHorizontal: 12,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 15,
  },
  resultsHeader: {
    marginTop: 6,
  },
  resultsText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  placeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  badge: {
    backgroundColor: '#FFD166',
    color: '#1A3B2F',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    textTransform: 'uppercase',
  },
  district: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  description: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    marginTop: 30,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
