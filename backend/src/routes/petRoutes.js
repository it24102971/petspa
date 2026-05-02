import express from "express";
import {
	createPet,
	getPets,
	updatePet,
	deletePet,
} from "../controller/petController.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Create a new pet
router.post("/", protect, upload.single("image"), createPet);

// Get all pets
router.get("/", protect, getPets);

// Update a pet
router.put("/:id", protect, upload.single("image"), updatePet);

// Delete a pet
router.delete("/:id", protect, deletePet);

export default router;
