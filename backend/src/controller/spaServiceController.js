import SpaService from "../models/SpaService.js";
import SpaBooking from "../models/SpaBooking.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const getServices = async (req, res) => {
  try {
    const services = await SpaService.find({ isActive: true });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Error fetching services", error: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const service = await SpaService.create(req.body);
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: "Error creating service", error: error.message });
  }
};

export const bookSpaService = async (req, res) => {
  try {
    const { petId, serviceId, serviceName, price } = req.body;
    const paymentSlip = req.file ? `/uploads/pets/${req.file.filename}` : null;

    if (!paymentSlip) {
      return res.status(400).json({ message: "Payment slip is required" });
    }

    const booking = await SpaBooking.create({
      userId: req.user._id,
      petId,
      serviceId,
      serviceName,
      price: Number(price),
      paymentSlip,
      status: "Pending",
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error booking service", error: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : 
                 req.user.role === "groomer" ? { status: { $in: ["Confirmed", "Accepted"] } } :
                 { userId: req.user._id };
                 
    const bookings = await SpaBooking.find(query)
      .populate("userId", "fullName email")
      .populate("petId", "name breed")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
};

export const verifyBooking = async (req, res) => {
  try {
    const booking = await SpaBooking.findByIdAndUpdate(
      req.params.id,
      { status: "Confirmed" },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Notify all groomers
    const groomers = await User.find({ role: "groomer" });
    const notificationPromises = groomers.map(groomer => 
      Notification.create({
        recipient: groomer._id,
        title: "New Grooming Job Available! 🐾",
        message: `A new verified booking for ${booking.serviceName} is available to be picked up.`,
        type: "booking",
        link: "/groomer/appointments?type=jobs"
      })
    );
    await Promise.all(notificationPromises);

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error verifying booking", error: error.message });
  }
};

export const acceptBooking = async (req, res) => {
  try {
    const booking = await SpaBooking.findByIdAndUpdate(
      req.params.id,
      { status: "Accepted", assignedGroomer: req.user._id },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error accepting booking", error: error.message });
  }
};

export const getGroomerStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = await SpaBooking.countDocuments({
      status: "Accepted",
      assignedGroomer: req.user._id,
      updatedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const pendingVerified = await SpaBooking.countDocuments({
      status: "Confirmed"
    });

    res.status(200).json({ todayCount, pendingVerified });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats", error: error.message });
  }
};
