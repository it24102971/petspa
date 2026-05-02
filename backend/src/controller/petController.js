import Pet from "../models/Pet.js";

// Create a new pet
export const createPet = async (req, res) => {
	try {
		let imageUrl = null;
		if (req.file) {
			imageUrl = `/uploads/pets/${req.file.filename}`;
		}

		const newPet = new Pet({
			...req.body,
			owner: req.user._id,
			...(imageUrl && { imageUrl }),
		});
		const savedPet = await newPet.save();
		res.status(201).json(savedPet);
	} catch (error) {
		res.status(400).json({ message: "Error creating pet", error: error.message });
	}
};

// Get all pets
export const getPets = async (req, res) => {
	try {
		const pets = await Pet.find({ owner: req.user._id });
		res.status(200).json(pets);
	} catch (error) {
		res.status(500).json({ message: "Error fetching pets", error: error.message });
	}
};

// Update a pet
export const updatePet = async (req, res) => {
	try {
		const updateData = { ...req.body };
		if (req.file) {
			updateData.imageUrl = `/uploads/pets/${req.file.filename}`;
		}

		const updatedPet = await Pet.findOneAndUpdate(
			{ _id: req.params.id, owner: req.user._id },
			{ $set: updateData },
			{ new: true, runValidators: true }
		);
		if (!updatedPet) {
			return res.status(404).json({ message: "Pet not found or unauthorized" });
		}
		res.status(200).json(updatedPet);
	} catch (error) {
		res.status(400).json({ message: "Error updating pet", error: error.message });
	}
};

// Delete a pet
export const deletePet = async (req, res) => {
	try {
		const deletedPet = await Pet.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
		if (!deletedPet) {
			return res.status(404).json({ message: "Pet not found or unauthorized" });
		}
		res.status(200).json({ message: "Pet deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: "Error deleting pet", error: error.message });
	}
};
