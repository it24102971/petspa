import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getServices,
  createService,
  updateService,
  deleteService,
  bookSpaService,
  getAllBookings,
  verifyBooking,
} from "../controller/spaServiceController.js";

const router = express.Router();

router.get("/", getServices);
router.post("/", protect, adminOnly, createService);
router.put("/:id", protect, adminOnly, updateService);
router.delete("/:id", protect, adminOnly, deleteService);

router.post("/book", protect, upload.single("paymentSlip"), bookSpaService);
router.get("/bookings", protect, getAllBookings);
router.put("/bookings/:id/verify", protect, adminOnly, verifyBooking);

export default router;
