import mongoose from "mongoose";

const spaBookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "SpaService", required: true },
    serviceName: { type: String, required: true },
    price: { type: Number, required: true },
    paymentSlip: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Confirmed", "Rejected", "Accepted", "Completed"], default: "Pending" },
    assignedGroomer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    appointmentDate: { type: Date },
  },
  { timestamps: true }
);

const SpaBooking = mongoose.model("SpaBooking", spaBookingSchema);
export default SpaBooking;
