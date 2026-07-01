import express from "express";
import {
  createMedicalRecord,
  getPatientRecords,
  getMedicalRecordById,
} from "../controllers/medicalRecordController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";

const router = express.Router();

router.use(verifyJWT);

router.post(
  "/",
  authorizeRoles("doctor"),
  upload.single("report"),
  createMedicalRecord
);

router.get("/patient/:patientId", getPatientRecords);
router.get("/:id", getMedicalRecordById);

export default router;
