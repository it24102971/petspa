import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    experience: {
      type: String,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    availableDays: {
      type: String,
      trim: true,
    },
    availableTime: {
      type: String,
      trim: true,
    },
    aboutMe: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String, // Store as base64 or URL
    },
    role: {
      type: String,
      enum: ["customer", "admin", "groomer"],
      default: "customer",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
// update