import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getServices,
  getAvailableGroomers,
  createService,
  updateService,
  deleteService,
  bookSpaService,
  getAllBookings,
  verifyBooking,
  acceptBooking,
  completeBooking,
  getGroomerStats,
} from "../controller/spaServiceController.js";

const router = express.Router();

router.get("/", getServices);
router.get("/groomers", getAvailableGroomers);
router.get("/groomer-stats", protect, getGroomerStats);
router.post("/", protect, adminOnly, createService);
router.put("/:id", protect, adminOnly, updateService);
router.delete("/:id", protect, adminOnly, deleteService);

router.post("/book", protect, upload.single("paymentSlip"), bookSpaService);
router.get("/bookings", protect, getAllBookings);
router.put("/bookings/:id/verify", protect, adminOnly, verifyBooking);
router.put("/bookings/:id/accept", protect, acceptBooking);
router.put("/bookings/:id/complete", protect, completeBooking);

export default router;
