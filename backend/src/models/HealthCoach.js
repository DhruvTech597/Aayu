import mongoose from "mongoose";

const healthCoachSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      unique: true,
      index: true,
    },
    dailyTasks: [
      {
        task: { type: String, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      }
    ],
    weeklyGoals: [
      {
        goal: { type: String, required: true },
        completed: { type: Boolean, default: false },
      }
    ],
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    healthScoreHistory: [
      {
        score: { type: Number, required: true },
        date: { type: Date, default: Date.now },
      }
    ],
    badges: {
      type: [String],
      default: [], // e.g. "Hydration Hero", "Step Master"
    }
  },
  { timestamps: true }
);

export default mongoose.model("HealthCoach", healthCoachSchema);
