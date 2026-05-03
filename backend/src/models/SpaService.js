import mongoose from "mongoose";

const spaServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

const SpaService = mongoose.model("SpaService", spaServiceSchema);

export default SpaService;
