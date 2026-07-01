import { body } from "express-validator";

export const patientValidation = {
  create: [
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("age").isNumeric().withMessage("Age must be a number"),
    body("gender").isIn(["Male", "Female", "Other"]).withMessage("Invalid gender"),
    body("phone").isMobilePhone("any").withMessage("Valid phone number is required"),
    body("abhaId").optional({ checkFalsy: true }).matches(/^[a-zA-Z0-9\s\-]+$/).withMessage("ABHA ID must be alphanumeric with optional spaces or dashes"),
    body("bloodGroup").optional({ checkFalsy: true }).trim().escape(),
    body("allergies").optional({ checkFalsy: true }).isArray().withMessage("Allergies must be an array"),
    body("chronicDiseases").optional({ checkFalsy: true }).isArray().withMessage("Chronic diseases must be an array"),
    body("emergencyContact").optional({ checkFalsy: true }).trim().escape(),
    body("assignedDoctor").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid doctor ID"),
  ],
  update: [
    body("fullName").optional().notEmpty().withMessage("Full name cannot be empty"),
    body("age").optional().isNumeric().withMessage("Age must be a number"),
    body("gender").optional().isIn(["Male", "Female", "Other"]).withMessage("Invalid gender"),
    body("phone").optional().isMobilePhone("any").withMessage("Valid phone number is required"),
    body("abhaId").optional({ checkFalsy: true }).matches(/^[a-zA-Z0-9\s\-]+$/).withMessage("ABHA ID must be alphanumeric with optional spaces or dashes"),
    body("assignedDoctor").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid doctor ID"),
  ],
};

export const visitValidation = {
  create: [
    body("patientId").notEmpty().withMessage("Patient ID is required"),
    body("doctorId").notEmpty().withMessage("Doctor ID is required"),
    body("symptoms").optional().trim().escape(),
    body("diagnosis").optional().trim().escape(),
    body("prescription").optional().trim().escape(),
    body("notes").optional().trim().escape(),
    body("uploadedReports").optional().isArray().withMessage("Uploaded reports must be an array"),
  ],
};

export const reportValidation = {
  upload: [
    body("patientId").notEmpty().withMessage("Patient ID is required"),
    body("reportType").notEmpty().withMessage("Report type is required"),
  ],
};
