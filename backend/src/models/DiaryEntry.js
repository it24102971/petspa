import mongoose from "mongoose";

const diaryEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    petName: {
      type: String,
      required: true,
      trim: true,
    },
    petType: {
      type: String,
      enum: ["dog", "cat", "bird", "rabbit", "other"],
      default: "dog",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    serviceDate: {
      type: Date,
      required: true,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const DiaryEntry = mongoose.model("DiaryEntry", diaryEntrySchema);

export default DiaryEntry;
