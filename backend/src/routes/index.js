import express from "express";
import userRouter from "./userRoutes.js";
import patientRouter from "./patientRoutes.js";
import medicalRecordRouter from "./medicalRecordRoutes.js";
import visitRouter from "./visitRoutes.js";
import reportRouter from "./reportRoutes.js";
import doctorRouter from "./doctorRoutes.js";
import prescriptionRouter from "./prescriptionRoutes.js";
import ownerRouter from "./ownerRoutes.js";
import appointmentRouter from "./appointmentRoutes.js";
import aiRouter from "./aiRoutes.js";

const router = express.Router();

router.use("/users", userRouter);
router.use("/patients", patientRouter);
router.use("/medical-records", medicalRecordRouter);
router.use("/visits", visitRouter);
router.use("/reports", reportRouter);
router.use("/doctor", doctorRouter);
router.use("/prescriptions", prescriptionRouter);
router.use("/owner", ownerRouter);
router.use("/appointments", appointmentRouter);
router.use("/ai", aiRouter);

export default router;

