import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { syncCompletedAppointment } from "../services/followUpSyncService.js";

/**
 * Create a new appointment
 */
export const createAppointment = asyncHandler(async (req, res) => {
  const { patientId, doctorId, appointmentDate, reason, notes } = req.body;

  if (!patientId || !doctorId || !appointmentDate) {
    throw new ApiError(400, "Patient, Doctor, and Appointment Date are required");
  }

  if (req.user.role === "patient" && patientId !== req.user.patientId.toString()) {
    throw new ApiError(403, "You can only book appointments for yourself");
  }

  // Validate patient
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, "Patient not found");
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

  // Validate doctor
  const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
  if (!doctor) {
    throw new ApiError(404, "Doctor not found or invalid role");
  }

  const isPatient = req.user.role === "patient";
  const defaultStatus = isPatient ? "pending" : "scheduled";

  const appointment = await Appointment.create({
    patientId,
    doctorId,
    appointmentDate: new Date(appointmentDate),
    reason: reason || "General Checkup",
    notes: notes || "",
    status: defaultStatus,
  });

  const createdAppointment = await Appointment.findById(appointment._id)
    .populate("patientId", "fullName phone age gender bloodGroup")
    .populate("doctorId", "name email specialization");

  return res
    .status(201)
    .json(new ApiResponse(201, createdAppointment, "Appointment booked successfully"));
});

/**
 * Get all appointments with rich filtering
 */
export const getAppointments = asyncHandler(async (req, res) => {
  const { status, doctorId, patientId, date, startDate, endDate } = req.query;

  const filter = {};

  if (status) filter.status = status;
  if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) filter.doctorId = doctorId;
  if (patientId && mongoose.Types.ObjectId.isValid(patientId)) filter.patientId = patientId;

  if (req.user.role === "patient") {
    filter.patientId = req.user.patientId;
  } else if (req.user.role === "doctor") {
    filter.doctorId = req.user._id;
  }

  // Filter by single day
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
  } else if (startDate || endDate) {
    filter.appointmentDate = {};
    if (startDate) filter.appointmentDate.$gte = new Date(startDate);
    if (endDate) filter.appointmentDate.$lte = new Date(endDate);
  }

  const appointments = await Appointment.find(filter)
    .populate("patientId", "fullName phone age gender bloodGroup abhaId")
    .populate("doctorId", "name email specialization availability")
    .sort({ appointmentDate: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, appointments || [], "Appointments fetched successfully"));
});

/**
 * Reschedule an appointment
 */
export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { appointmentDate, reason, notes } = req.body;

  if (!appointmentDate) {
    throw new ApiError(400, "New appointment date and time are required");
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (req.user.role === "patient" && appointment.patientId.toString() !== req.user.patientId.toString()) {
    throw new ApiError(403, "You can only manage your own appointments");
  }

  appointment.appointmentDate = new Date(appointmentDate);
  appointment.status = "rescheduled";
  if (reason) appointment.reason = reason;
  if (notes) appointment.notes = notes;

  await appointment.save();

  const updatedAppointment = await Appointment.findById(id)
    .populate("patientId", "fullName phone age gender")
    .populate("doctorId", "name email specialization");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedAppointment, "Appointment rescheduled successfully"));
});

/**
 * Cancel or update status of an appointment
 */
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["pending", "scheduled", "rescheduled", "cancelled", "completed"].includes(status)) {
    throw new ApiError(400, "Valid appointment status is required");
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (req.user.role === "patient" && appointment.patientId.toString() !== req.user.patientId.toString()) {
    throw new ApiError(403, "You can only manage your own appointments");
  }

  appointment.status = status;
  await appointment.save();
  await syncCompletedAppointment(appointment);

  return res
    .status(200)
    .json(new ApiResponse(200, appointment, `Appointment status updated to ${status} successfully`));
});
