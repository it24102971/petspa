import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Pet from "../models/Pet.js";

// User Management
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    const formattedUsers = users.map((u) => ({
      id: u._id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      phoneNumber: u.phoneNumber,
      isActive: u.isActive !== false,
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

export const getGroomers = async (req, res) => {
  try {
    const groomers = await User.find({ role: "groomer" }).select("-password");
    res.status(200).json(groomers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch groomers.", error: error.message });
  }
};

export const addGroomer = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, experience, specialization, availableDays, availableTime } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newGroomer = await User.create({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      experience,
      specialization,
      availableDays,
      availableTime,
      role: "groomer",
    });

    res.status(201).json({
      message: "Groomer added successfully.",
      user: {
        id: newGroomer._id,
        fullName: newGroomer.fullName,
        email: newGroomer.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add groomer.", error: error.message });
  }
};

// Pet Management
export const getAllPets = async (req, res) => {
  try {
    const { search, type } = req.query;
    let filter = {};

    if (type && type !== "all") {
      filter.type = new RegExp(`^${type}$`, "i");
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");

      filter.$or = [
        { name: searchRegex },
        { breed: searchRegex }
      ];
    }

    const pets = await Pet.find(filter).populate("owner", "fullName email");
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

    const updatedPet = await Pet.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedPet) {
      return res.status(404).json({ message: "Pet not found." });
    }
    res.status(200).json(updatedPet);
  } catch (error) {
    res.status(500).json({ message: "Failed to update pet.", error: error.message });
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
