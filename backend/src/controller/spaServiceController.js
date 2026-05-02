import SpaBooking from "../models/SpaBooking.js";
import SpaService from "../models/SpaService.js";

const defaultSpaServices = [
  {
    name: "Calming Bubble Bath",
    description: "Gentle shampoo bath, warm rinse, towel dry, and coat refresh.",
    price: 2500,
    duration: 45,
    imageUrl: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Pawdicure Deluxe",
    description: "Nail trim, paw balm massage, pad cleanup, and fragrance finish.",
    price: 1800,
    duration: 30,
    imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Aromatherapy Spa",
    description: "Relaxing pet-safe aromatherapy bath with a light massage.",
    price: 4200,
    duration: 75,
    imageUrl: "https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=900&q=80",
  },
];

const ensureDefaultServices = async () => {
  const count = await SpaService.countDocuments();
  if (count === 0) {
    await SpaService.insertMany(defaultSpaServices);
  }
};

export const getServices = async (_req, res) => {
  try {
    await ensureDefaultServices();
    const services = await SpaService.find({ isAvailable: true }).sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Error fetching spa services", error: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, description, price, duration, imageUrl } = req.body;

    if (!name || !description || price === undefined || duration === undefined) {
      return res.status(400).json({ message: "Name, description, price, and duration are required" });
    }

    const service = await SpaService.create({
      name,
      description,
      price: Number(price),
      duration: Number(duration),
      imageUrl,
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: "Error creating spa service", error: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { name, description, price, duration, imageUrl, isAvailable } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (duration !== undefined) updateData.duration = Number(duration);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    const service = await SpaService.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      return res.status(404).json({ message: "Spa service not found" });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: "Error updating spa service", error: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const service = await SpaService.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Spa service not found" });
    }

    res.status(200).json({ message: "Spa service removed" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting spa service", error: error.message });
  }
};

export const bookService = async (req, res) => {
  try {
    const { serviceId } = req.body;
    const service = await SpaService.findById(serviceId);
    const paymentSlip = req.file ? `/uploads/pets/${req.file.filename}` : null;

    if (!service) {
      return res.status(404).json({ message: "Spa service not found" });
    }

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
    res.status(500).json({ message: "Error creating spa booking", error: error.message });
  }
};

export const getBookings = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { userId: req.user._id };
    const bookings = await SpaBooking.find(query)
      .populate("userId", "fullName email")
      .populate("serviceId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching spa bookings", error: error.message });
  }
};

export const verifyBooking = async (req, res) => {
  try {
    const booking = await SpaBooking.findByIdAndUpdate(
      req.params.id,
      { status: "Confirmed" },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Spa booking not found" });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error verifying spa booking", error: error.message });
  }
};
