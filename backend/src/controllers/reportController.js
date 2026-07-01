import axios from "axios";
import Patient from "../models/Patient.js";
import Report from "../models/Report.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { extractTextFromBuffer } from "../services/ocrService.js";
import { generateReportSummary, parseMedicalReport } from "../services/aiSummaryService.js";
import {
  extractKnownParametersFromText,
  generateStructuredFallbackSummary,
  hasMeaningfulParameters,
  isInsufficientSummary,
} from "../services/reportAnalysisService.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import cloudinary from "../config/cloudinary.js";

const logReportPipeline = (label, value) => {
  if (process.env.DEBUG_REPORT_PIPELINE !== "false") {
    console.log(`[ReportPipeline] ${label}:`, value);
  }
};

const repairStaleSummaries = async (reports = []) => {
  const staleReports = reports.filter((report) => (
    hasMeaningfulParameters(report.parsedData)
    && isInsufficientSummary(report.aiSummary)
  ));

  await Promise.all(staleReports.map(async (report) => {
    report.aiSummary = generateStructuredFallbackSummary({
      reportType: report.reportType,
      parsedData: report.parsedData,
    });
    await report.save();
  }));
};

const getSignedOriginalUrl = (report) => {
  const isRaw = report.fileResourceType === "raw" || report.fileUrl?.includes("/raw/upload/");
  if (!isRaw) return report.fileUrl;

  let publicId = report.filePublicId;
  if (!publicId) {
    const pathname = new URL(report.fileUrl).pathname;
    publicId = decodeURIComponent(pathname.replace(/^.*\/raw\/upload\/(?:v\d+\/)?/, "")).replace(/^\//, "");
  }

  return cloudinary.utils.private_download_url(publicId, "", {
    resource_type: "raw",
    type: "upload",
    attachment: false,
    expires_at: Math.floor(Date.now() / 1000) + 300,
  });
};

/**
 * Upload a medical report.
 * Flow: Upload -> OCR -> Parameter Parsing -> Structured AI Summary -> Save -> Response
 */
export const uploadReport = asyncHandler(async (req, res) => {
  const { patientId, reportType } = req.body;
  const file = req.file;

  if (!file) {
    throw new ApiError(400, "Report file is required");
  }

  if (!patientId || !reportType) {
    throw new ApiError(400, "Patient ID and report type are required");
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  const isPdf = file.mimetype === "application/pdf" || file.originalname?.toLowerCase().endsWith(".pdf");
  const resourceType = isPdf ? "raw" : "auto";
  const [uploadResult, extractionResult] = await Promise.allSettled([
    uploadToCloudinary(file.buffer, "medai-reports", resourceType, file.originalname),
    extractTextFromBuffer(file.buffer, file.mimetype, file.originalname),
  ]);

  if (uploadResult.status === "rejected") {
    console.error("Cloudinary upload failed:", uploadResult.reason);
    throw new ApiError(500, "Failed to upload report to Cloudinary");
  }

  let extractedText = extractionResult.status === "fulfilled" ? extractionResult.value : "";
  if (extractionResult.status === "rejected") {
    console.error("Text extraction failed:", extractionResult.reason);
  }
  logReportPipeline("OCR output", extractedText || "(no text extracted)");

  let parsedData = { parameters: [] };
  try {
    parsedData = await parseMedicalReport(extractedText, reportType);
  } catch (parseError) {
    console.error("AI report parsing failed:", parseError);
  }

  if (!hasMeaningfulParameters(parsedData)) {
    parsedData = {
      ...parsedData,
      parameters: extractKnownParametersFromText(extractedText, reportType),
    };
  }
  logReportPipeline("Parsed parameters", parsedData);

  const aiSummary = await generateReportSummary({ reportType, parsedData, extractedText });

  const report = await Report.create({
    patientId,
    uploadedBy: req.user?._id,
    reportType,
    fileUrl: uploadResult.value.secure_url,
    fileName: file.originalname,
    fileMimeType: file.mimetype,
    filePublicId: uploadResult.value.public_id,
    fileResourceType: uploadResult.value.resource_type || resourceType,
    extractedText,
    aiSummary,
    parsedData,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, report, "Report uploaded and processed successfully"));
});

export const getReportsByPatient = asyncHandler(async (req, res) => {
  if (req.user.role === "patient" && req.params.patientId !== req.user.patientId.toString()) {
    throw new ApiError(403, "You can only view your own reports");
  }

  if (req.user.role === "doctor") {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient || !patient.assignedDoctor || patient.assignedDoctor.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to view reports for this patient");
    }
  }

  const reports = await Report.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
  await repairStaleSummaries(reports);

  return res
    .status(200)
    .json(new ApiResponse(200, reports || [], "Reports fetched successfully"));
});

export const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate("patientId", "fullName phone age gender");

  if (!report) {
    throw new ApiError(404, "Medical report not found");
  }

  if (req.user.role === "patient" && (report.patientId._id || report.patientId).toString() !== req.user.patientId.toString()) {
    throw new ApiError(403, "You can only view your own reports");
  }

  if (req.user.role === "doctor") {
    const patient = await Patient.findById(report.patientId);
    if (!patient || !patient.assignedDoctor || patient.assignedDoctor.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to view this report");
    }
  }

  await repairStaleSummaries([report]);

  return res
    .status(200)
    .json(new ApiResponse(200, report, "Medical report fetched successfully"));
});

export const getAllReports = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user.role === "patient") {
    query.patientId = req.user.patientId;
  } else if (req.user.role === "doctor") {
    const patients = await Patient.find({ assignedDoctor: req.user._id }).select("_id");
    const patientIds = patients.map((p) => p._id);
    query.patientId = { $in: patientIds };
  }

  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .populate("patientId", "fullName phone age gender");
  await repairStaleSummaries(reports);

  return res
    .status(200)
    .json(new ApiResponse(200, reports || [], "All master reports fetched successfully"));
});

/**
 * Proxy the original report with reliable inline content headers.
 */
export const getOriginalReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new ApiError(404, "Medical report not found");
  }

  if (req.user.role === "patient" && (report.patientId._id || report.patientId).toString() !== req.user.patientId.toString()) {
    throw new ApiError(403, "You can only view your own reports");
  }

  if (req.user.role === "doctor") {
    const patient = await Patient.findById(report.patientId);
    if (!patient || !patient.assignedDoctor || patient.assignedDoctor.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to view this report file");
    }
  }

  try {
    const upstream = await axios.get(getSignedOriginalUrl(report), {
      responseType: "stream",
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 300,
    });
    const contentType = report.fileMimeType && report.fileMimeType !== "application/octet-stream"
      ? report.fileMimeType
      : upstream.headers["content-type"] || "application/octet-stream";
    const safeName = (report.fileName || `report-${report._id}`).replace(/["\r\n]/g, "_");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
    if (upstream.headers["content-length"]) {
      res.setHeader("Content-Length", upstream.headers["content-length"]);
    }
    upstream.data.pipe(res);
  } catch (error) {
    console.error("Original report delivery failed:", error?.response?.status || error.message);
    throw new ApiError(502, "Original report is currently unavailable");
  }
});
