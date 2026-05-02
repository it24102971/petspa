import express from "express";
import {
  bookService,
  createService,
  deleteService,
  getBookings,
  getServices,
  updateService,
  verifyBooking,
} from "../controller/spaServiceController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getServices);
router.post("/", protect, adminOnly, createService);
router.post("/book", protect, upload.single("paymentSlip"), bookService);
router.get("/bookings", protect, getBookings);
router.put("/bookings/:id/verify", protect, adminOnly, verifyBooking);
router.put("/:id", protect, adminOnly, updateService);
router.delete("/:id", protect, adminOnly, deleteService);

export default router;
