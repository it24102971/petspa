import mongoose from "mongoose";

const spaBookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "SpaService" },
    serviceName: { type: String },
    groomerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    groomerName: { type: String },
    appointmentDate: { type: String, required: true },
    appointmentTime: { type: String, required: true },
    price: { type: Number, required: true },
    paymentSlip: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Confirmed", "Rejected"], default: "Pending" },
  },
  { timestamps: true }
);

const SpaBooking = mongoose.model("SpaBooking", spaBookingSchema);

export default SpaBooking;
