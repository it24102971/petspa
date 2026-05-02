import CafeItem from "../models/CafeItem.js";
import CafeOrder from "../models/CafeOrder.js";

const defaultCafeItems = [
  {
    name: "Puppyccino",
    description: "Safe whipped cream treat for your furry friend.",
    price: 450,
    category: "Drink",
    imageUrl: "https://images.unsplash.com/photo-1544411047-c4915842127b?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Paw-berry Smoothie",
    description: "Berry mix smoothie safe for pets and owners.",
    price: 850,
    category: "Drink",
    imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Golden Bone Cookie",
    description: "Organic peanut butter and honey baked bone.",
    price: 300,
    category: "Snack",
    imageUrl: "https://images.unsplash.com/photo-1582791078544-183f9fde673c?auto=format&fit=crop&w=900&q=80",
  },
];

const ensureDefaultItems = async () => {
  const count = await CafeItem.countDocuments();
  if (count === 0) {
    await CafeItem.insertMany(defaultCafeItems);
  }
};

export const getCafeItems = async (_req, res) => {
  try {
    await ensureDefaultItems();
    const items = await CafeItem.find({ isAvailable: true }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching cafe items", error: error.message });
  }
};

export const createCafeItem = async (req, res) => {
  try {
    const item = await CafeItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Error creating cafe item", error: error.message });
  }
};

export const updateCafeItem = async (req, res) => {
  try {
    const item = await CafeItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: "Error updating cafe item", error: error.message });
  }
};

export const deleteCafeItem = async (req, res) => {
  try {
    const item = await CafeItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.status(200).json({ message: "Item removed" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting cafe item", error: error.message });
  }
};

export const placeOrder = async (req, res) => {
  try {
    const { items, totalPrice } = req.body;
    const paymentSlip = req.file ? `/uploads/pets/${req.file.filename}` : null;

    if (!paymentSlip) {
      return res.status(400).json({ message: "Payment slip is required" });
    }

    const order = await CafeOrder.create({
      userId: req.user._id,
      items: JSON.parse(items),
      totalPrice: Number(totalPrice),
      paymentSlip,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Error placing order", error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { userId: req.user._id };
    const orders = await CafeOrder.find(query)
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
};

export const verifyOrder = async (req, res) => {
  try {
    const order = await CafeOrder.findByIdAndUpdate(
      req.params.id,
      { status: "Confirmed" },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Error verifying order", error: error.message });
  }
};
