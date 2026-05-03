import SpaService from "../models/SpaService.js";
import SpaBooking from "../models/SpaBooking.js";

// Get all services
export const getServices = async (req, res) => {
  try {
    const services = await SpaService.find().sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Error fetching services", error: error.message });
  }
};

// Create a service
export const createService = async (req, res) => {
  try {
    const service = await SpaService.create(req.body);
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: "Error creating service", error: error.message });
  }
};

// Update a service
export const updateService = async (req, res) => {
  try {
    const service = await SpaService.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: "Error updating service", error: error.message });
  }
};

// Delete a service
export const deleteService = async (req, res) => {
  try {
    const service = await SpaService.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting service", error: error.message });
  }
};

// Book a service
export const bookSpaService = async (req, res) => {
  try {
    const { serviceId } = req.body;
    const service = await SpaService.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const paymentSlip = req.file ? `/uploads/pets/${req.file.filename}` : null;
    if (!paymentSlip) {
      return res.status(400).json({ message: "Payment slip is required" });
    }

    const booking = await SpaBooking.create({
      userId: req.user._id,
      serviceId: service._id,
      serviceName: service.name,
      price: service.price,
      paymentSlip,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error booking service", error: error.message });
  }
};

// Get all bookings (admin gets all, user gets own)
export const getAllBookings = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { userId: req.user._id };
    const bookings = await SpaBooking.find(query)
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
};

// Verify a booking
export const verifyBooking = async (req, res) => {
  try {
    const booking = await SpaBooking.findByIdAndUpdate(
      req.params.id,
      { status: "Confirmed" },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error verifying booking", error: error.message });
  }
};
