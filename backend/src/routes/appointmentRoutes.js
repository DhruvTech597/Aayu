import express from "express";
import {
  createAppointment,
  getAppointments,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Require JWT for all appointments endpoints
router.use(verifyJWT);

// Create or fetch appointments (accessible by Receptionists, Doctors, Admins, and Patients)
router.route("/")
  .post(authorizeRoles("receptionist", "doctor", "admin", "patient"), createAppointment)
  .get(authorizeRoles("receptionist", "doctor", "admin", "patient"), getAppointments);

// Reschedule appointment
router.put("/:id/reschedule", authorizeRoles("receptionist", "doctor", "admin", "patient"), rescheduleAppointment);

// Cancel/Update status of appointment
router.put("/:id/status", authorizeRoles("receptionist", "doctor", "admin", "patient"), updateAppointmentStatus);

export default router;
