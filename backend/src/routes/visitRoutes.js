import express from "express";
import {
  createVisit,
  getVisitsByPatient,
  updateVisitStatus,
  updateVisitDetails,
  getActiveQueue,
  getTodayVisits,
} from "../controllers/visitController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyJWT);

// Create visit (Check-In) is accessible by receptionists, doctors, and admins
router.post(
  "/create",
  authorizeRoles("receptionist", "doctor", "admin"),
  createVisit
);

// Active queue list for monitors
router.get("/queue", authorizeRoles("receptionist", "doctor", "admin"), getActiveQueue);

// Receptionist summary stats
router.get("/today-stats", authorizeRoles("receptionist", "doctor", "admin"), getTodayVisits);

// Get visits history for specific patient
router.get("/patient/:patientId", authorizeRoles("receptionist", "doctor", "admin"), getVisitsByPatient);

// Transitions visit queue status
router.put("/:id/status", authorizeRoles("receptionist", "doctor", "admin"), updateVisitStatus);

// Edit clinical details during consult
router.put("/:id/details", authorizeRoles("doctor", "admin"), updateVisitDetails);

export default router;
