import mongoose from "mongoose";

const cafeOrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "CafeItem" },
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 },
      },
    ],
    totalPrice: { type: Number, required: true },
    paymentSlip: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Confirmed", "Rejected"], default: "Pending" },
  },
  { timestamps: true }
);

const CafeOrder = mongoose.model("CafeOrder", cafeOrderSchema);
export default CafeOrder;
