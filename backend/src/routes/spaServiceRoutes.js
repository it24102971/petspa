import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getServices,
  createService,
  bookSpaService,
  getAllBookings,
  verifyBooking,
  acceptBooking,
  getGroomerStats
} from "../controller/spaServiceController.js";

const router = express.Router();

router.get("/services", getServices);
router.post("/services", protect, adminOnly, createService);
router.post("/book", protect, upload.single("paymentSlip"), bookSpaService);
router.get("/bookings", protect, getAllBookings);
router.put("/bookings/:id/verify", protect, adminOnly, verifyBooking);
router.put("/bookings/:id/accept", protect, acceptBooking); // Open to groomers
router.get("/groomer-stats", protect, getGroomerStats);

export default router;
