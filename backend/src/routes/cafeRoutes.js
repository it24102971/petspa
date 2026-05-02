import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

router.get("/orders", protect, getOrders);
router.post("/order", protect, upload.single("paymentSlip"), placeOrder);
router.put("/orders/:id/verify", protect, adminOnly, verifyOrder);

export default router;
