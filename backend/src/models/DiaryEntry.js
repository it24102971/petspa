import mongoose from "mongoose";

const diaryEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    mood: { type: String },
    imageUrl: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const DiaryEntry = mongoose.model("DiaryEntry", diaryEntrySchema);
export default DiaryEntry;
