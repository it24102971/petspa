import Pet from "../models/Pet.js";

// Create a new pet
export const createPet = async (req, res) => {
	try {
		const newPet = new Pet(req.body);
		const savedPet = await newPet.save();
		res.status(201).json(savedPet);
	} catch (error) {
		res.status(400).json({ message: "Error creating pet", error: error.message });
	}
};

// Get all pets
export const getPets = async (req, res) => {
	try {
		const pets = await Pet.find();
		res.status(200).json(pets);
	} catch (error) {
		res.status(500).json({ message: "Error fetching pets", error: error.message });
	}
};

// Update a pet
export const updatePet = async (req, res) => {
	try {
		const updatedPet = await Pet.findByIdAndUpdate(
			req.params.id,
			{ $set: req.body },
			{ new: true, runValidators: true }
		);
		if (!updatedPet) {
			return res.status(404).json({ message: "Pet not found" });
		}
		res.status(200).json(updatedPet);
	} catch (error) {
		res.status(400).json({ message: "Error updating pet", error: error.message });
	}
};

// Delete a pet
export const deletePet = async (req, res) => {
	try {
		const deletedPet = await Pet.findByIdAndDelete(req.params.id);
		if (!deletedPet) {
			return res.status(404).json({ message: "Pet not found" });
		}
		res.status(200).json({ message: "Pet deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: "Error deleting pet", error: error.message });
	}
};
