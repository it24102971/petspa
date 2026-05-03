import express from "express";
import { registerUser as register, loginUser as login, updateUserProfile, uploadProfilePicture } from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/profile", protect, updateUserProfile);
router.post("/profile-picture", protect, upload.single("profilePicture"), uploadProfilePicture);

export default router;
