import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markAsRead,
  deleteNotification
} from "../controller/notificationController.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read-all", protect, markAsRead);
router.delete("/:id", protect, deleteNotification);

export default router;
