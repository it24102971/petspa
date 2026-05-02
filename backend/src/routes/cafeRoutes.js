import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getCafeItems,
  createCafeItem,
  updateCafeItem,
  deleteCafeItem,
  placeOrder,
  getOrders,
  verifyOrder,
} from "../controller/cafeController.js";

const router = express.Router();

// Menu Items
router.get("/items", getCafeItems);
router.post("/items", protect, adminOnly, createCafeItem);
router.put("/items/:id", protect, adminOnly, updateCafeItem);
router.delete("/items/:id", protect, adminOnly, deleteCafeItem);

// Orders
router.get("/orders", protect, getOrders);
router.post("/order", protect, upload.single("paymentSlip"), placeOrder);
router.put("/orders/:id/verify", protect, adminOnly, verifyOrder);

export default router;
