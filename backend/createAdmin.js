import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const existingAdmin = await User.findOne({ email: "admin@petspa.com" });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin12345", 10);

    const admin = new User({
      fullName: "Admin User",
      email: "admin@petspa.com",
      phoneNumber: "0712345678",
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    await admin.save();
    console.log("Admin user created successfully!");
    console.log("Email: admin@petspa.com");
    console.log("Password: admin12345");
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
