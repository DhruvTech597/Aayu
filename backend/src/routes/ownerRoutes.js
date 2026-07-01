import express from "express";
import {
  getAnalytics,
  getKPIs,
  getChartData,
  getOwnerDashboard,
  getFollowUps,
  updateFollowUpStatus,
  exportCSV,
  exportPDF,
} from "../controllers/ownerController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Require JWT and restrict all owner routes to "admin"
router.use(verifyJWT);
router.use(authorizeRoles("admin"));

// Unified Owner Dashboard (stats, charts, KPIs, recent activity)
router.get("/dashboard", getOwnerDashboard);

// Analytics aggregate endpoints
router.get("/analytics", getAnalytics);

// Clinic key performance indicators (KPIs)
router.get("/kpis", getKPIs);

// Chart data streams
router.get("/charts", getChartData);

// Advanced Follow-Up Management
router.get("/follow-ups", getFollowUps);
router.put("/follow-ups/:id/status", updateFollowUpStatus);

// Analytics Export System
router.get("/export/csv", exportCSV);
router.get("/export/pdf", exportPDF);

export default router;
