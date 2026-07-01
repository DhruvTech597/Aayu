import Visit from "../models/Visit.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * Get aggregated dashboard statistics for the logged-in doctor
 */
export const getDoctorStats = asyncHandler(async (req, res) => {
  const doctorId = req.user?._id;

  // 1. Patients Handled (assigned to doctor OR has a visit history with this doctor)
  const registeredCount = await Patient.find({ assignedDoctor: doctorId }).distinct("_id");
  const visitedCount = await Visit.find({ doctorId }).distinct("patientId");
  
  const uniquePatientIds = new Set([
    ...registeredCount.map(id => id.toString()),
    ...visitedCount.map(id => id.toString())
  ]);
  const totalPatients = uniquePatientIds.size;

  // 2. Today's appointments (visits created today by this doctor)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayAppointments = await Visit.countDocuments({
    doctorId,
    createdAt: { $gte: todayStart, $lte: todayEnd }
  });

  // 3. Consultations Completed (Visits)
  const consultationsCompleted = await Visit.countDocuments({ doctorId });

  // 4. Prescriptions Created (active)
  const totalPrescriptions = await Prescription.countDocuments({
    doctorId,
    isDeleted: false
  });

  // 5. Follow-ups Completed
  const followUpsCompleted = await Prescription.countDocuments({
    doctorId,
    isDeleted: false,
    followUpStatus: "completed"
  });

  // 6. Follow-up patients count (active future followups)
  const followUpPatientsCount = await Prescription.countDocuments({
    doctorId,
    isDeleted: false,
    followUpDate: { $gt: new Date() },
    followUpStatus: "scheduled"
  });

  // 7. Average consultations per day
  const dailyConsultations = await Visit.aggregate([
    { $match: { doctorId } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    }
  ]);
  const activeDays = dailyConsultations.length || 1;
  const avgConsultationsPerDay = parseFloat((consultationsCompleted / activeDays).toFixed(2));

  // 8. Recent patient visits (limit 5)
  const recentPatientVisits = await Visit.find({ doctorId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("patientId", "fullName phone age gender bloodGroup");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalPatients,
        patientsHandled: totalPatients,
        todayAppointments,
        consultationsCompleted,
        totalPrescriptions,
        prescriptionsCreated: totalPrescriptions,
        followUpsCompleted,
        followUpPatientsCount,
        avgConsultationsPerDay,
        recentPatientVisits
      },
      "Doctor dashboard statistics fetched successfully"
    )
  );
});

/**
 * Get doctor's recent activity feed (latest visits, prescriptions, registrations)
 */
export const getRecentActivity = asyncHandler(async (req, res) => {
  const doctorId = req.user?._id;

  // Latest consultations (visits) managed by this doctor
  const latestConsultations = await Visit.find({ doctorId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("patientId", "fullName phone age gender");

  // Latest prescriptions created by this doctor
  const latestPrescriptions = await Prescription.find({ doctorId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("patientId", "fullName phone");

  // Latest patient registrations relevant to this doctor (assigned to them)
  const latestRegistrations = await Patient.find({ assignedDoctor: doctorId })
    .sort({ createdAt: -1 })
    .limit(5);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        latestConsultations,
        latestPrescriptions,
        latestRegistrations
      },
      "Doctor activity feed fetched successfully"
    )
  );
});

/**
 * Update doctor profile details (specialization and availability settings)
 */
export const updateDoctorProfile = asyncHandler(async (req, res) => {
  const doctorId = req.user?._id;
  const { name, email, specialization, availability } = req.body;

  // Retrieve user
  const user = await User.findById(doctorId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Update properties if provided
  if (name) user.name = name;
  if (email) {
    // Check if other user is using this email
    const duplicateUser = await User.findOne({ email, _id: { $ne: doctorId } });
    if (duplicateUser) {
      throw new ApiError(409, "Email is already taken by another account");
    }
    user.email = email;
  }
  if (specialization !== undefined) user.specialization = specialization;
  if (availability !== undefined) {
    user.availability = {
      days: availability.days || user.availability?.days || [],
      hours: availability.hours || user.availability?.hours || ""
    };
  }

  await user.save();
  const updatedUser = await User.findById(doctorId).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Doctor profile updated successfully"));
});

/**
 * GET /api/doctor/dashboard
 * Return stats, recent activity, and profile in a single response to reduce frontend API calls
 */
export const getDoctorDashboard = asyncHandler(async (req, res) => {
  const doctorId = req.user?._id;

  // 1. Fetch Stats details inline
  const registeredCount = await Patient.find({ assignedDoctor: doctorId }).distinct("_id");
  const visitedCount = await Visit.find({ doctorId }).distinct("patientId");
  
  const uniquePatientIds = new Set([
    ...registeredCount.map(id => id.toString()),
    ...visitedCount.map(id => id.toString())
  ]);
  const totalPatients = uniquePatientIds.size;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayAppointments = await Visit.countDocuments({
    doctorId,
    createdAt: { $gte: todayStart, $lte: todayEnd }
  });

  const consultationsCompleted = await Visit.countDocuments({ doctorId });

  const totalPrescriptions = await Prescription.countDocuments({
    doctorId,
    isDeleted: false
  });

  const followUpsCompleted = await Prescription.countDocuments({
    doctorId,
    isDeleted: false,
    followUpStatus: "completed"
  });

  const followUpPatientsCount = await Prescription.countDocuments({
    doctorId,
    isDeleted: false,
    followUpDate: { $gt: new Date() },
    followUpStatus: "scheduled"
  });

  const dailyConsultations = await Visit.aggregate([
    { $match: { doctorId } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    }
  ]);
  const activeDays = dailyConsultations.length || 1;
  const avgConsultationsPerDay = parseFloat((consultationsCompleted / activeDays).toFixed(2));

  // 2. Fetch Recent Activities
  const latestConsultations = await Visit.find({ doctorId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("patientId", "fullName phone age gender");

  const latestPrescriptions = await Prescription.find({ doctorId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("patientId", "fullName phone");

  const latestRegistrations = await Patient.find({ assignedDoctor: doctorId })
    .sort({ createdAt: -1 })
    .limit(5);

  // 3. Fetch Doctor Profile
  const doctorProfile = await User.findById(doctorId).select("-password");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        stats: {
          patientsHandled: totalPatients,
          todayAppointments,
          consultationsCompleted,
          prescriptionsCreated: totalPrescriptions,
          followUpsCompleted,
          followUpPatientsCount,
          avgConsultationsPerDay
        },
        recentActivity: {
          latestConsultations,
          latestPrescriptions,
          latestRegistrations
        },
        profile: doctorProfile
      },
      "Doctor dashboard payload initialized successfully"
    )
  );
});

/**
 * Get all registered doctors in the system
 */
export const getAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await User.find({ role: "doctor" }).select("name email specialization availability");
  return res
    .status(200)
    .json(new ApiResponse(200, doctors, "Doctors fetched successfully"));
});
