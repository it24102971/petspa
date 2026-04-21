import express from "express";
import {
	createPet,
	getPets,
	updatePet,
	deletePet,
} from "../controller/petController.js";

const router = express.Router();

// Create a new pet
router.post("/", createPet);

// Get all pets
router.get("/", getPets);

// Update a pet
router.put("/:id", updatePet);

// Delete a pet
router.delete("/:id", deletePet);

export default router;
