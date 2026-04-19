import User from "../models/User.js";
import bcrypt from "bcryptjs";

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

export const addGroomer = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      password,
      experience,
      specialization,
      availableDays,
      availableTime,
      isActive,
    } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const groomer = await User.create({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: "groomer",
      experience,
      specialization,
      availableDays,
      availableTime,
      isActive: isActive !== false, // default to true
    });

    if (groomer) {
      res.status(201).json({
        id: groomer._id,
        fullName: groomer.fullName,
        email: groomer.email,
        role: groomer.role,
        message: "Groomer added successfully.",
      });
    } else {
      res.status(400).json({ message: "Invalid groomer data." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
