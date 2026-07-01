import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import PDFDocument from "pdfkit";
import { syncCompletedFollowUps } from "../services/followUpSyncService.js";

/**
 * Create a new prescription
 */
export const createPrescription = asyncHandler(async (req, res) => {
  const { patientId, visitId, symptoms, diagnosis, medicines, notes, followUpDate, followUpStatus } = req.body;
  const doctorId = req.user?._id;

  if (!patientId) {
    throw new ApiError(400, "Patient ID is required");
  }

  // Confirm patient exists
  const patientExists = await Patient.findById(patientId);
  if (!patientExists) {
    throw new ApiError(404, "Patient not found");
  }

  const prescription = await Prescription.create({
    patientId,
    doctorId,
    visitId,
    symptoms,
    diagnosis,
    medicines,
    notes,
    followUpDate,
    followUpStatus: followUpStatus || "scheduled",
    createdBy: doctorId,
    updatedBy: doctorId,
    lastModifiedAt: new Date(),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, prescription, "Prescription created successfully"));
});

/**
 * Update a prescription
 */
export const updatePrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const prescription = await Prescription.findOne({ _id: id, isDeleted: false });

  if (!prescription) {
    throw new ApiError(404, "Prescription not found or has been deleted");
  }

  // Ensure only the doctor who wrote it (or an admin) can update it
  if (prescription.doctorId.toString() !== req.user?._id.toString() && req.user?.role !== "admin") {
    throw new ApiError(403, "You are not authorized to update this prescription");
  }

  // Set audit logs
  updates.updatedBy = req.user?._id;
  updates.lastModifiedAt = new Date();

  const updatedPrescription = await Prescription.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPrescription, "Prescription updated successfully"));
});

/**
 * Get prescription by ID (Populated for PDF layout and viewing)
 */
export const getPrescriptionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prescription = await Prescription.findOne({ _id: id, isDeleted: false })
    .populate("patientId", "fullName phone age gender bloodGroup allergies chronicDiseases address")
    .populate("doctorId", "name email specialization availability");

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  if (req.user.role === "patient" && (prescription.patientId._id || prescription.patientId).toString() !== req.user.patientId.toString()) {
    throw new ApiError(403, "You can only view your own prescriptions");
  }

  if (req.user.role === "doctor") {
    const patientRecord = await Patient.findById(prescription.patientId);
    if (!patientRecord || !patientRecord.assignedDoctor || patientRecord.assignedDoctor.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to view this prescription");
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, prescription, "Prescription fetched successfully"));
});

/**
 * Get all prescriptions for a specific patient
 */
export const getPrescriptionsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;

  const filter = { isDeleted: false };
  
  let targetPatientId = patientId;
  if (req.user.role === "patient") {
    targetPatientId = req.user.patientId.toString();
  }

  if (req.user.role === "doctor" && targetPatientId && targetPatientId !== 'all') {
    const patientRecord = await Patient.findById(targetPatientId);
    if (!patientRecord || !patientRecord.assignedDoctor || patientRecord.assignedDoctor.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to view prescriptions for this patient");
    }
  }

  if (targetPatientId && targetPatientId !== 'all' && mongoose.Types.ObjectId.isValid(targetPatientId)) {
    filter.patientId = targetPatientId;
  }

  await syncCompletedFollowUps({ patientId: filter.patientId });

  if (status) filter.followUpStatus = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const prescriptions = await Prescription.find(filter)
    .populate("patientId", "fullName phone age gender")
    .populate("doctorId", "name email specialization")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Prescription.countDocuments(filter);

  return res
    .status(200)
    .json(new ApiResponse(200, {
      prescriptions: prescriptions || [],
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    }, "Prescriptions fetched successfully"));
});

export const getPrescriptionsByDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;

  const filter = { isDeleted: false };
  
  let targetDoctorId = doctorId;
  if (doctorId === 'me') {
    targetDoctorId = req.user?._id;
  }

  if (targetDoctorId && targetDoctorId !== 'all' && mongoose.Types.ObjectId.isValid(targetDoctorId)) {
    filter.doctorId = targetDoctorId;
  }

  await syncCompletedFollowUps({ doctorId: filter.doctorId });

  if (status) filter.followUpStatus = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const prescriptions = await Prescription.find(filter)
    .populate("patientId", "fullName phone age gender")
    .populate("doctorId", "name email specialization")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Prescription.countDocuments(filter);

  return res
    .status(200)
    .json(new ApiResponse(200, {
      prescriptions: prescriptions || [],
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    }, "Prescriptions fetched successfully"));
});

/**
 * Soft delete a prescription
 */
export const softDeletePrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prescription = await Prescription.findOne({ _id: id, isDeleted: false });

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  // Ensure only the doctor who wrote it (or an admin) can delete it
  if (prescription.doctorId.toString() !== req.user?._id.toString() && req.user?.role !== "admin") {
    throw new ApiError(403, "You are not authorized to delete this prescription");
  }

  prescription.isDeleted = true;
  await prescription.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Prescription deleted successfully"));
});

/**
 * Generate a professional Clinical Prescription PDF using pdfkit
 */
export const getPrescriptionPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prescription = await Prescription.findOne({ _id: id, isDeleted: false })
    .populate("patientId", "fullName phone age gender bloodGroup allergies chronicDiseases address")
    .populate("doctorId", "name email specialization availability");

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  if (req.user.role === "patient" && (prescription.patientId._id || prescription.patientId).toString() !== req.user.patientId.toString()) {
    throw new ApiError(403, "You can only download your own prescriptions");
  }

  const doc = new PDFDocument({ margin: 50, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=prescription-${id}.pdf`);

  doc.pipe(res);

  // Styling Constants
  const brandColor = "#10b981"; // Emerald
  const brandDark = "#0f172a";  // Dark Slate
  const grayText = "#64748b";   // Cool Gray
  const borderLight = "#e2e8f0";

  // --- Clinic Header ---
  doc.fontSize(22).fillColor(brandColor).font("Helvetica-Bold").text("AAYU CLINICAL WORKSPACE", { align: "left" });
  doc.fontSize(10).fillColor(grayText).font("Helvetica-Bold").text("DIGITAL CLINICAL HEALTH SYSTEM", { align: "left" });
  
  doc.moveUp(2);
  doc.fontSize(12).fillColor(brandDark).font("Helvetica-Bold").text("Rx Prescription Slip", { align: "right" });
  doc.fontSize(9).fillColor(grayText).font("Helvetica").text(`Rx ID: ${id.toString().toUpperCase()}`, { align: "right" });
  
  doc.moveDown(1.5);
  doc.strokeColor(borderLight).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  // --- Doctor & Patient columns ---
  const currentY = doc.y;
  
  // Doctor Info (Left)
  doc.fontSize(11).fillColor(brandDark).font("Helvetica-Bold").text(`Dr. ${prescription.doctorId?.name || 'Alex House'}`, 50, currentY);
  doc.fontSize(9).fillColor(grayText).font("Helvetica").text(prescription.doctorId?.specialization || "General Practitioner");
  doc.text(prescription.doctorId?.email || "doctor@clinic.com");
  
  // Patient Info (Right)
  const rightColumnX = 330;
  doc.fontSize(11).fillColor(brandDark).font("Helvetica-Bold").text(`Patient: ${prescription.patientId?.fullName || 'Jane Doe'}`, rightColumnX, currentY);
  doc.fontSize(9).fillColor(grayText).font("Helvetica").text(`Age / Gender: ${prescription.patientId?.age} yrs • ${prescription.patientId?.gender}`);
  doc.text(`Phone: ${prescription.patientId?.phone || 'N/A'}`);
  doc.text(`Blood Group: ${prescription.patientId?.bloodGroup || 'N/A'}`);

  doc.moveDown(2);
  doc.strokeColor(borderLight).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1.5);

  // --- Symptoms & Diagnosis ---
  doc.fontSize(11).fillColor(brandDark).font("Helvetica-Bold").text("Clinical Synopsis", 50);
  doc.moveDown(0.5);
  
  doc.fontSize(9).fillColor(grayText).font("Helvetica-Bold").text("Presenting Symptoms: ", { continued: true });
  doc.fillColor(brandDark).font("Helvetica").text(prescription.symptoms || "General fatigue & review");
  
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor(grayText).font("Helvetica-Bold").text("Primary Diagnosis: ", { continued: true });
  doc.fillColor(brandDark).font("Helvetica").text(prescription.diagnosis || "No primary diagnosis recorded");
  
  doc.moveDown(1.5);
  
  // --- Medications Table ---
  doc.fontSize(11).fillColor(brandDark).font("Helvetica-Bold").text("Rx Medications Grid");
  doc.moveDown(0.8);

  // Table Headers
  const tableY = doc.y;
  doc.rect(50, tableY, 495, 20).fill("#f8fafc");
  doc.fillColor(brandDark).fontSize(9).font("Helvetica-Bold");
  doc.text("Medicine Name", 60, tableY + 6);
  doc.text("Dosage", 220, tableY + 6);
  doc.text("Frequency", 320, tableY + 6);
  doc.text("Duration", 450, tableY + 6);

  let itemY = tableY + 20;
  doc.font("Helvetica").fontSize(9).fillColor(brandDark);

  if (prescription.medicines && prescription.medicines.length > 0) {
    prescription.medicines.forEach((med) => {
      // Draw border bottom
      doc.strokeColor(borderLight).lineWidth(0.5).moveTo(50, itemY + 20).lineTo(545, itemY + 20).stroke();
      
      doc.text(med.name, 60, itemY + 6);
      doc.text(med.dosage || "N/A", 220, itemY + 6);
      doc.text(med.frequency || "N/A", 320, itemY + 6);
      doc.text(med.duration || "N/A", 450, itemY + 6);
      
      itemY += 20;
    });
  } else {
    doc.strokeColor(borderLight).lineWidth(0.5).moveTo(50, itemY + 20).lineTo(545, itemY + 20).stroke();
    doc.text("No medications listed", 60, itemY + 6);
    itemY += 20;
  }

  doc.y = itemY + 15;
  doc.moveDown(1);

  // --- Notes & Follow-up ---
  const followUpY = doc.y;
  doc.fontSize(10).fillColor(brandDark).font("Helvetica-Bold").text("Clinical Notes / Instructions", 50, followUpY);
  doc.fontSize(9).fillColor(grayText).font("Helvetica").text(prescription.notes || "Take medicines as directed. Drink warm fluids.");

  doc.fontSize(10).fillColor(brandDark).font("Helvetica-Bold").text("Follow-Up Booking", rightColumnX, followUpY);
  const dateStr = prescription.followUpDate ? new Date(prescription.followUpDate).toLocaleDateString() : "No follow-up scheduled";
  doc.fontSize(9).fillColor(grayText).font("Helvetica").text(`Scheduled Date: ${dateStr}`);

  // --- Signature Block ---
  doc.moveDown(4);
  const signatureY = doc.y;
  doc.strokeColor(borderLight).lineWidth(0.5).moveTo(350, signatureY).lineTo(540, signatureY).stroke();
  doc.fontSize(10).fillColor(brandDark).font("Helvetica-Bold").text(`Dr. ${prescription.doctorId?.name}`, 380, signatureY + 8);
  doc.fontSize(8).fillColor(grayText).font("Helvetica").text("Digitally Signed (Aayu OS)", 385, signatureY + 20);

  // End document
  doc.end();
});
