import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  createDiaryEntry,
  getDiaryFeed,
  getMyDiaryEntries,
  getDiaryEntryById,
  updateDiaryEntry,
  deleteDiaryEntry,
} from "../controller/diaryController.js";

const router = express.Router();

// Public feed (still requires auth to view)
router.get("/feed", protect, getDiaryFeed);

// Current user's entries
router.get("/mine", protect, getMyDiaryEntries);

// Single entry
router.get("/:id", protect, getDiaryEntryById);

// Create
router.post("/", protect, upload.single("photo"), createDiaryEntry);

// Update
router.put("/:id", protect, upload.single("photo"), updateDiaryEntry);

// Delete
router.delete("/:id", protect, deleteDiaryEntry);

export default router;
