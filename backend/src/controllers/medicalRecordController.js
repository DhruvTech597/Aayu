import MedicalRecord from "../models/MedicalRecord.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

/**
 * Create a new medical record with optional file upload
 */
export const createMedicalRecord = asyncHandler(async (req, res) => {
  const { patient, doctor, symptoms, diagnosis, prescription } = req.body;

  // 1. Basic validation
  if (!patient || !doctor || !symptoms) {
    throw new ApiError(400, "Patient, Doctor and Symptoms are required");
  }

  // 2. Verify patient and doctor existence
  const patientExists = await Patient.findById(patient);
  if (!patientExists) {
    throw new ApiError(404, "Patient not found");
  }

  const doctorExists = await User.findById(doctor);
  if (!doctorExists) {
    throw new ApiError(404, "Doctor not found");
  }

  // 3. Handle File Upload if present
  let reportUrl = "";
  let reportPublicId = "";

  if (req.file) {
    try {
      const isPdf = req.file.mimetype === "application/pdf" || req.file.originalname?.toLowerCase().endsWith(".pdf");
      const resourceType = isPdf ? "raw" : "auto";
      const uploadResult = await uploadToCloudinary(req.file.buffer, "medai-records", resourceType, req.file.originalname);
      reportUrl = uploadResult.secure_url;
      reportPublicId = uploadResult.public_id;
    } catch (error) {
      throw new ApiError(500, "Error uploading report to Cloudinary");
    }
  }

  // 4. Create record
  const record = await MedicalRecord.create({
    patient,
    doctor,
    symptoms,
    diagnosis,
    prescription,
    reportUrl,
    reportPublicId,
    aiSummary: "AI Summary pending integration...", // Placeholder for future task
  });

  return res
    .status(201)
    .json(new ApiResponse(201, record, "Medical record created successfully"));
});

/**
 * Get all medical records for a patient
 */
export const getPatientRecords = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  if (req.user?.role === "doctor") {
    const patientRecord = await Patient.findById(patientId);
    if (!patientRecord || !patientRecord.assignedDoctor || patientRecord.assignedDoctor.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to view medical records for this patient");
    }
  }

  const records = await MedicalRecord.find({ patient: patientId })
    .populate("doctor", "name email")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, records, "Patient records fetched successfully"));
});

/**
 * Get single medical record details
 */
export const getMedicalRecordById = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate("patient", "fullName age gender")
    .populate("doctor", "name");

  if (!record) {
    throw new ApiError(404, "Medical record not found");
  }

  if (req.user?.role === "doctor") {
    const patientRecord = await Patient.findById(record.patient);
    if (!patientRecord || !patientRecord.assignedDoctor || patientRecord.assignedDoctor.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to view this medical record");
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, record, "Medical record fetched successfully"));
});
