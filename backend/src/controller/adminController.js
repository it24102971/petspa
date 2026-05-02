import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Pet from "../models/Pet.js";


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


  try {
    const groomers = await User.find({ role: "groomer" }).select("-password");
    res.status(200).json(groomers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch groomers.", error: error.message });
  }
};

export const addGroomer = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    res.status(200).json({ message: "Pet deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete pet.", error: error.message });
  }
};
