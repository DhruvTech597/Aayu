import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient ID is required"],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploaded by user ID is required"],
    },
    reportType: {
      type: String,
      required: [true, "Report type is required"],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    fileName: {
      type: String,
      trim: true,
      default: "medical-report",
    },
    fileMimeType: {
      type: String,
      trim: true,
      default: "application/octet-stream",
    },
    filePublicId: {
      type: String,
      trim: true,
    },
    fileResourceType: {
      type: String,
      trim: true,
      default: "auto",
    },
    extractedText: {
      type: String,
      trim: true,
    },
    aiSummary: {
      type: String,
      trim: true,
    },
    aiExplanation: {
      type: String,
      trim: true,
    },
    parsedData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
