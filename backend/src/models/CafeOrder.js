import mongoose from "mongoose";

const cafeOrderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    customerName: { type: String, default: "Walk-in Customer" },
    items: [
      {
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
        emoji: { type: String, default: "☕" },
      },
    ],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    paymentSlip: { type: String, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const CafeOrder = mongoose.model("CafeOrder", cafeOrderSchema);
export default CafeOrder;
