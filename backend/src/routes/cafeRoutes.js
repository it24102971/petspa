import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getMenuItems,
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  placeOrder,
  getMyOrders,
  getAllOrders,
  verifyOrder,
  rejectOrder,
  deleteOrder,
} from "../controller/cafeController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ── Customer routes (authenticated) ────────────────────────────────────────
router.get("/menu", protect, getMenuItems);
router.post("/orders", protect, upload.single("paymentSlip"), placeOrder);
router.get("/orders/my", protect, getMyOrders);

// ── Admin routes ────────────────────────────────────────────────────────────
router.get("/admin/menu", protect, adminOnly, getAllMenuItems);
router.post("/admin/menu", protect, adminOnly, createMenuItem);
router.put("/admin/menu/:id", protect, adminOnly, updateMenuItem);
router.delete("/admin/menu/:id", protect, adminOnly, deleteMenuItem);

router.get("/admin/orders", protect, adminOnly, getAllOrders);
router.put("/admin/orders/:id/verify", protect, adminOnly, verifyOrder);
router.put("/admin/orders/:id/reject", protect, adminOnly, rejectOrder);
router.delete("/admin/orders/:id", protect, adminOnly, deleteOrder);

export default router;
