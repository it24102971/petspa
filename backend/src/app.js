import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import petRoutes from "./routes/petRoutes.js";
import diaryRoutes from "./routes/diaryRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (_req, res) => {
	res.status(200).json({ message: "Backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/diary", diaryRoutes);

export default app;