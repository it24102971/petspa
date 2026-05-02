import mongoose from "mongoose";

const spaServiceSchema = new mongoose.Schema(
  {

  },
  { timestamps: true }
);

const SpaService = mongoose.model("SpaService", spaServiceSchema);

export default SpaService;
