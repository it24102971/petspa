import CafeItem from "../models/CafeItem.js";
import CafeOrder from "../models/CafeOrder.js";


export const getCafeItems = async (req, res) => {
  try {
    const filter = req.query.all ? {} : { isAvailable: true };
    const items = await CafeItem.find(filter).sort({ createdAt: -1 });
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

export const createCafeItem = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable } = req.body;
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/pets/${req.file.filename}`;
    }

    const newItem = await CafeItem.create({
      name,
      description,
      price: Number(price),
      category: category || "Snack",
      imageUrl: imageUrl || req.body.imageUrl,
      isAvailable: isAvailable !== "false"
    });

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: "Error creating cafe item", error: error.message });
  }
};

export const updateCafeItem = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable, imageUrl } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = Number(price);
    if (category) updateData.category = category;
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable !== "false";

    if (req.file) {
      updateData.imageUrl = `/uploads/pets/${req.file.filename}`;
    }

    const updatedItem = await CafeItem.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedItem) return res.status(404).json({ message: "Item not found" });

    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: "Error updating cafe item", error: error.message });
  }
};

export const deleteCafeItem = async (req, res) => {
  try {
    const deletedItem = await CafeItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: "Item not found" });

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting cafe item", error: error.message });
  }
};
