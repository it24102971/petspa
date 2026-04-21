import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PetCardProps {
  name: string;
  type: string;
  breed?: string;
  age: number;
  weight: number;
  onDelete?: () => void;
}

export default function PetCard({ name, type, breed, age, weight, onDelete }: PetCardProps) {
  const getIcon = () => {
    switch (type.toLowerCase()) {
      case 'dog': return 'paw';
      case 'cat': return 'logo-octocat';
      case 'bird': return 'airplane-outline';
      default: return 'paw';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name={getIcon() as any} size={24} color="#1A3B2F" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.breed}>{breed || 'Mixed Breed'} • {type}</Text>
        <Text style={styles.details}>{age} years • {weight} kg</Text>
      </View>
      {onDelete && (
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  breed: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.6)',
    fontWeight: '600',
    marginTop: 2,
  },
  details: {
    fontSize: 11,
    color: '#FFD166',
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  deleteBtn: {
    padding: 8,
  },
});
