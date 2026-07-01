import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
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
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date and time are required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "scheduled", "rescheduled", "cancelled", "completed"],
      default: "scheduled",
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: "General Checkup",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
