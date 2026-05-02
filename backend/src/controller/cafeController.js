import MenuItem from "../models/MenuItem.js";
import CafeOrder from "../models/CafeOrder.js";

// ── Menu Items ──────────────────────────────────────────────────────────────

export const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find({ isAvailable: true }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch menu items.", error: error.message });
  }
};

export const getAllMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find({}).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch menu items.", error: error.message });
  }
};

export const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, emoji } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: "Name and price are required." });
    }
    const item = new MenuItem({ name, description, price, category, emoji });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to create menu item.", error: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Menu item not found." });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update menu item.", error: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MenuItem.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Menu item not found." });
    res.status(200).json({ message: "Menu item deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete menu item.", error: error.message });
  }
};

// ── Orders ──────────────────────────────────────────────────────────────────

export const placeOrder = async (req, res) => {
  try {
    // If multipart/form-data is used, items might be stringified
    let items = req.body.items;
    if (typeof items === 'string') {
      items = JSON.parse(items);
    }
    const notes = req.body.notes;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must have at least one item." });
    }

    let paymentSlip = null;
    if (req.file) {
      paymentSlip = `/uploads/slips/${req.file.filename}`;
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = new CafeOrder({
      customer: req.user?._id || null,
      customerName: req.user?.fullName || "Walk-in Customer",
      items,
      total,
      notes,
      paymentSlip,
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to place order.", error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await CafeOrder.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders.", error: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await CafeOrder.find({}).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders.", error: error.message });
  }
};

export const verifyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await CafeOrder.findByIdAndUpdate(id, { status: "verified" }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to verify order.", error: error.message });
  }
};

export const rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await CafeOrder.findByIdAndUpdate(id, { status: "rejected" }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to reject order.", error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CafeOrder.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Order not found." });
    res.status(200).json({ message: "Order deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order.", error: error.message });
  }
};
