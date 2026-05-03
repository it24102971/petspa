import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getCafeItems,
  placeOrder,
  getOrders,
  verifyOrder,
  createCafeItem,
  updateCafeItem,
  deleteCafeItem,
} from "../controller/cafeController.js";

const router = express.Router();

router.get("/items", getCafeItems);
router.post("/items", protect, adminOnly, upload.single("image"), createCafeItem);
router.put("/items/:id", protect, adminOnly, upload.single("image"), updateCafeItem);
router.delete("/items/:id", protect, adminOnly, deleteCafeItem);

router.get("/orders", protect, getOrders);
router.post("/order", protect, upload.single("paymentSlip"), placeOrder);
router.put("/orders/:id/verify", protect, adminOnly, verifyOrder);

export default router;
