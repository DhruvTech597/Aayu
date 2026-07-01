import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient ID is required"],
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor ID is required"],
    },
    symptoms: {
      type: String,
      trim: true,
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    prescription: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    uploadedReports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
      },
    ],
    aiSummary: {
      type: String,
      trim: true,
    },
    medicineConflicts: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["waiting", "in_consultation", "completed", "cancelled"],
      default: "waiting",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Visit", visitSchema);
