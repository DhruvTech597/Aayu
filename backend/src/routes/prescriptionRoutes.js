import express from "express";
import {
  createPrescription,
  updatePrescription,
  getPrescriptionById,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  softDeletePrescription,
  getPrescriptionPDF,
} from "../controllers/prescriptionController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validatorMiddleware.js";
import { prescriptionValidation } from "../validators/prescriptionValidator.js";

const router = express.Router();

// Require JWT for all prescription routes
router.use(verifyJWT);

// Create prescription (Doctor-only)
router.post(
  "/",
  authorizeRoles("doctor"),
  validate(prescriptionValidation.create),
  createPrescription
);

// Update prescription (Doctor-only)
router.put(
  "/:id",
  authorizeRoles("doctor"),
  validate(prescriptionValidation.update),
  updatePrescription
);

// Get a single prescription by ID (Doctor/Admin/Patient)
router.get(
  "/:id",
  authorizeRoles("doctor", "admin", "patient"),
  getPrescriptionById
);

// Get prescriptions for a specific patient (Doctor/Admin/Patient)
router.get(
  "/patient/:patientId",
  authorizeRoles("doctor", "admin", "patient"),
  getPrescriptionsByPatient
);

// Get prescriptions created by a specific doctor (Doctor/Admin)
router.get(
  "/doctor/:doctorId",
  authorizeRoles("doctor", "admin"),
  getPrescriptionsByDoctor
);

// Soft delete a prescription (Doctor-only)
router.delete(
  "/:id",
  authorizeRoles("doctor"),
  softDeletePrescription
);

// Get a single prescription as a professional PDF
router.get(
  "/:id/pdf",
  authorizeRoles("doctor", "admin", "receptionist", "patient"),
  getPrescriptionPDF
);

export default router;
