import express from "express";
import { getAllUsers, toggleUserStatus, addGroomer } from "../controller/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/users", protect, adminOnly, getAllUsers);
router.put("/users/:id/toggle", protect, adminOnly, toggleUserStatus);
router.post("/groomer", protect, adminOnly, addGroomer);

export default router;
