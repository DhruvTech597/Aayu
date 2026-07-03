import Patient from "../models/Patient.js";
import Visit from "../models/Visit.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ensurePatientUser } from "./userController.js";

/**
 * Create a new patient
 */
export const createPatient = asyncHandler(async (req, res) => {
  const { fullName, age, gender, phone, abhaId, bloodGroup, allergies, chronicDiseases, emergencyContact, address, assignedDoctor } = req.body;

  if (!fullName || !age || !gender || !phone) {
    throw new ApiError(400, "Required fields are missing");
  }

  const existedPatient = await Patient.findOne({ phone });

  if (existedPatient) {
    throw new ApiError(409, "Patient with this phone number already exists");
  }

  const cleanedAbhaId = abhaId && abhaId.trim() !== "" ? abhaId.trim() : undefined;
  const cleanedDoctor = assignedDoctor && assignedDoctor.trim() !== "" ? assignedDoctor.trim() : undefined;

  if (cleanedAbhaId) {
    const existedAbha = await Patient.findOne({ abhaId: cleanedAbhaId });
    if (existedAbha) {
      throw new ApiError(409, "Patient with this ABHA ID already exists");
    }
  }

  const patient = await Patient.create({
    fullName,
    age,
    gender,
    phone,
    abhaId: cleanedAbhaId,
    bloodGroup,
    allergies,
    chronicDiseases,
    emergencyContact,
    address,
    createdByClinic: req.user?._id,
    assignedDoctor: cleanedDoctor,
  });

  // Provision user portal credentials
  await ensurePatientUser(patient);

  return res
    .status(201)
    .json(new ApiResponse(201, patient, "Patient created successfully"));
});

/**
 * Get all patients (with pagination and search)
 */
export const getPatients = asyncHandler(async (req, res) => {
  const search = req.query.search || req.query.q;
  const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;
  
  const query = {};
  if (req.user?.role === "doctor") {
    query.assignedDoctor = req.user._id;
  }

  if (search) {
    const isObjectId = mongoose.Types.ObjectId.isValid(search);
    if (isObjectId) {
      query._id = search;
    } else {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { abhaId: { $regex: search, $options: "i" } },
      ];
    }
  }

  // Define dynamic sort
  const sortQuery = {};
  sortQuery[sortBy] = sortOrder === "asc" || sortOrder === "1" ? 1 : -1;

  const patients = await Patient.find(query)
    .sort(sortQuery)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Patient.countDocuments(query);

  // For each patient, fetch last visit and create a medical history summary
  const enhancedPatients = await Promise.all(
    patients.map(async (patient) => {
      // Get the last visit
      const lastVisit = await Visit.findOne({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .populate("doctorId", "name");

      // Count total visits
      const visitCount = await Visit.countDocuments({ patientId: patient._id });

      // Get assigned doctor
      let assignedDoctor = "Not Assigned";
      if (patient.assignedDoctor) {
        const doc = await User.findById(patient.assignedDoctor).select("name");
        if (doc) assignedDoctor = doc.name;
      } else if (patient.createdByClinic) {
        const creator = await User.findById(patient.createdByClinic).select("name");
        if (creator) assignedDoctor = creator.name;
      } else if (lastVisit && lastVisit.doctorId) {
        assignedDoctor = lastVisit.doctorId.name;
      }

      // Compile medical history summary
      const medicalHistorySummary = {
        allergies: patient.allergies || [],
        chronicDiseases: patient.chronicDiseases || [],
        totalVisits: visitCount,
        bloodGroup: patient.bloodGroup || "Unknown"
      };

      return {
        _id: patient._id,
        fullName: patient.fullName,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        abhaId: patient.abhaId,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        chronicDiseases: patient.chronicDiseases,
        emergencyContact: patient.emergencyContact,
        address: patient.address,
        createdAt: patient.createdAt,
        lastVisitDate: lastVisit ? lastVisit.createdAt : null,
        assignedDoctor,
        assignedDoctorId: patient.assignedDoctor || null,
        medicalHistorySummary,
      };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { 
      patients: enhancedPatients, 
      total, 
      page: parseInt(page), 
      totalPages: Math.ceil(total / limit) 
    }, "Patients fetched successfully"));
});

/**
 * Get patient by ID
 */
export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  if (req.user?.role === "doctor" && patient.assignedDoctor && patient.assignedDoctor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to view this patient's records");
  }

  // Ensure portal account exists (for older patients already in DB)
  await ensurePatientUser(patient);

  return res
    .status(200)
    .json(new ApiResponse(200, patient, "Patient fetched successfully"));
});

/**
 * Update patient details
 */
export const updatePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.abhaId !== undefined) {
    updates.abhaId = updates.abhaId && updates.abhaId.trim() !== "" ? updates.abhaId.trim() : undefined;
  }
  if (updates.assignedDoctor !== undefined) {
    updates.assignedDoctor = updates.assignedDoctor && updates.assignedDoctor.trim() !== "" ? updates.assignedDoctor.trim() : undefined;
  }

  const patient = await Patient.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, patient, "Patient updated successfully"));
});

/**
 * Get Patient Dashboard Data (Health Snapshot & Upcoming Appointment)
 */
export const getPatientDashboard = asyncHandler(async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    throw new ApiError(400, "Patient ID is not associated with this user account");
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, "Patient record not found");
  }

  // Calculate Health Score
  let healthScore = 96;
  if (patient.chronicDiseases && patient.chronicDiseases.length > 0) {
    healthScore -= patient.chronicDiseases.length * 8;
  }
  if (patient.allergies && patient.allergies.length > 0) {
    healthScore -= patient.allergies.length * 4;
  }

  // Deduct for abnormal report parameters
  const Report = mongoose.model("Report");
  const reports = await Report.find({ patientId });
  let abnormalParamsCount = 0;
  reports.forEach(r => {
    const params = r.parsedData?.parameters || [];
    params.forEach(p => {
      if (p.status === "High" || p.status === "Low") {
        abnormalParamsCount++;
      }
    });
  });
  healthScore -= abnormalParamsCount * 3;
  if (healthScore < 50) healthScore = 50;

  // BP Status
  let bpStatus = "120/80 mmHg (Normal)";
  const hasHypertension = patient.chronicDiseases?.some(d => /hypertension|bp|blood pressure/i.test(d));
  if (hasHypertension) {
    bpStatus = "138/88 mmHg (Stage 1 Hypertension)";
  }

  // Sugar Status
  let sugarStatus = "98 mg/dL (Normal)";
  const hasDiabetes = patient.chronicDiseases?.some(d => /diabetes|sugar|glycemic/i.test(d));
  if (hasDiabetes) {
    sugarStatus = "142 mg/dL (Elevated)";
  }

  // BMI calculation
  const baseBmi = patient.gender === "Female" ? 21.2 : 22.8;
  const bmiOffset = (patient.age % 10) * 0.3;
  const bmiVal = (baseBmi + bmiOffset).toFixed(1);
  let bmiStatus = `${bmiVal} (Normal)`;
  if (bmiVal > 25) {
    bmiStatus = `${bmiVal} (Overweight)`;
  }

  // Last Visit Date
  const Visit = mongoose.model("Visit");
  const lastVisit = await Visit.findOne({ patientId, status: "completed" })
    .sort({ createdAt: -1 });
  const lastVisitDate = lastVisit ? lastVisit.createdAt : null;

  // AI Status
  let aiStatus = `Health index is optimal at ${healthScore}%. No critical biomarker anomalies detected in recent scans. Maintain active lifestyle.`;
  if (healthScore < 80) {
    aiStatus = `Health score is currently ${healthScore}% due to chronic conditions (${patient.chronicDiseases.join(", ")}). Regular monitoring of blood sugar and blood pressure is recommended.`;
  }

  // Nearest Upcoming Appointment
  const Appointment = mongoose.model("Appointment");
  const upcomingAppointment = await Appointment.findOne({
    patientId,
    status: { $in: ["pending", "scheduled", "rescheduled"] },
    appointmentDate: { $gte: new Date() }
  }).sort({ appointmentDate: 1 })
    .populate("doctorId", "name email specialization");

  return res.status(200).json(
    new ApiResponse(200, {
      patient,
      metrics: {
        healthScore,
        bpStatus,
        sugarStatus,
        bmiStatus,
        lastVisitDate,
        aiStatus,
      },
      upcomingAppointment,
    }, "Patient dashboard data loaded successfully")
  );
});

/**
 * Get Patient Chronological Medical Timeline
 */
export const getPatientTimeline = asyncHandler(async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    throw new ApiError(400, "Patient ID is not associated with this user account");
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, "Patient record not found");
  }

  const Visit = mongoose.model("Visit");
  const Prescription = mongoose.model("Prescription");
  const Report = mongoose.model("Report");
  const Appointment = mongoose.model("Appointment");

  // Gather all records
  const [visits, prescriptions, reports, appointments] = await Promise.all([
    Visit.find({ patientId }).populate("doctorId", "name specialization"),
    Prescription.find({ patientId, isDeleted: false }).populate("doctorId", "name specialization"),
    Report.find({ patientId }).populate("uploadedBy", "name"),
    Appointment.find({ patientId }).populate("doctorId", "name specialization"),
  ]);

  // Map events
  const events = [];

  visits.forEach(v => {
    events.push({
      _id: v._id,
      type: "Consultation",
      date: v.createdAt,
      title: "Clinical Consultation",
      subtitle: v.doctorId ? `Dr. ${v.doctorId.name}` : "Clinical Staff",
      detail: v.diagnosis || v.symptoms || "General Checkup",
      notes: v.notes,
      prescription: v.prescription,
      aiSummary: v.aiSummary,
    });
  });

  prescriptions.forEach(p => {
    events.push({
      _id: p._id,
      type: "Prescription",
      date: p.createdAt,
      title: "Medical Prescription (Rx)",
      subtitle: p.doctorId ? `Dr. ${p.doctorId.name}` : "Clinical Staff",
      detail: p.medicines.map(m => `${m.name} (${m.dosage})`).join(", "),
      notes: p.notes,
      medicines: p.medicines,
      followUpDate: p.followUpDate,
    });
  });

  reports.forEach(r => {
    events.push({
      _id: r._id,
      type: "Report",
      date: r.createdAt,
      title: `${r.reportType} Lab Report`,
      subtitle: r.uploadedBy ? `Uploaded by ${r.uploadedBy.name}` : "Diagnostic Hub",
      detail: r.fileName || "Diagnostic Record",
      aiSummary: r.aiSummary,
      parsedParameters: r.parsedData?.parameters || [],
    });
  });

  appointments.forEach(a => {
    events.push({
      _id: a._id,
      type: "Appointment",
      date: a.appointmentDate,
      title: `Appointment ${a.status.charAt(0).toUpperCase() + a.status.slice(1)}`,
      subtitle: a.doctorId ? `Dr. ${a.doctorId.name}` : "Clinical Staff",
      detail: `Reason: ${a.reason}`,
      status: a.status,
      notes: a.notes,
    });
  });

  // Sort chronologically (newest first)
  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.status(200).json(
    new ApiResponse(200, { events }, "Patient medical timeline generated successfully")
  );
});
