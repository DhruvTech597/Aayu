import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatConversationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    messages: [chatMessageSchema],
  },
  { timestamps: true }
);

export default mongoose.model("ChatConversation", chatConversationSchema);
