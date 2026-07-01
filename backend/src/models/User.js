import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
        type: String,
        required: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
    },

    password: {
        type: String,
        required: true,
    },

    role: {
      type: String,
      enum: ["doctor", "admin", "receptionist", "patient"],
      default: "doctor",
      index: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      index: true,
    },

    specialization: {
      type: String,
      default: "",
      trim: true,
    },

    availability: {
      days: {
        type: [String],
        default: [],
      },
      hours: {
        type: String,
        default: "",
        trim: true,
      },
    },
    notificationSettings: {
      aiCriticalAlerts: {
        type: Boolean,
        default: true,
      },
      appointmentReminders: {
        type: Boolean,
        default: true,
      },
      systemUpdates: {
        type: Boolean,
        default: false,
      },
    },
    themePreference: {
      type: String,
      enum: ["light", "dark"],
      default: "dark",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);