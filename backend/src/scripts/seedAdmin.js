import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { connectDB } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = "admin@petspa.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin user already exists.");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    await User.create({
      fullName: "System Administrator",
      email: adminEmail,
      phoneNumber: "0000000000",
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("Admin user created successfully!");
    console.log("Email: admin@petspa.com");
    console.log("Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
