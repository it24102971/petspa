import mongoose from "mongoose";

const cafeItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String },

    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CafeItem = mongoose.model("CafeItem", cafeItemSchema);
export default CafeItem;
