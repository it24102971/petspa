import mongoose from "mongoose";

const spaBookingSchema = new mongoose.Schema(
  {

  },
  { timestamps: true }
);

const SpaBooking = mongoose.model("SpaBooking", spaBookingSchema);

export default SpaBooking;
