import express from "express";
import { loginUser, registerUser, updateUserProfile } from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/profile", protect, upload.single("profilePicture"), updateUserProfile);

export default router;
