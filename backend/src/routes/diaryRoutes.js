import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  createDiaryEntry,
  getPublicFeed,
  getMyEntries,
  updateDiaryEntry,
  deleteDiaryEntry,
} from "../controller/diaryController.js";

const router = express.Router();

router.post("/", protect, upload.single("photo"), createDiaryEntry);
router.get("/feed", getPublicFeed);
router.get("/mine", protect, getMyEntries);
router.put("/:id", protect, upload.single("photo"), updateDiaryEntry);
router.delete("/:id", protect, deleteDiaryEntry);

export default router;
