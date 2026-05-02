import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable,
  ActivityIndicator, Platform, Alert, TextInput, Modal, KeyboardAvoidingView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import * as ImagePicker from 'expo-image-picker';

const AUTH_USER_KEY = "auth:user";
const AUTH_TOKEN_KEY = "auth:token";
const AUTH_STATUS_KEY = "auth:isSignedIn";
const ONBOARDING_SEEN_KEY = "onboarding:seen";

type DiaryEntry = {
  _id: string;
  petName: string;
  petType: string;
  title: string;
  content: string;
  rating: number;
  serviceDate: string;
  isPublic: boolean;
  photoUrl?: string | null;
  createdAt: string;
  user?: { fullName: string } | string;
};

type TabMode = 'feed' | 'mine';

const PET_TYPES = ['dog', 'cat', 'bird', 'rabbit', 'other'] as const;

const PET_ICONS: Record<string, string> = {
  dog: '🐕',
  cat: '🐈',
  bird: '🐦',
  rabbit: '🐇',
  other: '🐾',
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);

  if (Number.isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const pad = (value: number) => String(value).padStart(2, '0');

const formatInputDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseInputDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getTodayInputDate = () => formatInputDate(new Date());

// ─── Star Rating Component ──────────────────────────────────────────
const StarRating = ({ rating, onRate, size = 22 }: { rating: number; onRate?: (r: number) => void; size?: number }) => (
  <View style={{ flexDirection: 'row', gap: 3 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Pressable key={star} onPress={() => onRate?.(star)} disabled={!onRate} hitSlop={6}>
        <Ionicons
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={star <= rating ? '#FFD166' : 'rgba(26,59,47,0.2)'}
        />
      </Pressable>
    ))}
  </View>
);

// ─── Diary Card ─────────────────────────────────────────────────────
const DiaryCard = ({
  entry, isOwner, onEdit, onDelete,
}: {
  entry: DiaryEntry; isOwner: boolean; onEdit: () => void; onDelete: () => void;
}) => {
  const authorName =
    typeof entry.user === 'object' && entry.user !== null
      ? entry.user.fullName
      : 'Anonymous';

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.cardHeader}>
        <View style={s.petBadge}>
          <Text style={s.petEmoji}>{PET_ICONS[entry.petType] || '🐾'}</Text>
          <View>
            <Text style={s.petName}>{entry.petName}</Text>
            <Text style={s.authorName}>by {authorName}</Text>
          </View>
        </View>
        {isOwner && (
          <View style={s.cardActions}>
            <Pressable onPress={onEdit} hitSlop={10} style={s.iconBtn}>
              <Ionicons name="create-outline" size={18} color="#1A3B2F" />
            </Pressable>
            <Pressable onPress={onDelete} hitSlop={10} style={[s.iconBtn, { backgroundColor: 'rgba(211,47,47,0.08)' }]}>
              <Ionicons name="trash-outline" size={18} color="#D32F2F" />
            </Pressable>
          </View>
        )}
      </View>

      {/* Body */}
      {entry.photoUrl ? (
        <Image
          source={{ uri: entry.photoUrl }}
          style={{ width: '100%', height: 210, borderRadius: 18, marginBottom: 14, backgroundColor: 'rgba(26,59,47,0.06)' }}
          resizeMode="cover"
        />
      ) : null}
      <Text style={s.cardTitle}>{entry.title}</Text>
      <Text style={s.cardContent}>{entry.content}</Text>

      {/* Footer */}
      <View style={s.cardFooter}>
        <StarRating rating={entry.rating} size={16} />
        <View style={s.dateBadge}>
          <Ionicons name="calendar-outline" size={12} color="rgba(26,59,47,0.5)" />
          <Text style={s.dateText}>{formatDate(entry.serviceDate)}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Create / Edit Modal ────────────────────────────────────────────
const DiaryFormModal = ({
  visible, onClose, onSave, initial, saving,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial: DiaryEntry | null;
  saving: boolean;
}) => {
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState<string>('dog');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [serviceDate, setServiceDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const todayInputDate = getTodayInputDate();

  useEffect(() => {
    if (visible) {
      if (initial) {
        setPetName(initial.petName);
        setPetType(initial.petType);
        setTitle(initial.title);
        setContent(initial.content);
        setRating(initial.rating);
        setServiceDate(formatInputDate(parseInputDate(initial.serviceDate)));
        setIsPublic(initial.isPublic);
      } else {
        setPetName('');
        setPetType('dog');
        setTitle('');
        setContent('');
        setRating(5);
        setServiceDate(formatInputDate(new Date()));
        setIsPublic(true);
      }
      setSelectedImage(null);
    }
  }, [visible, initial]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to add an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleSubmit = () => {
    if (!petName.trim() || !title.trim() || !content.trim() || !serviceDate.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    onSave({
      petName,
      petType,
      title,
      content,
      rating,
      serviceDate,
      isPublic,
      photoUrl: initial?.photoUrl || null,
      imageAsset: selectedImage,
    });
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setServiceDate(formatInputDate(selectedDate));
    }
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={s.modalContainer}>
          {/* Modal Header */}
          <View style={s.modalHeader}>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={26} color="#1A3B2F" />
            </Pressable>
            <Text style={s.modalTitle}>{initial ? 'Edit Entry' : 'New Diary Entry'}</Text>
            <View style={{ width: 26 }} />
          </View>

          <ScrollView contentContainerStyle={s.formScroll} showsVerticalScrollIndicator={false}>
            {/* Pet Name */}
            <Text style={s.label}>Pet Name *</Text>
            <TextInput style={s.input} value={petName} onChangeText={setPetName} placeholder="e.g. Buddy" placeholderTextColor="rgba(26,59,47,0.3)" />

            {/* Pet Type */}
            <Text style={s.label}>Pet Type</Text>
            <View style={s.chipRow}>
              {PET_TYPES.map((t) => (
                <Pressable key={t} style={[s.chip, petType === t && s.chipActive]} onPress={() => setPetType(t)}>
                  <Text style={s.chipEmoji}>{PET_ICONS[t]}</Text>
                  <Text style={[s.chipText, petType === t && s.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>

            {/* Title */}
            <Text style={s.label}>Title *</Text>
            <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Spa day summary" placeholderTextColor="rgba(26,59,47,0.3)" maxLength={100} />

            {/* Photo */}
            <Text style={s.label}>Photo</Text>
            <Pressable style={s.imagePickerBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={18} color="#1A3B2F" />
              <Text style={s.imagePickerText}>{selectedImage ? 'Change image' : 'Pick an image'}</Text>
            </Pressable>
            {(selectedImage?.uri || initial?.photoUrl) ? (
              <View style={s.imagePreviewWrap}>
                <Image
                  source={{ uri: selectedImage?.uri || initial?.photoUrl || '' }}
                  style={s.imagePreview}
                  resizeMode="cover"
                />
              </View>
            ) : null}

            {/* Content */}
            <Text style={s.label}>Review / Notes *</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Share your experience..."
              placeholderTextColor="rgba(26,59,47,0.3)"
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />

            {/* Rating */}
            <Text style={s.label}>Rating</Text>
            <StarRating rating={rating} onRate={setRating} size={30} />

            {/* Service Date */}
            <Text style={[s.label, { marginTop: 20 }]}>Service Date * (YYYY-MM-DD)</Text>
            {Platform.OS === 'web' ? (
              <View style={s.dateInputRow}>
                <Ionicons name="calendar-outline" size={18} color="rgba(26,59,47,0.45)" />
                <input
                  type="date"
                  value={serviceDate}
                  min={todayInputDate}
                  onChange={(event) => setServiceDate(event.currentTarget.value)}
                  style={webDateInputStyle}
                />
              </View>
            ) : (
              <>
                <Pressable style={s.dateInputRow} onPress={() => setShowDatePicker((visible) => !visible)}>
                  <Ionicons name="calendar-outline" size={18} color="rgba(26,59,47,0.45)" />
                  <Text style={[s.dateValue, !serviceDate && s.datePlaceholder]}>
                    {serviceDate || 'Select a date'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="rgba(26,59,47,0.35)" />
                </Pressable>
                {showDatePicker && (
                  <View style={s.pickerWrap}>
                    <DateTimePicker
                      value={serviceDate ? parseInputDate(serviceDate) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      onChange={handleDateChange}
                      minimumDate={new Date(todayInputDate)}
                      maximumDate={new Date('2100-12-31')}
                    />
                    {Platform.OS === 'ios' && (
                      <Pressable style={s.pickerDoneBtn} onPress={() => setShowDatePicker(false)}>
                        <Text style={s.pickerDoneText}>Done</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </>
            )}

            {/* Public toggle */}
            <Pressable style={s.toggleRow} onPress={() => setIsPublic((p) => !p)}>
              <Ionicons name={isPublic ? 'globe-outline' : 'lock-closed-outline'} size={20} color="#1A3B2F" />
              <Text style={s.toggleLabel}>{isPublic ? 'Visible in public feed' : 'Private — only you can see'}</Text>
              <View style={[s.toggleTrack, isPublic && s.toggleTrackActive]}>
                <View style={[s.toggleThumb, isPublic && s.toggleThumbActive]} />
              </View>
            </Pressable>

            {/* Submit */}
            <Pressable style={[s.submitBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#1A3B2F" />
              ) : (
                <Text style={s.submitBtnText}>{initial ? 'Save Changes' : 'Post Entry'}</Text>
              )}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Diary Screen ──────────────────────────────────────────────
export default function DiaryScreen() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabMode>('feed');
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editEntry, setEditEntry] = useState<DiaryEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const getLatestToken = async () => {
    const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (storedToken) setToken(storedToken);
    return storedToken;
  };

  const clearAuthAndRedirect = async (message: string) => {
    await AsyncStorage.multiRemove([AUTH_USER_KEY, AUTH_TOKEN_KEY, AUTH_STATUS_KEY, ONBOARDING_SEEN_KEY]);
    setToken(null);
    setUserId(null);
    setEntries([]);
    Alert.alert('Session expired', message, [{ text: 'OK', onPress: () => router.replace('/login') }]);
  };

  // Load auth
  useEffect(() => {
    (async () => {
      const [userData, tkn] = await Promise.all([
        AsyncStorage.getItem(AUTH_USER_KEY),
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
      ]);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUserId(parsedUser?._id || parsedUser?.id || null);
      }
      setToken(tkn);
    })();
  }, []);

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    const activeToken = token || (await getLatestToken());
    if (!activeToken) return;
    setLoading(true);
    try {
      const endpoint = tab === 'feed' ? '/diary/feed' : '/diary/mine';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.status === 401) {
        await clearAuthAndRedirect('Please sign in again to view your diary entries.');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error('Fetch diary error:', err);
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useEffect(() => {
    if (token) fetchEntries();
  }, [fetchEntries, token]);

  // CREATE / UPDATE
  const handleSave = async (data: any) => {
    const activeToken = token || (await getLatestToken());
    if (!activeToken) {
      await clearAuthAndRedirect('Please sign in again before posting a diary entry.');
      return;
    }
    setSaving(true);
    try {
      const url = editEntry
        ? `${API_BASE_URL}/diary/${editEntry._id}`
        : `${API_BASE_URL}/diary`;
      const method = editEntry ? 'PUT' : 'POST';

      const formData = new FormData();
      formData.append('petName', data.petName);
      formData.append('petType', data.petType);
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('rating', String(data.rating));
      formData.append('serviceDate', data.serviceDate);
      formData.append('isPublic', String(data.isPublic));

      if (data.imageAsset?.uri) {
        const uri = data.imageAsset.uri;
        const fileName = data.imageAsset.fileName || `diary-photo-${Date.now()}.jpg`;
        const mimeType = data.imageAsset.mimeType || 'image/jpeg';

        if (Platform.OS === 'web') {
          if (data.imageAsset.base64) {
            formData.append('photoBase64', data.imageAsset.base64);
            formData.append('photoMimeType', mimeType);
            formData.append('photoFileName', fileName);
          } else {
            const imageResponse = await fetch(uri);
            const blob = await imageResponse.blob();
            formData.append('photo', blob, fileName);
          }
        } else {
          formData.append('photo', {
            uri,
            name: fileName,
            type: mimeType,
          } as any);
        }
      } else if (data.photoUrl) {
        formData.append('photoUrl', data.photoUrl);
      }

      console.log('Diary POST ->', { url, method, hasImage: !!data.imageAsset, photoUrl: !!data.photoUrl });
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
        body: formData,
      });

      console.log('Diary POST response status:', res.status);
      let respBody = null;
      try {
        respBody = await res.clone().json().catch(() => null);
      } catch (e) {
        // ignore
      }
      console.log('Diary POST response body:', respBody);

      if (res.status === 401) {
        await clearAuthAndRedirect('Your session expired. Please sign in again and try posting the entry.');
        return;
      }

      if (res.ok) {
        setModalVisible(false);
        setEditEntry(null);
        fetchEntries();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Something went wrong');
      }
    } catch (err) {
      Alert.alert('Error', 'Network request failed');
    } finally {
      setSaving(false);
    }
  };

  // DELETE
  const handleDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this diary entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const activeToken = token || (await getLatestToken());
            if (!activeToken) {
              await clearAuthAndRedirect('Please sign in again to delete diary entries.');
              return;
            }
            const res = await fetch(`${API_BASE_URL}/diary/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${activeToken}` },
            });
            if (res.status === 401) {
              await clearAuthAndRedirect('Your session expired. Please sign in again.');
              return;
            }
            if (res.ok) fetchEntries();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.screenHeader}>
          <View>
            <Text style={s.screenTitle}>Spa Diary</Text>
            <Text style={s.screenSub}>Pet visit memories & reviews</Text>
          </View>
          <Pressable style={s.fab} onPress={() => { setEditEntry(null); setModalVisible(true); }}>
            <Ionicons name="add" size={22} color="#1A3B2F" />
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={s.tabBar}>
          <Pressable style={[s.tabItem, tab === 'feed' && s.tabActive]} onPress={() => setTab('feed')}>
            <Ionicons name="globe-outline" size={16} color={tab === 'feed' ? '#1A3B2F' : 'rgba(26,59,47,0.4)'} />
            <Text style={[s.tabText, tab === 'feed' && s.tabTextActive]}>Public Feed</Text>
          </Pressable>
          <Pressable style={[s.tabItem, tab === 'mine' && s.tabActive]} onPress={() => setTab('mine')}>
            <Ionicons name="person-outline" size={16} color={tab === 'mine' ? '#1A3B2F' : 'rgba(26,59,47,0.4)'} />
            <Text style={[s.tabText, tab === 'mine' && s.tabTextActive]}>My Entries</Text>
          </Pressable>
        </View>

        {/* Content */}
        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color="#FFD166" />
          </View>
        ) : entries.length === 0 ? (
          <View style={s.centered}>
            <View style={s.emptyIcon}>
              <Ionicons name="book-outline" size={48} color="#FFD166" />
            </View>
            <Text style={s.emptyTitle}>
              {tab === 'feed' ? 'No public entries yet' : "You haven't posted yet"}
            </Text>
            <Text style={s.emptySub}>
              {tab === 'feed'
                ? 'Be the first to share a spa experience!'
                : 'Tap + to create your first diary entry.'}
            </Text>
            {tab === 'mine' && (
              <Pressable style={s.emptyBtn} onPress={() => { setEditEntry(null); setModalVisible(true); }}>
                <Text style={s.emptyBtnText}>Create Entry</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.feed} showsVerticalScrollIndicator={false}>
            {entries.map((entry) => {
              const ownerId = typeof entry.user === 'object' ? (entry.user as any)?._id : entry.user;
              const isOwner = ownerId === userId || (typeof entry.user === 'string' && entry.user === userId);
              return (
                <DiaryCard
                  key={entry._id}
                  entry={entry}
                  isOwner={tab === 'mine' || isOwner}
                  onEdit={() => { setEditEntry(entry); setModalVisible(true); }}
                  onDelete={() => handleDelete(entry._id)}
                />
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Form Modal */}
      <DiaryFormModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditEntry(null); }}
        onSave={handleSave}
        initial={editEntry}
        saving={saving}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FAF5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },

  // Header
  screenHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 10 : 30, paddingBottom: 8,
  },
  screenTitle: { fontSize: 28, fontWeight: '900', color: '#1A3B2F', letterSpacing: -0.5 },
  screenSub: { fontSize: 14, color: 'rgba(26,59,47,0.5)', fontWeight: '500', marginTop: 2 },
  fab: {
    width: 46, height: 46, borderRadius: 16, backgroundColor: '#FFD166',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FFD166', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row', marginHorizontal: 24, marginTop: 16, marginBottom: 8,
    backgroundColor: '#ffffff', borderRadius: 16, padding: 4,
    borderWidth: 1, borderColor: 'rgba(26,59,47,0.06)',
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 13,
  },
  tabActive: { backgroundColor: 'rgba(255,209,102,0.25)' },
  tabText: { fontSize: 13, fontWeight: '700', color: 'rgba(26,59,47,0.4)' },
  tabTextActive: { color: '#1A3B2F' },

  // Feed
  feed: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(26,59,47,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  petBadge: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  petEmoji: { fontSize: 28 },
  petName: { fontSize: 16, fontWeight: '800', color: '#1A3B2F' },
  authorName: { fontSize: 11, color: 'rgba(26,59,47,0.45)', fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(26,59,47,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1A3B2F', marginBottom: 6 },
  cardContent: { fontSize: 14, color: 'rgba(26,59,47,0.7)', lineHeight: 22, marginBottom: 14 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: 'rgba(26,59,47,0.5)', fontWeight: '600' },

  // Empty state
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,209,102,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A3B2F', marginBottom: 8 },
  emptySub: { fontSize: 14, color: 'rgba(26,59,47,0.5)', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  emptyBtn: {
    backgroundColor: '#FFD166', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
  },
  emptyBtnText: { color: '#1A3B2F', fontWeight: '900', fontSize: 15 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#F0FAF5' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 12 : 24, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(26,59,47,0.06)',
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1A3B2F' },
  formScroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 60 },

  // Form
  label: { fontSize: 13, fontWeight: '800', color: '#1A3B2F', marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: '#ffffff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#1A3B2F', borderWidth: 1, borderColor: 'rgba(26,59,47,0.1)',
    marginBottom: 16,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,59,47,0.1)',
    marginBottom: 12,
  },
  imagePickerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  imagePreviewWrap: {
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 190,
    borderRadius: 16,
    backgroundColor: 'rgba(26,59,47,0.06)',
  },
  dateInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ffffff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(26,59,47,0.1)', marginBottom: 16,
  },
  dateValue: {
    flex: 1,
    fontSize: 15,
    color: '#1A3B2F',
  },
  datePlaceholder: { color: 'rgba(26,59,47,0.3)' },
  pickerWrap: { marginBottom: 16 },
  pickerDoneBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,209,102,0.25)',
  },
  pickerDoneText: { color: '#1A3B2F', fontWeight: '800' },
  textArea: { height: 120, textAlignVertical: 'top', paddingTop: 14 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(26,59,47,0.1)',
  },
  chipActive: { backgroundColor: 'rgba(255,209,102,0.2)', borderColor: '#FFD166' },
  chipEmoji: { fontSize: 16 },
  chipText: { fontSize: 12, fontWeight: '700', color: 'rgba(26,59,47,0.5)', textTransform: 'capitalize' },
  chipTextActive: { color: '#1A3B2F' },

  // Toggle
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20,
    backgroundColor: '#ffffff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(26,59,47,0.1)',
  },
  toggleLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A3B2F' },
  toggleTrack: {
    width: 44, height: 26, borderRadius: 13, backgroundColor: 'rgba(26,59,47,0.12)',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleTrackActive: { backgroundColor: '#FFD166' },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
  },
  toggleThumbActive: { alignSelf: 'flex-end' },

  // Submit
  submitBtn: {
    backgroundColor: '#FFD166', borderRadius: 18, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  submitBtnText: { color: '#1A3B2F', fontWeight: '900', fontSize: 16 },
});

const webDateInputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: '#1A3B2F',
  fontSize: 15,
  fontFamily: 'inherit',
  padding: 0,
  minWidth: 0,
};
