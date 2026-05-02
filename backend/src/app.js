import express from "express";
import cors from "cors";


const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (_req, res) => {
	res.status(200).json({ message: "Backend is running" });
});


