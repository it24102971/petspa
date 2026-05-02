import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9]{10}$/;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getJwtSecret = () => process.env.JWT_SECRET || "development_secret_change_me";

const createAuthResponse = (user) => {
  const token = jwt.sign({ userId: user._id, email: user.email }, getJwtSecret(), {
    expiresIn: "7d",
  });

  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profilePicture: user.profilePicture,
      experience: user.experience,
      specialization: user.specialization,
      aboutMe: user.aboutMe,
    },
  };
};

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword, role } = req.body;

    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (!phonePattern.test(phoneNumber)) {
      return res.status(400).json({
        message: "Please provide a valid 10-digit phone number.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "An account already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
      role: role || "customer",
    });

    return res.status(201).json({
      message: "Registration successful.",
      ...createAuthResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const rawIdentifier = (email || username || "").trim();
    const normalizedIdentifier = rawIdentifier.toLowerCase();

    if (!rawIdentifier || !password) {
      return res.status(400).json({ message: "Email, username, or phone number and password are required." });
    }

    const loginFilters = [{ email: normalizedIdentifier }, { username: normalizedIdentifier }];

    if (phonePattern.test(rawIdentifier)) {
      loginFilters.push({ phoneNumber: rawIdentifier });
    } else {
      loginFilters.push({ fullName: new RegExp(`^${escapeRegex(rawIdentifier)}$`, "i") });
    }

    const user = await User.findOne({ $or: loginFilters });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.isActive === false) {
      return res.status(403).json({ 
        message: "Your account has been deactivated. Please contact support." 
      });
    }

    let isPasswordMatch = false;

    // Accept legacy plaintext passwords for old records and migrate them to bcrypt on successful login.
    if (typeof user.password === "string" && user.password.startsWith("$2")) {
      isPasswordMatch = await bcrypt.compare(password, user.password);
    } else {
      isPasswordMatch = password === user.password;
      if (isPasswordMatch) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    return res.status(200).json({
      message: "Login successful.",
      ...createAuthResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      address: updatedUser.address,
      role: updatedUser.role,
      profilePicture: updatedUser.profilePicture,
      experience: updatedUser.experience,
      specialization: updatedUser.specialization,
      aboutMe: updatedUser.aboutMe,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile.", error: error.message });
  }
};
