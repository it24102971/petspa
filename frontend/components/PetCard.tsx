import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PetCardProps {
  name: string;
  type: string;
  breed?: string;
  age: number;
  cutenessLevel: number;
  imageUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PetCard({ name, type, breed, age, cutenessLevel, imageUrl, onEdit, onDelete }: PetCardProps) {
  const getEmoji = () => {
    switch (type.toLowerCase()) {
      case 'dog': return '🐶';
      case 'cat': return '🐱';
      case 'bird': return '🦜';
      case 'fish': return '🐠';
      case 'rabbit': return '🐰';
      case 'hamster': return '🐹';
      case 'turtle': return '🐢';
      case 'guinea pig': return '🐹';
      default: return '🐾';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <Text style={styles.emoji}>{getEmoji()}</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.breed}>{breed || 'Mixed Breed'} • {type}</Text>
        <Text style={styles.details}>{age} years • {cutenessLevel}/10 Cuteness</Text>
      </View>
      <View style={styles.actions}>
        {onEdit && (
          <Pressable onPress={onEdit} style={styles.actionBtn}>
            <Ionicons name="pencil" size={20} color="#FFD166" />
          </Pressable>
        )}
        {onDelete && (
          <Pressable onPress={onDelete} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          </Pressable>
        )}
      </View>
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
    overflow: 'hidden',
  },
  emoji: {
    fontSize: 26,
  },
  image: {
    width: '100%',
    height: '100%',
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
  },
});
