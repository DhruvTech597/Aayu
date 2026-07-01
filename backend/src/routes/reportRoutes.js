import express from "express";
import {
  uploadReport,
  getReportsByPatient,
  getReportById,
  getAllReports,
  getOriginalReport,
} from "../controllers/reportController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validatorMiddleware.js";
import { reportValidation } from "../validators/patientValidator.js";
import upload from "../middlewares/multerMiddleware.js";

const router = express.Router();

router.use(verifyJWT);

// Get master reports catalog
router.get("/", getAllReports);

router.post(
  "/upload",
  authorizeRoles("doctor"),
  upload.single("report"),
  validate(reportValidation.upload),
  uploadReport
);

router.get("/patient/:patientId", getReportsByPatient);
router.get("/:id/original", getOriginalReport);
router.get("/:id", getReportById);

export default router;
