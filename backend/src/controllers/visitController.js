import Visit from "../models/Visit.js";
import Report from "../models/Report.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { checkMedicineConflicts } from "../services/medicineConflictService.js";
import { generateMedicalSummary } from "../services/aiSummaryService.js";

/**
 * Create a new visit (Patient Check-In)
 */
export const createVisit = asyncHandler(async (req, res) => {
  const { patientId, doctorId, symptoms, diagnosis, prescription, notes, uploadedReports, status } = req.body;

  if (!patientId || !doctorId) {
    throw new ApiError(400, "Patient ID and Doctor ID are required");
  }

  // Auto-seed mock doctor if it's a valid mock ID and missing
  const validMocks = ["000000000000000000000001", "000000000000000000000002", "000000000000000000000003"];
  if (validMocks.includes(doctorId.toString())) {
    const exists = await User.findById(doctorId);
    if (!exists) {
      const names = {
        "000000000000000000000001": "Alex House",
        "000000000000000000000002": "Sarah Connor",
        "000000000000000000000003": "James Carter",
      };
      const specs = {
        "000000000000000000000001": "Cardiology",
        "000000000000000000000002": "Neurology",
        "000000000000000000000003": "General Physician",
      };
      await User.create({
        _id: doctorId,
        name: names[doctorId],
        email: `mock_${doctorId}@clinic.com`,
        password: "$2a$10$vIK6B/cM06k15b7b9i0aOe1Z0b2o6f7u8i9a0e1z0b2o6f7u8i9a0",
        role: "doctor",
        specialization: specs[doctorId],
      });
    }
  }

  // Check for medicine conflicts if prescription is provided
  let medicineConflicts = [];
  if (prescription) {
    medicineConflicts = await checkMedicineConflicts(prescription);
  }

  // Generate AI summary for the visit if symptoms and diagnosis are provided
  let aiSummary = "";
  if (symptoms && diagnosis) {
    aiSummary = await generateMedicalSummary(`Symptoms: ${symptoms}\nDiagnosis: ${diagnosis}\nPrescription: ${prescription}`);
  }

  const visit = await Visit.create({
    patientId,
    doctorId,
    symptoms: symptoms || "",
    diagnosis: diagnosis || "",
    prescription: prescription || "",
    notes: notes || "",
    uploadedReports: uploadedReports || [],
    aiSummary: aiSummary || "AI Summary pending...",
    medicineConflicts: medicineConflicts || [],
    status: status || "waiting",
  });

  const populatedVisit = await Visit.findById(visit._id)
    .populate("patientId", "fullName phone age gender bloodGroup")
    .populate("doctorId", "name");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedVisit, "Patient checked in and visit created successfully"));
});

/**
 * Get all visits for a specific patient
 */
export const getVisitsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  if (req.user?.role === "doctor") {
    const patientRecord = await Patient.findById(patientId);
    if (!patientRecord || !patientRecord.assignedDoctor || patientRecord.assignedDoctor.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to view visits for this patient");
    }
  }

  const visits = await Visit.find({ patientId })
    .populate("patientId", "fullName phone")
    .populate("doctorId", "name")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, visits || [], "Visits fetched successfully"));
});

/**
 * Update visit status (Waiting -> In Consultation -> Completed)
 */
export const updateVisitStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["waiting", "in_consultation", "completed", "cancelled"].includes(status)) {
    throw new ApiError(400, "Valid status is required");
  }

  const visit = await Visit.findById(id);
  if (!visit) {
    throw new ApiError(404, "Visit record not found");
  }

  visit.status = status;
  await visit.save();

  const updatedVisit = await Visit.findById(id)
    .populate("patientId", "fullName phone age gender bloodGroup")
    .populate("doctorId", "name");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVisit, `Visit transitioned to ${status} successfully`));
});

/**
 * Update ongoing visit clinical details during doctor consultation
 */
export const updateVisitDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { symptoms, diagnosis, prescription, notes, uploadedReports } = req.body;

  const visit = await Visit.findById(id);
  if (!visit) {
    throw new ApiError(404, "Visit record not found");
  }

  if (symptoms !== undefined) visit.symptoms = symptoms;
  if (diagnosis !== undefined) visit.diagnosis = diagnosis;
  if (prescription !== undefined) visit.prescription = prescription;
  if (notes !== undefined) visit.notes = notes;
  if (uploadedReports !== undefined) visit.uploadedReports = uploadedReports;

  // Re-run conflict checking and AI summary compile if values changed
  if (prescription) {
    try {
      visit.medicineConflicts = await checkMedicineConflicts(prescription);
    } catch (err) {
      console.error("Conflict checking failed", err);
    }
  }

  if (visit.symptoms && visit.diagnosis) {
    try {
      visit.aiSummary = await generateMedicalSummary(
        `Symptoms: ${visit.symptoms}\nDiagnosis: ${visit.diagnosis}\nPrescription: ${visit.prescription || "None"}`
      );
    } catch (err) {
      console.error("AI Summary generation failed", err);
    }
  }

  await visit.save();

  const updatedVisit = await Visit.findById(id)
    .populate("patientId", "fullName phone age gender bloodGroup")
    .populate("doctorId", "name")
    .populate("uploadedReports");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVisit, "Clinical details updated successfully"));
});

/**
 * Get active clinic queue (waiting + in_consultation)
 */
export const getActiveQueue = asyncHandler(async (req, res) => {
  const query = {
    status: { $in: ["waiting", "in_consultation"] }
  };
  if (req.user?.role === "doctor") {
    query.doctorId = req.user._id;
  }

  const queue = await Visit.find(query)
    .populate("patientId", "fullName phone age gender bloodGroup abhaId")
    .populate("doctorId", "name specialization")
    .sort({ createdAt: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, queue || [], "Active queue synchronized successfully"));
});

/**
 * Fetch receptionist aggregate counts for daily KPIs
 */
export const getTodayVisits = asyncHandler(async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const totalPatientsToday = await Patient.countDocuments({
    createdAt: { $gte: todayStart, $lte: todayEnd }
  });

  const waitingQueue = await Visit.countDocuments({
    status: "waiting"
  });

  const activeConsultations = await Visit.countDocuments({
    status: "in_consultation"
  });

  const completedVisits = await Visit.countDocuments({
    status: "completed",
    createdAt: { $gte: todayStart, $lte: todayEnd }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalPatientsToday,
        waitingQueue,
        activeConsultations,
        completedVisits,
      },
      "Today's visit statistics aggregated successfully"
    )
  );
});
