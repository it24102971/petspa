import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { API_BASE_URL } from "@/constants/api";
import { useSidebar } from "@/context/SidebarContext";

const AUTH_USER_KEY = "auth:user";
const AUTH_TOKEN_KEY = "auth:token";

type SpaService = {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl?: string;
};

type SpaBooking = {
  _id: string;
  serviceName: string;
  price: number;
  paymentSlip: string;
  status: "Pending" | "Confirmed" | "Rejected";
  createdAt?: string;
  userId?: {
    fullName?: string;
    email?: string;
  };
};

type User = {
  role?: string;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=900&q=80";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  duration: "",
  imageUrl: "",
};

export default function SpaScreen() {
  const { openSidebar } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [services, setServices] = useState<SpaService[]>([]);
  const [bookings, setBookings] = useState<SpaBooking[]>([]);
  const [activeView, setActiveView] = useState<"services" | "bookings">("services");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [slipModalVisible, setSlipModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<SpaService | null>(null);
  const [selectedSlip, setSelectedSlip] = useState("");
  const [paymentSlipUri, setPaymentSlipUri] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const isAdmin = user?.role === "admin";

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const loadAuth = useCallback(async () => {
    const [storedUser, storedToken] = await Promise.all([
      AsyncStorage.getItem(AUTH_USER_KEY),
      AsyncStorage.getItem(AUTH_TOKEN_KEY),
    ]);

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setToken(storedToken);
  }, []);

  const fetchServices = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/spa-services`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to load spa services");
    }

    setServices(data);
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!authHeaders) {
      setBookings([]);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/spa-services/bookings`, {
      headers: authHeaders,
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to load spa bookings");
    }

    setBookings(data);
  }, [authHeaders]);

  const loadData = useCallback(async () => {
    try {
      await fetchServices();
      await fetchBookings();
    } catch (error) {
      Alert.alert("Spa Services", error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchBookings, fetchServices]);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setForm(emptyForm);
  };

  const openCreateService = () => {
    resetServiceForm();
    setServiceModalVisible(true);
  };

  const openEditService = (service: SpaService) => {
    setEditingServiceId(service._id);
    setForm({
      name: service.name,
      description: service.description,
      price: String(service.price),
      duration: String(service.duration),
      imageUrl: service.imageUrl || "",
    });
    setServiceModalVisible(true);
  };

  const saveService = async () => {
    if (!token) {
      Alert.alert("Login required", "Please login as an admin to manage services.");
      return;
    }

    if (!form.name.trim() || !form.description.trim() || !form.price.trim() || !form.duration.trim()) {
      Alert.alert("Missing details", "Please fill name, description, price, and duration.");
      return;
    }

    const endpoint = editingServiceId
      ? `${API_BASE_URL}/spa-services/${editingServiceId}`
      : `${API_BASE_URL}/spa-services`;

    const response = await fetch(endpoint, {
      method: editingServiceId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        duration: Number(form.duration),
        imageUrl: form.imageUrl || fallbackImage,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      Alert.alert("Spa Services", data?.message || "Failed to save service");
      return;
    }

    setServiceModalVisible(false);
    resetServiceForm();
    fetchServices();
  };

  const deleteService = (serviceId: string) => {
    if (!token) return;

    Alert.alert("Delete service", "Are you sure you want to remove this spa service?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const response = await fetch(`${API_BASE_URL}/spa-services/${serviceId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            fetchServices();
          } else {
            const data = await response.json();
            Alert.alert("Spa Services", data?.message || "Failed to delete service");
          }
        },
      },
    ]);
  };

  const pickPaymentSlip = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPaymentSlipUri(result.assets[0].uri);
    }
  };

  const bookService = async () => {
    if (!token) {
      Alert.alert("Login required", "Please login before booking a spa service.");
      return;
    }

    if (!selectedService || !paymentSlipUri) {
      Alert.alert("Payment slip required", "Please upload your payment slip to confirm the booking.");
      return;
    }

    const filename = paymentSlipUri.split("/").pop() || "payment-slip.jpg";
    const ext = filename.split(".").pop() || "jpg";
    const formData = new FormData();
    formData.append("serviceId", selectedService._id);
    formData.append("paymentSlip", {
      uri: paymentSlipUri,
      name: filename,
      type: `image/${ext}`,
    } as any);

    const response = await fetch(`${API_BASE_URL}/spa-services/book`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();

    if (!response.ok) {
      Alert.alert("Spa Services", data?.message || "Failed to book service");
      return;
    }

    Alert.alert("Booking sent", "Your spa booking is pending admin verification.");
    setBookingModalVisible(false);
    setPaymentSlipUri(null);
    fetchBookings();
  };

  const verifyBooking = async (bookingId: string) => {
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/spa-services/bookings/${bookingId}/verify`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      fetchBookings();
    } else {
      const data = await response.json();
      Alert.alert("Spa Services", data?.message || "Failed to verify booking");
    }
  };

  const openSlip = (paymentSlip: string) => {
    const slipUrl = paymentSlip.startsWith("http")
      ? paymentSlip
      : `${API_BASE_URL.replace("/api", "")}${paymentSlip}`;
    setSelectedSlip(slipUrl);
    setSlipModalVisible(true);
  };

  const renderService = ({ item }: { item: SpaService }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl || fallbackImage }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.price}>Rs. {item.price}</Text>
        </View>
        <Text style={styles.description}>{item.description}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="time-outline" size={15} color="#1A3B2F" />
            <Text style={styles.metaText}>{item.duration} mins</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="sparkles-outline" size={15} color="#1A3B2F" />
            <Text style={styles.metaText}>Spa</Text>
          </View>
        </View>

        {isAdmin ? (
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={() => openEditService(item)}>
              <Ionicons name="create-outline" size={18} color="#1A3B2F" />
              <Text style={styles.secondaryButtonText}>Edit</Text>
            </Pressable>
            <Pressable style={styles.dangerButton} onPress={() => deleteService(item._id)}>
              <Ionicons name="trash-outline" size={18} color="#ffffff" />
              <Text style={styles.dangerButtonText}>Delete</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              setSelectedService(item);
              setPaymentSlipUri(null);
              setBookingModalVisible(true);
            }}
          >
            <Text style={styles.primaryButtonText}>Book Spa Service</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const renderBooking = ({ item }: { item: SpaBooking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingIcon}>
        <Ionicons name="receipt-outline" size={24} color="#1A3B2F" />
      </View>
      <View style={styles.bookingInfo}>
        <Text style={styles.bookingTitle}>{item.serviceName}</Text>
        {isAdmin && (
          <Text style={styles.bookingSub}>
            {item.userId?.fullName || "Customer"} - {item.userId?.email || "No email"}
          </Text>
        )}
        <View style={styles.bookingFooter}>
          <Text style={styles.bookingPrice}>Rs. {item.price}</Text>
          <Text style={[styles.statusBadge, item.status === "Confirmed" && styles.statusConfirmed]}>
            {item.status}
          </Text>
        </View>
        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryButton} onPress={() => openSlip(item.paymentSlip)}>
            <Ionicons name="image-outline" size={18} color="#1A3B2F" />
            <Text style={styles.secondaryButtonText}>View Slip</Text>
          </Pressable>
          {isAdmin && item.status === "Pending" && (
            <Pressable style={styles.primaryButtonCompact} onPress={() => verifyBooking(item._id)}>
              <Text style={styles.primaryButtonText}>Verify</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFD166" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={openSidebar} style={styles.headerButton} hitSlop={15}>
          <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Spa Services</Text>
          <Text style={styles.subtitle}>Relaxing care for happy pets</Text>
        </View>
        {isAdmin ? (
          <Pressable style={styles.headerButton} onPress={openCreateService}>
            <Ionicons name="add" size={28} color="#1A3B2F" />
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      <View style={styles.segmented}>
        <Pressable
          style={[styles.segment, activeView === "services" && styles.segmentActive]}
          onPress={() => setActiveView("services")}
        >
          <Text style={[styles.segmentText, activeView === "services" && styles.segmentTextActive]}>
            Services
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, activeView === "bookings" && styles.segmentActive]}
          onPress={() => setActiveView("bookings")}
        >
          <Text style={[styles.segmentText, activeView === "bookings" && styles.segmentTextActive]}>
            Bookings
          </Text>
        </Pressable>
      </View>

      {activeView === "services" ? (
        <FlatList
          data={services}
          keyExtractor={(item) => item._id}
          renderItem={renderService}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState label="No spa services available yet." />}
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBooking}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState label="No spa bookings yet." />}
        />
      )}

      <Modal visible={serviceModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingServiceId ? "Edit Spa Service" : "Add Spa Service"}</Text>
              <ServiceInput label="Name" value={form.name} onChangeText={(name) => setForm((prev) => ({ ...prev, name }))} />
              <ServiceInput
                label="Description"
                value={form.description}
                onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
              />
              <ServiceInput
                label="Price"
                value={form.price}
                keyboardType="numeric"
                onChangeText={(price) => setForm((prev) => ({ ...prev, price }))}
              />
              <ServiceInput
                label="Duration in minutes"
                value={form.duration}
                keyboardType="numeric"
                onChangeText={(duration) => setForm((prev) => ({ ...prev, duration }))}
              />
              <ServiceInput
                label="Image URL"
                value={form.imageUrl}
                onChangeText={(imageUrl) => setForm((prev) => ({ ...prev, imageUrl }))}
              />
              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setServiceModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.primaryButtonCompact} onPress={saveService}>
                  <Text style={styles.primaryButtonText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={bookingModalVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Booking</Text>
            <Text style={styles.bookingServiceName}>{selectedService?.name}</Text>
            <Text style={styles.bookingPriceLarge}>Rs. {selectedService?.price}</Text>
            <Pressable style={styles.uploadBox} onPress={pickPaymentSlip}>
              <Ionicons name="cloud-upload-outline" size={26} color="#1A3B2F" />
              <Text style={styles.uploadText}>
                {paymentSlipUri ? "Payment slip selected" : "Upload payment slip"}
              </Text>
            </Pressable>
            {paymentSlipUri && <Image source={{ uri: paymentSlipUri }} style={styles.previewImage} />}
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setBookingModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonCompact} onPress={bookService}>
                <Text style={styles.primaryButtonText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={slipModalVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment Slip</Text>
            {selectedSlip ? <Image source={{ uri: selectedSlip }} style={styles.slipImage} /> : null}
            <Pressable style={styles.primaryButton} onPress={() => setSlipModalVisible(false)}>
              <Text style={styles.primaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="sparkles-outline" size={36} color="#FFD166" />
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

function ServiceInput({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholder={label}
      placeholderTextColor="rgba(26, 59, 47, 0.45)"
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FAF5",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headerCopy: {
    alignItems: "center",
    flex: 1,
  },
  title: {
    color: "#1A3B2F",
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    color: "rgba(26, 59, 47, 0.55)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  segmented: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(26, 59, 47, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 5,
  },
  segment: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    paddingVertical: 10,
  },
  segmentActive: {
    backgroundColor: "#FFD166",
  },
  segmentText: {
    color: "rgba(26, 59, 47, 0.5)",
    fontSize: 14,
    fontWeight: "900",
  },
  segmentTextActive: {
    color: "#1A3B2F",
  },
  listContent: {
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(26, 59, 47, 0.08)",
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    backgroundColor: "#EAF5EF",
    height: 150,
    width: "100%",
  },
  cardBody: {
    gap: 10,
    padding: 16,
  },
  cardTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  cardTitle: {
    color: "#1A3B2F",
    flex: 1,
    fontSize: 19,
    fontWeight: "900",
  },
  price: {
    color: "#1A3B2F",
    fontSize: 16,
    fontWeight: "900",
  },
  description: {
    color: "rgba(26, 59, 47, 0.62)",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    alignItems: "center",
    backgroundColor: "#F0FAF5",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaText: {
    color: "#1A3B2F",
    fontSize: 12,
    fontWeight: "800",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#FFD166",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 16,
  },
  primaryButtonCompact: {
    alignItems: "center",
    backgroundColor: "#FFD166",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#1A3B2F",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#F0FAF5",
    borderRadius: 14,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: "#1A3B2F",
    fontSize: 14,
    fontWeight: "900",
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#EF5350",
    borderRadius: 14,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  dangerButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  bookingCard: {
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderColor: "rgba(26, 59, 47, 0.08)",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  bookingIcon: {
    alignItems: "center",
    backgroundColor: "#F0FAF5",
    borderRadius: 16,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  bookingInfo: {
    flex: 1,
    gap: 8,
  },
  bookingTitle: {
    color: "#1A3B2F",
    fontSize: 17,
    fontWeight: "900",
  },
  bookingSub: {
    color: "rgba(26, 59, 47, 0.55)",
    fontSize: 13,
    fontWeight: "700",
  },
  bookingFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bookingPrice: {
    color: "#1A3B2F",
    fontSize: 15,
    fontWeight: "900",
  },
  statusBadge: {
    backgroundColor: "#FFF3D8",
    borderRadius: 999,
    color: "#A86D00",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusConfirmed: {
    backgroundColor: "#DFF5E7",
    color: "#198754",
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(26, 59, 47, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginTop: 24,
    padding: 28,
  },
  emptyText: {
    color: "rgba(26, 59, 47, 0.55)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  modalBackdrop: {
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    gap: 12,
    padding: 20,
  },
  modalTitle: {
    color: "#1A3B2F",
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F0FAF5",
    borderColor: "rgba(26, 59, 47, 0.08)",
    borderRadius: 14,
    borderWidth: 1,
    color: "#1A3B2F",
    fontSize: 15,
    fontWeight: "700",
    minHeight: 52,
    paddingHorizontal: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: "#EAF5EF",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
  },
  cancelButtonText: {
    color: "#1A3B2F",
    fontSize: 15,
    fontWeight: "900",
  },
  bookingServiceName: {
    color: "#1A3B2F",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  bookingPriceLarge: {
    color: "#1A3B2F",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  uploadBox: {
    alignItems: "center",
    backgroundColor: "#F0FAF5",
    borderColor: "rgba(26, 59, 47, 0.1)",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  uploadText: {
    color: "#1A3B2F",
    fontSize: 14,
    fontWeight: "900",
  },
  previewImage: {
    alignSelf: "center",
    borderRadius: 14,
    height: 110,
    width: 110,
  },
  slipImage: {
    alignSelf: "center",
    borderRadius: 16,
    height: 320,
    resizeMode: "contain",
    width: "100%",
  },
});
