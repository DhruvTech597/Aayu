import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient ID is required"],
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor ID is required"],
    },

    symptoms: {
      type: String,
      required: [true, "Symptoms are required"],
    },

    diagnosis: String,

    prescription: String,

    reportUrl: {
      type: String, // Cloudinary secure_url
    },

    reportPublicId: {
      type: String, // Cloudinary public_id for deletion
    },

    aiSummary: {
      type: String,
      default: "AI Summary pending...",
    },
  },
  { timestamps: true }
);

export default mongoose.model("MedicalRecord", medicalRecordSchema);