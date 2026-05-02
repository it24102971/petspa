import User from "../models/User.js";
import Pet from "../models/Pet.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    const formattedUsers = users.map((u) => ({
      id: u._id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      phoneNumber: u.phoneNumber,
      isActive: u.isActive !== false, // Default to true if missing
    }));
    res.status(200).json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users.", error: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Administrators cannot be deactivated." });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      message: `User account ${user.isActive ? "activated" : "deactivated"} successfully.`,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user status.", error: error.message });
  }
};

// Admin Pet Management
export const getAllPets = async (req, res) => {
  try {
    const { search, type } = req.query;
    let query = {};

    if (type && type !== "all") {
      query.type = type;
    }

    if (search) {
      // Search by pet name or owner's name/email via population
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const userIds = users.map((u) => u._id);

      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { owner: { $in: userIds } },
        { type: { $regex: search, $options: "i" } },
      ];
    }

    const pets = await Pet.find(query).populate("owner", "fullName email phoneNumber");
    res.status(200).json(pets);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pets.", error: error.message });
  }
};

export const updatePetAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.imageUrl = `/uploads/pets/${req.file.filename}`;
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("owner", "fullName email");

    if (!updatedPet) {
      return res.status(404).json({ message: "Pet not found." });
    }

    res.status(200).json(updatedPet);
  } catch (error) {
    res.status(400).json({ message: "Failed to update pet.", error: error.message });
  }
};

export const deletePetAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPet = await Pet.findByIdAndDelete(id);

    if (!deletedPet) {
      return res.status(404).json({ message: "Pet not found." });
    }

    res.status(200).json({ message: "Pet deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete pet.", error: error.message });
  }
};
