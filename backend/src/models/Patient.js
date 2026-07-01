import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      index: true,
    },

    age: {
      type: Number,
      required: [true, "Age is required"],
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      index: true,
    },

    abhaId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    bloodGroup: {
      type: String,
      trim: true,
    },

    allergies: {
      type: [String],
      default: [],
    },

    chronicDiseases: {
      type: [String],
      default: [],
    },

    emergencyContact: {
      type: String,
      trim: true,
    },

    createdByClinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);