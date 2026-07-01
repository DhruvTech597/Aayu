import Patient from "../models/Patient.js";
import Visit from "../models/Visit.js";
import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import PDFDocument from "pdfkit";

const AVERAGE_CONSULTATION_FEE = 500; // Standard Average Consultation Fee in INR

/**
 * Helper to build standard date filter matching objects
 */
const getDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  return filter;
};

/**
 * Get comprehensive analytics aggregated across the entire clinic with date filters
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  // --- 1. PATIENT ANALYTICS ---
  const totalPatients = await Patient.countDocuments(dateFilter);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const newPatientsThisMonth = await Patient.countDocuments({
    ...dateFilter,
    createdAt: { $gte: startOfMonth, ...(dateFilter.createdAt || {}) }
  });

  // Returning patients (patients with >= 2 visits within the date range)
  const returningMatch = dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {};
  const returning = await Visit.aggregate([
    { $match: returningMatch },
    { $group: { _id: "$patientId", count: { $sum: 1 } } },
    { $match: { count: { $gte: 2 } } },
    { $count: "count" }
  ]);
  const returningPatientsCount = returning[0]?.count || 0;

  // Growth rate calculation (Comparing this month to last month)
  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  const newPatientsLastMonth = await Patient.countDocuments({
    createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
  });

  const patientGrowthRate = newPatientsLastMonth === 0 
    ? (newPatientsThisMonth > 0 ? 100 : 0) 
    : parseFloat((((newPatientsThisMonth - newPatientsLastMonth) / newPatientsLastMonth) * 100).toFixed(2));

  // --- 2. DOCTOR ANALYTICS ---
  const totalDoctors = await User.countDocuments({ role: "doctor" });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Doctors who have created at least one visit in last 30 days
  const activeDoctorIds = await Visit.find({
    createdAt: { $gte: thirtyDaysAgo }
  }).distinct("doctorId");
  const activeDoctors = activeDoctorIds.length;

  // Consultations per doctor within date range
  const consultationsPerDoctor = await Visit.aggregate([
    { $match: returningMatch },
    { $group: { _id: "$doctorId", count: { $sum: 1 } } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "doctorInfo" } },
    { $unwind: "$doctorInfo" },
    { $project: { _id: 1, name: "$doctorInfo.name", email: "$doctorInfo.email", count: 1 } }
  ]);

  // Patients handled per doctor
  const patientsPerDoctor = await Visit.aggregate([
    { $match: returningMatch },
    { $group: { _id: "$doctorId", patientIds: { $addToSet: "$patientId" } } },
    { $project: { _id: 1, patientCount: { $size: "$patientIds" } } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "doctorInfo" } },
    { $unwind: "$doctorInfo" },
    { $project: { _id: 1, name: "$doctorInfo.name", patientCount: 1 } }
  ]);

  // --- 3. PRESCRIPTION & FOLLOW-UP ANALYTICS ---
  const prescriptionFilter = { isDeleted: false, ...dateFilter };
  const totalPrescriptions = await Prescription.countDocuments(prescriptionFilter);

  const mostPrescribedMedicines = await Prescription.aggregate([
    { $match: prescriptionFilter },
    { $unwind: "$medicines" },
    { $group: { _id: "$medicines.name", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Follow-up status statistics
  const scheduledFollowUps = await Prescription.countDocuments({ ...prescriptionFilter, followUpStatus: "scheduled" });
  const completedFollowUps = await Prescription.countDocuments({ ...prescriptionFilter, followUpStatus: "completed" });
  const missedFollowUps = await Prescription.countDocuments({ ...prescriptionFilter, followUpStatus: "missed" });

  // --- 4. VISIT & REVENUE ANALYTICS ---
  const dailyVisits = await Visit.countDocuments({ ...dateFilter, createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 1)), ...(dateFilter.createdAt || {}) } });
  const weeklyVisits = await Visit.countDocuments({ ...dateFilter, createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)), ...(dateFilter.createdAt || {}) } });
  const monthlyVisits = await Visit.countDocuments({ ...dateFilter, createdAt: { $gte: startOfMonth, ...(dateFilter.createdAt || {}) } });

  const totalConsultations = await Visit.countDocuments(dateFilter);
  const estimatedRevenue = totalConsultations * AVERAGE_CONSULTATION_FEE;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        patients: {
          totalPatients,
          newPatientsThisMonth,
          returningPatients: returningPatientsCount,
          patientGrowthRate
        },
        doctors: {
          totalDoctors,
          activeDoctors,
          consultationsPerDoctor,
          patientsPerDoctor
        },
        prescriptions: {
          totalPrescriptions,
          mostPrescribedMedicines,
          followUps: {
            scheduled: scheduledFollowUps,
            completed: completedFollowUps,
            missed: missedFollowUps
          }
        },
        visits: {
          dailyVisits,
          weeklyVisits,
          monthlyVisits,
          totalConsultations
        },
        revenue: {
          estimatedRevenue,
          averageConsultationFee: AVERAGE_CONSULTATION_FEE
        }
      },
      "Clinic analytics compiled successfully"
    )
  );
});

/**
 * Get core and growth clinic KPIs with date filters & Revenue Estimations
 */
export const getKPIs = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  const totalPatients = await Patient.countDocuments(dateFilter);
  const totalDoctors = await User.countDocuments({ role: "doctor" });
  const totalConsultations = await Visit.countDocuments(dateFilter);
  const totalPrescriptions = await Prescription.countDocuments({ isDeleted: false, ...dateFilter });

  // Revenue estimation
  const estimatedRevenue = totalConsultations * AVERAGE_CONSULTATION_FEE;

  // Retention rate: % of total patients who are returning patients (>= 2 visits)
  const returningMatch = dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {};
  const returning = await Visit.aggregate([
    { $match: returningMatch },
    { $group: { _id: "$patientId", count: { $sum: 1 } } },
    { $match: { count: { $gte: 2 } } },
    { $count: "count" }
  ]);
  const returningCount = returning[0]?.count || 0;
  const patientRetentionRate = totalPatients > 0 
    ? parseFloat(((returningCount / totalPatients) * 100).toFixed(2)) 
    : 0;

  const averageVisitsPerPatient = totalPatients > 0 
    ? parseFloat((totalConsultations / totalPatients).toFixed(2)) 
    : 0;

  // Follow-up status statistics
  const scheduledFollowUps = await Prescription.countDocuments({ isDeleted: false, ...dateFilter, followUpStatus: "scheduled" });
  const completedFollowUps = await Prescription.countDocuments({ isDeleted: false, ...dateFilter, followUpStatus: "completed" });
  const missedFollowUps = await Prescription.countDocuments({ isDeleted: false, ...dateFilter, followUpStatus: "missed" });
  
  const totalFollowUps = scheduledFollowUps + completedFollowUps + missedFollowUps;
  const followUpCompletionRate = totalFollowUps > 0
    ? parseFloat(((completedFollowUps / totalFollowUps) * 100).toFixed(2))
    : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalPatients,
        totalDoctors,
        totalConsultations,
        totalPrescriptions,
        patientRetentionRate,
        averageVisitsPerPatient,
        followUpCompletionRate,
        estimatedRevenue,
        averageConsultationFee: AVERAGE_CONSULTATION_FEE,
        followUps: {
          scheduled: scheduledFollowUps,
          completed: completedFollowUps,
          missed: missedFollowUps
        }
      },
      "Clinic KPIs fetched successfully"
    )
  );
});

/**
 * Get ready-to-render chart data streams with custom date range and daily/weekly/monthly grouping
 */
export const getChartData = asyncHandler(async (req, res) => {
  const { range = "30d", startDate, endDate, groupBy = "daily" } = req.query;

  let daysToFetch = 30;
  if (range === "7d") daysToFetch = 7;
  else if (range === "90d") daysToFetch = 90;
  else if (range === "1y") daysToFetch = 365;

  let computedStartDate = new Date();
  computedStartDate.setDate(computedStartDate.getDate() - daysToFetch);
  computedStartDate.setHours(0, 0, 0, 0);

  if (startDate) computedStartDate = new Date(startDate);
  const finalEndDate = endDate ? new Date(endDate) : new Date();

  const chartFilter = {
    createdAt: { $gte: computedStartDate, $lte: finalEndDate }
  };

  // Group formatting logic
  let formatString = "%Y-%m-%d"; // default daily
  if (groupBy === "weekly") {
    formatString = "%Y-W%U";
  } else if (groupBy === "monthly") {
    formatString = "%Y-%m";
  }

  // --- 1. Patient Growth Chart Data ---
  const patientsTimeline = await Patient.aggregate([
    { $match: chartFilter },
    {
      $group: {
        _id: { $dateToString: { format: formatString, date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } }
  ]);

  // --- 2. Consultation (Visits) Trend Chart Data ---
  const consultationsTimeline = await Visit.aggregate([
    { $match: chartFilter },
    {
      $group: {
        _id: { $dateToString: { format: formatString, date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } }
  ]);

  // --- 3. Prescription Trend Chart Data ---
  const prescriptionsTimeline = await Prescription.aggregate([
    { $match: { ...chartFilter, isDeleted: false } },
    {
      $group: {
        _id: { $dateToString: { format: formatString, date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } }
  ]);

  // --- 4. Doctor Performance Chart Data ---
  const doctorPerformance = await Visit.aggregate([
    { $match: chartFilter },
    {
      $group: {
        _id: "$doctorId",
        totalConsultations: { $sum: 1 },
        patientIds: { $addToSet: "$patientId" }
      }
    },
    {
      $project: {
        doctorId: "$_id",
        totalConsultations: 1,
        uniquePatients: { $size: "$patientIds" },
        _id: 0
      }
    },
    { $lookup: { from: "users", localField: "doctorId", foreignField: "_id", as: "doctorInfo" } },
    { $unwind: "$doctorInfo" },
    { $project: { name: "$doctorInfo.name", uniquePatients: 1, totalConsultations: 1 } }
  ]);

  // --- 5. Follow-up Analytics Chart Data ---
  const followUpTimeline = await Prescription.aggregate([
    { 
      $match: { 
        followUpDate: { $gte: computedStartDate, $lte: finalEndDate }, 
        isDeleted: false 
      } 
    },
    {
      $group: {
        _id: { $dateToString: { format: formatString, date: "$followUpDate" } },
        scheduled: { $sum: { $cond: [{ $eq: ["$followUpStatus", "scheduled"] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ["$followUpStatus", "completed"] }, 1, 0] } },
        missed: { $sum: { $cond: [{ $eq: ["$followUpStatus", "missed"] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", scheduled: 1, completed: 1, missed: 1, _id: 0 } }
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        patientGrowth: patientsTimeline,
        consultationTrends: consultationsTimeline,
        prescriptionTrends: prescriptionsTimeline,
        doctorPerformance,
        followUpAnalytics: followUpTimeline
      },
      "Clinic chart timelines loaded successfully"
    )
  );
});

/**
 * GET /api/owner/dashboard
 * Return stats, charts, KPIs, and recent activity in a single response to reduce frontend API calls
 */
export const getOwnerDashboard = asyncHandler(async (req, res) => {
  const { range = "30d", startDate, endDate, groupBy = "daily" } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  // 1. KPIs & Revenue Calculations
  const totalPatients = await Patient.countDocuments(dateFilter);
  const totalDoctors = await User.countDocuments({ role: "doctor" });
  const totalConsultations = await Visit.countDocuments(dateFilter);
  const totalPrescriptions = await Prescription.countDocuments({ isDeleted: false, ...dateFilter });
  const estimatedRevenue = totalConsultations * AVERAGE_CONSULTATION_FEE;

  const returningMatch = dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {};
  const returning = await Visit.aggregate([
    { $match: returningMatch },
    { $group: { _id: "$patientId", count: { $sum: 1 } } },
    { $match: { count: { $gte: 2 } } },
    { $count: "count" }
  ]);
  const returningCount = returning[0]?.count || 0;
  const patientRetentionRate = totalPatients > 0 
    ? parseFloat(((returningCount / totalPatients) * 100).toFixed(2)) 
    : 0;

  const averageVisitsPerPatient = totalPatients > 0 
    ? parseFloat((totalConsultations / totalPatients).toFixed(2)) 
    : 0;

  const scheduledFollowUps = await Prescription.countDocuments({ isDeleted: false, ...dateFilter, followUpStatus: "scheduled" });
  const completedFollowUps = await Prescription.countDocuments({ isDeleted: false, ...dateFilter, followUpStatus: "completed" });
  const missedFollowUps = await Prescription.countDocuments({ isDeleted: false, ...dateFilter, followUpStatus: "missed" });
  
  const totalFollowUps = scheduledFollowUps + completedFollowUps + missedFollowUps;
  const followUpCompletionRate = totalFollowUps > 0
    ? parseFloat(((completedFollowUps / totalFollowUps) * 100).toFixed(2))
    : 0;

  // 2. Fetch Chart Data inline using the exact parameters
  let daysToFetch = 30;
  if (range === "7d") daysToFetch = 7;
  else if (range === "90d") daysToFetch = 90;
  else if (range === "1y") daysToFetch = 365;

  let computedStartDate = new Date();
  computedStartDate.setDate(computedStartDate.getDate() - daysToFetch);
  computedStartDate.setHours(0, 0, 0, 0);
  if (startDate) computedStartDate = new Date(startDate);
  const finalEndDate = endDate ? new Date(endDate) : new Date();

  const chartFilter = {
    createdAt: { $gte: computedStartDate, $lte: finalEndDate }
  };

  let formatString = "%Y-%m-%d";
  if (groupBy === "weekly") formatString = "%Y-W%U";
  else if (groupBy === "monthly") formatString = "%Y-%m";

  const patientGrowth = await Patient.aggregate([
    { $match: chartFilter },
    { $group: { _id: { $dateToString: { format: formatString, date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } }
  ]);

  const consultationTrends = await Visit.aggregate([
    { $match: chartFilter },
    { $group: { _id: { $dateToString: { format: formatString, date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } }
  ]);

  const prescriptionTrends = await Prescription.aggregate([
    { $match: { ...chartFilter, isDeleted: false } },
    { $group: { _id: { $dateToString: { format: formatString, date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } }
  ]);

  const doctorPerformance = await Visit.aggregate([
    { $match: chartFilter },
    { $group: { _id: "$doctorId", totalConsultations: { $sum: 1 }, patientIds: { $addToSet: "$patientId" } } },
    { $project: { doctorId: "$_id", totalConsultations: 1, uniquePatients: { $size: "$patientIds" }, _id: 0 } },
    { $lookup: { from: "users", localField: "doctorId", foreignField: "_id", as: "doctorInfo" } },
    { $unwind: "$doctorInfo" },
    { $project: { name: "$doctorInfo.name", uniquePatients: 1, totalConsultations: 1 } }
  ]);

  const followUpAnalytics = await Prescription.aggregate([
    { $match: { followUpDate: { $gte: computedStartDate, $lte: finalEndDate }, isDeleted: false } },
    {
      $group: {
        _id: { $dateToString: { format: formatString, date: "$followUpDate" } },
        scheduled: { $sum: { $cond: [{ $eq: ["$followUpStatus", "scheduled"] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ["$followUpStatus", "completed"] }, 1, 0] } },
        missed: { $sum: { $cond: [{ $eq: ["$followUpStatus", "missed"] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", scheduled: 1, completed: 1, missed: 1, _id: 0 } }
  ]);

  // 3. Fetch Recent Activity Feed clinic-wide
  const recentVisits = await Visit.find(dateFilter)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("patientId", "fullName phone age gender")
    .populate("doctorId", "name");

  const recentRegistrations = await Patient.find(dateFilter)
    .sort({ createdAt: -1 })
    .limit(5);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        kpis: {
          totalPatients,
          totalDoctors,
          totalConsultations,
          totalPrescriptions,
          patientRetentionRate,
          averageVisitsPerPatient,
          followUpCompletionRate,
          estimatedRevenue,
          averageConsultationFee: AVERAGE_CONSULTATION_FEE
        },
        charts: {
          patientGrowth,
          consultationTrends,
          prescriptionTrends,
          doctorPerformance,
          followUpAnalytics
        },
        recentActivity: {
          recentVisits,
          recentRegistrations
        }
      },
      "Owner Dashboard data synchronized successfully"
    )
  );
});

/**
 * GET /api/owner/follow-ups
 * Fetch all prescriptions with follow-up details, with status filter
 */
export const getFollowUps = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { isDeleted: false, followUpDate: { $ne: null } };
  if (status) {
    filter.followUpStatus = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const followUps = await Prescription.find(filter)
    .populate("patientId", "fullName phone age gender bloodGroup")
    .populate("doctorId", "name email specialization")
    .sort({ followUpDate: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Prescription.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        followUps: followUps || [],
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
      "Follow-up records fetched successfully"
    )
  );
});

/**
 * PUT /api/owner/follow-ups/:id/status
 * Update the status of a scheduled follow-up
 */
export const updateFollowUpStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["scheduled", "completed", "missed"].includes(status)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid follow-up status"));
  }

  const prescription = await Prescription.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { followUpStatus: status, lastModifiedAt: new Date() } },
    { new: true }
  ).populate("patientId", "fullName phone");

  if (!prescription) {
    return res.status(404).json(new ApiResponse(404, null, "Follow-up record not found"));
  }

  return res.status(200).json(
    new ApiResponse(200, prescription, `Follow-up status transitioned to ${status} successfully`)
  );
});

/**
 * GET /api/owner/export/csv
 * Export clinic consults and financial metrics as a downloadable CSV file
 */
export const exportCSV = asyncHandler(async (req, res) => {
  const visits = await Visit.find()
    .populate("patientId", "fullName phone")
    .populate("doctorId", "name")
    .sort({ createdAt: -1 });

  let csvContent = "Visit ID,Date,Patient Name,Patient Phone,Doctor Assigned,Diagnosis,Estimated Fee (INR)\n";

  visits.forEach((v) => {
    const visitId = v._id.toString().toUpperCase();
    const date = new Date(v.createdAt).toLocaleDateString();
    const patientName = v.patientId?.fullName?.replace(/,/g, "") || "Jane Doe";
    const patientPhone = v.patientId?.phone || "N/A";
    const doctorName = v.doctorId?.name?.replace(/,/g, "") || "Dr. Alex House";
    const diagnosis = v.diagnosis?.replace(/,/g, "") || "General Consultation";
    const fee = AVERAGE_CONSULTATION_FEE;

    csvContent += `${visitId},${date},${patientName},${patientPhone},${doctorName},${diagnosis},${fee}\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=clinic-revenue-audit.csv");
  return res.status(200).send(csvContent);
});

/**
 * GET /api/owner/export/pdf
 * Export executive clinic performance metrics as a structured executive PDF report
 */
export const exportPDF = asyncHandler(async (req, res) => {
  // Aggregate KPIs inline for report accuracy
  const totalPatients = await Patient.countDocuments();
  const totalDoctors = await User.countDocuments({ role: "doctor" });
  const totalConsultations = await Visit.countDocuments();
  const estimatedRevenue = totalConsultations * AVERAGE_CONSULTATION_FEE;

  const doc = new PDFDocument({ margin: 50, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=executive-clinic-report.pdf");

  doc.pipe(res);

  // Colors
  const emeraldColor = "#10b981";
  const darkSlate = "#0f172a";
  const coolGray = "#64748b";

  // Header
  doc.fontSize(24).fillColor(emeraldColor).font("Helvetica-Bold").text("AAYU CLINICAL AUDIT REPORT", { align: "center" });
  doc.fontSize(10).fillColor(coolGray).font("Helvetica-Bold").text("EXECUTIVE OPERATIONS & FINANCIAL TELEMETRY", { align: "center" });
  
  doc.moveDown(2);
  doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1.5);

  // Executive summary introduction
  doc.fontSize(12).fillColor(darkSlate).font("Helvetica-Bold").text("Clinic Summary Overview");
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor(coolGray).font("Helvetica").text(
    `This compiled executive ledger audits the overall operational metrics, clinic scale, patient demographics, and billing revenue streams of Aayu Healthcare. Formulated on ${new Date().toLocaleString()}.`,
    { lineGap: 3 }
  );

  doc.moveDown(2);

  // Metrics Grid
  doc.fontSize(12).fillColor(darkSlate).font("Helvetica-Bold").text("Core Performance Indicators (KPIs)");
  doc.moveDown(1);

  const kpiY = doc.y;
  doc.rect(50, kpiY, 235, 60).fill("#f8fafc");
  doc.rect(300, kpiY, 245, 60).fill("#f8fafc");

  doc.fillColor(emeraldColor).fontSize(16).font("Helvetica-Bold").text(`₹${estimatedRevenue.toLocaleString()}`, 65, kpiY + 15);
  doc.fontSize(9).fillColor(coolGray).text("ESTIMATED CLINIC REVENUE", 65, kpiY + 38);

  doc.fillColor(emeraldColor).fontSize(16).font("Helvetica-Bold").text(totalPatients.toString(), 315, kpiY + 15);
  doc.fontSize(9).fillColor(coolGray).text("TOTAL PATIENT BASE", 315, kpiY + 38);

  doc.moveDown(5);
  
  const kpiY2 = doc.y;
  doc.rect(50, kpiY2, 235, 60).fill("#f8fafc");
  doc.rect(300, kpiY2, 245, 60).fill("#f8fafc");

  doc.fillColor(emeraldColor).fontSize(16).font("Helvetica-Bold").text(totalConsultations.toString(), 65, kpiY2 + 15);
  doc.fontSize(9).fillColor(coolGray).text("TOTAL CONSULTATIONS COMPLETED", 65, kpiY2 + 38);

  doc.fillColor(emeraldColor).fontSize(16).font("Helvetica-Bold").text(totalDoctors.toString(), 315, kpiY2 + 15);
  doc.fontSize(9).fillColor(coolGray).text("CLINICIAN RESIDENT STAFF", 315, kpiY2 + 38);

  doc.moveDown(5);
  doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1.5);

  // Details
  doc.fontSize(12).fillColor(darkSlate).font("Helvetica-Bold").text("Clinical Operations Registry");
  doc.moveDown(0.8);

  // List recent consults
  const visits = await Visit.find().populate("patientId", "fullName").sort({ createdAt: -1 }).limit(10);
  let itemY = doc.y;

  doc.fillColor(darkSlate).fontSize(9).font("Helvetica-Bold");
  doc.text("Date", 60, itemY);
  doc.text("Patient Name", 160, itemY);
  doc.text("Consultation Status", 320, itemY);
  doc.text("Audit Contribution", 450, itemY);

  itemY += 15;
  doc.font("Helvetica").fontSize(9);

  visits.forEach((v) => {
    doc.strokeColor("#f1f5f9").lineWidth(0.5).moveTo(50, itemY + 15).lineTo(545, itemY + 15).stroke();
    
    doc.fillColor(coolGray).text(new Date(v.createdAt).toLocaleDateString(), 60, itemY + 4);
    doc.fillColor(darkSlate).text(v.patientId?.fullName || "Jane Doe", 160, itemY + 4);
    doc.fillColor(v.status === "completed" ? emeraldColor : "#f59e0b").text(v.status?.toUpperCase() || "COMPLETED", 320, itemY + 4);
    doc.fillColor(darkSlate).text(`₹${AVERAGE_CONSULTATION_FEE}`, 450, itemY + 4);
    
    itemY += 15;
  });

  doc.end();
});
