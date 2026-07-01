import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
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
      index: true,
    },
    visitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visit",
      index: true,
    },
    symptoms: {
      type: String,
      trim: true,
      default: "",
    },
    diagnosis: {
      type: String,
      trim: true,
      default: "",
    },
    medicines: [
      {
        name: {
          type: String,
          required: [true, "Medicine name is required"],
          trim: true,
        },
        dosage: {
          type: String,
          trim: true,
          default: "",
        },
        frequency: {
          type: String,
          trim: true,
          default: "",
        },
        duration: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    followUpDate: {
      type: Date,
    },
    followUpStatus: {
      type: String,
      enum: ["scheduled", "completed", "missed"],
      default: "scheduled",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes to speed up queries
prescriptionSchema.index({ createdAt: -1 });

export default mongoose.model("Prescription", prescriptionSchema);
