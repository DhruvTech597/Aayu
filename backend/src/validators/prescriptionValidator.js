import { body } from "express-validator";
import mongoose from "mongoose";

export const prescriptionValidation = {
  create: [
    body("patientId")
      .notEmpty()
      .withMessage("Patient ID is required")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid Patient ID format"),
    body("visitId")
      .optional()
      .custom((value) => !value || mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid Visit ID format"),
    body("symptoms")
      .optional()
      .isString()
      .trim()
      .escape(),
    body("diagnosis")
      .optional()
      .isString()
      .trim()
      .escape(),
    body("medicines")
      .isArray({ min: 1 })
      .withMessage("Medicines must be a non-empty array"),
    body("medicines.*.name")
      .notEmpty()
      .withMessage("Each medicine must have a name")
      .isString()
      .trim()
      .escape(),
    body("medicines.*.dosage")
      .optional()
      .isString()
      .trim()
      .escape(),
    body("medicines.*.frequency")
      .optional()
      .isString()
      .trim()
      .escape(),
    body("medicines.*.duration")
      .optional()
      .isString()
      .trim()
      .escape(),
    body("notes")
      .optional()
      .isString()
      .trim()
      .escape(),
    body("followUpDate")
      .optional()
      .custom((value) => !value || !isNaN(Date.parse(value)))
      .withMessage("Follow-up date must be a valid date format"),
  ],
  update: [
    body("symptoms")
      .optional()
      .isString()
      .trim()
      .escape(),
    body("diagnosis")
      .optional()
      .isString()
      .trim()
      .escape(),
    body("medicines")
      .optional()
      .isArray()
      .withMessage("Medicines must be an array"),
    body("medicines.*.name")
      .optional()
      .notEmpty()
      .withMessage("Each medicine must have a name")
      .isString()
      .trim()
      .escape(),
    body("medicines.*.dosage")
      .optional()
      .isString()
      .trim()
      .escape(),
    body("medicines.*.frequency")
      .optional()
      .isString()
      .trim()
      .escape(),
    body("medicines.*.duration")
      .optional()
      .isString()
      .trim()
      .escape(),
    body("notes")
      .optional()
      .isString()
      .trim()
      .escape(),
    body("followUpDate")
      .optional()
      .custom((value) => !value || !isNaN(Date.parse(value)))
      .withMessage("Follow-up date must be a valid date format"),
  ],
};
