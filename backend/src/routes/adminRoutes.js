import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getAllUsers,
  toggleUserStatus,
  getGroomers,
  addGroomer,
  getAllPets,
  updatePetAdmin,
  deletePetAdmin,
} from "../controller/adminController.js";

const router = express.Router();

// User Management
router.get("/users", protect, adminOnly, getAllUsers);
router.put("/users/:id/toggle", protect, adminOnly, toggleUserStatus);
router.get("/groomers", protect, adminOnly, getGroomers);
router.post("/groomer", protect, adminOnly, addGroomer);

// Pet Management
router.get("/pets", protect, adminOnly, getAllPets);
router.put("/pets/:id", protect, adminOnly, upload.single("image"), updatePetAdmin);
router.delete("/pets/:id", protect, adminOnly, deletePetAdmin);

export default router;
