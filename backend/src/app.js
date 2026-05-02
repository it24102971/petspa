import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import petRoutes from "./routes/petRoutes.js";
import diaryRoutes from "./routes/diaryRoutes.js";
import spaServiceRoutes from "./routes/spaServiceRoutes.js";
import cafeRoutes from "./routes/cafeRoutes.js";

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
app.use("/api/spa-services", spaServiceRoutes);
app.use("/api/cafe", cafeRoutes);

export default app;