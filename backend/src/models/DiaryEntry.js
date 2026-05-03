import mongoose from "mongoose";

const diaryEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    petName: { type: String, required: true },
    petType: { type: String, enum: ["dog", "cat", "bird", "rabbit", "other"], default: "dog" },
    title: { type: String, required: true },
    content: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    serviceDate: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
    photoUrl: { type: String },
  },
  { timestamps: true }
);

const DiaryEntry = mongoose.model("DiaryEntry", diaryEntrySchema);

export default DiaryEntry;
