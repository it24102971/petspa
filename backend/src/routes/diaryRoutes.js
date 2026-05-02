import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { getDiaryEntries, createDiaryEntry } from "../controller/diaryController.js";

const router = express.Router();

router.get("/", protect, getDiaryEntries);
router.post("/", protect, upload.single("image"), createDiaryEntry);

export default router;
