import SpaService from "../models/SpaService.js";
import SpaBooking from "../models/SpaBooking.js";
import User from "../models/User.js";
import { createNotification } from "./notificationController.js";
import Pet from "../models/Pet.js";

// Get all services
export const getServices = async (req, res) => {
  try {
    const services = await SpaService.find().sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Error fetching services", error: error.message });
  }
};

// Get available groomers
export const getAvailableGroomers = async (req, res) => {
  try {
    const groomers = await User.find({ role: "groomer", isActive: true }).select("-password");
    res.status(200).json(groomers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching groomers", error: error.message });
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
    const { serviceId, groomerId, appointmentDate, appointmentTime, price } = req.body;
    
    if (!serviceId && !groomerId) {
      return res.status(400).json({ message: "Must select a service or a groomer" });
    }
    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: "Appointment date and time are required" });
    }

    let serviceName = null;
    if (serviceId) {
      const service = await SpaService.findById(serviceId);
      if (!service) return res.status(404).json({ message: "Service not found" });
      serviceName = service.name;
    }

    let groomerName = null;
    if (groomerId) {
      const groomer = await User.findById(groomerId);
      if (!groomer) return res.status(404).json({ message: "Groomer not found" });
      groomerName = groomer.fullName;
    }

    const paymentSlip = req.file ? `/uploads/pets/${req.file.filename}` : null;
    if (!paymentSlip) {
      return res.status(400).json({ message: "Payment slip is required" });
    }

    let petName = null;
    if (req.body.petId) {
      const pet = await Pet.findById(req.body.petId);
      if (pet) petName = pet.name;
    }

    const booking = await SpaBooking.create({
      userId: req.user._id,
      petId: req.body.petId || null,
      petName,
      serviceId: serviceId || null,
      serviceName,
      groomerId: groomerId || null,
      groomerName,
      appointmentDate,
      appointmentTime,
      price: Number(price) || 0,
      paymentSlip,
    });

    // Notify Admin
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await createNotification(
        admin._id,
        "New Appointment",
        `${req.user.fullName} booked ${serviceName || 'a service'} for ${petName || 'their pet'} on ${appointmentDate}.`,
        "booking",
        "/admin/appointments"
      );
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ message: "Error booking service", error: error.message });
  }
};

// Get all bookings (admin gets all, user gets own)
export const getAllBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "admin") {
      query = {};
    } else if (req.user.role === "groomer") {
      query = { 
        $or: [
          { groomerId: req.user._id },
          { status: "Confirmed", groomerId: null },
          { status: "Confirmed", groomerId: { $exists: false } }
        ]
      };
    } else {
      query = { userId: req.user._id };
    }

    const bookings = await SpaBooking.find(query)
      .populate("userId", "fullName email")
      .populate("petId", "name type breed imageUrl")
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
// Complete a booking
export const completeBooking = async (req, res) => {
  try {
    const booking = await SpaBooking.findByIdAndUpdate(
      req.params.id,
      { status: "Completed" },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error completing booking", error: error.message });
  }
};

// Accept a booking (by groomer)
export const acceptBooking = async (req, res) => {
  try {
    const booking = await SpaBooking.findByIdAndUpdate(
      req.params.id,
      { status: "Accepted", groomerId: req.user._id, groomerName: req.user.fullName },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error accepting booking", error: error.message });
  }
};
