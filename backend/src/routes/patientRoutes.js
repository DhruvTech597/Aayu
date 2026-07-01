import express from "express";
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  getPatientDashboard,
  getPatientTimeline,
} from "../controllers/patientController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validatorMiddleware.js";
import { patientValidation } from "../validators/patientValidator.js";

const router = express.Router();

// All patient routes require authentication
router.use(verifyJWT);

// Patient specific endpoints
router.get("/me/dashboard", authorizeRoles("patient"), getPatientDashboard);
router.get("/me/timeline", authorizeRoles("patient"), getPatientTimeline);

router.post(
  "/create",
  authorizeRoles("receptionist", "doctor", "admin"),
  validate(patientValidation.create),
  createPatient
);
router.get("/search", getPatients);
router.get("/:id", getPatientById);
router.put("/update/:id", authorizeRoles("receptionist", "doctor", "admin"), validate(patientValidation.update), updatePatient);

export default router;

