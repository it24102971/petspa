import CafeItem from "../models/CafeItem.js";
import CafeOrder from "../models/CafeOrder.js";

export const getCafeItems = async (_req, res) => {
  try {
    const items = await CafeItem.find({ isAvailable: true }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching cafe items", error: error.message });
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
