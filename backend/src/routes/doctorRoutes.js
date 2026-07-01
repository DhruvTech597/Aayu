import express from "express";
import {
  getDoctorStats,
  getRecentActivity,
  updateDoctorProfile,
  getDoctorDashboard,
  getAllDoctors,
} from "../controllers/doctorController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Require JWT for all doctor routes
router.use(verifyJWT);

// Available to receptionist/doctor/admin
router.get("/list", getAllDoctors);

// Unified Dashboard (restricted to doctor role)
router.get("/dashboard", authorizeRoles("doctor"), getDoctorDashboard);

// Stats & activities endpoints (restricted to doctor role)
router.get("/stats", authorizeRoles("doctor"), getDoctorStats);
router.get("/recent-activity", authorizeRoles("doctor"), getRecentActivity);

// Profile customization (restricted to doctor role)
router.put("/profile", authorizeRoles("doctor"), updateDoctorProfile);

export default router;
