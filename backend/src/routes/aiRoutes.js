import express from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";
import {
  explainMyHealth,
  explainReport,
  checkSymptoms,
  answerMedicationQuery,
  predictHealthRisks,
  getCoachStatus,
  toggleCoachTask,
  converseChatbot,
  getChatHistory,
  clearChatHistory,
} from "../controllers/aiController.js";

const router = express.Router();

// Enforce authentication and patient role authorization for all AI routes
router.use(verifyJWT);
router.use(authorizeRoles("patient"));

router.get("/explain-health", explainMyHealth);
router.post("/explain-report", explainReport);
router.post("/check-symptoms", checkSymptoms);
router.post("/medication-query", answerMedicationQuery);
router.get("/predict-risks", predictHealthRisks);
router.get("/coach", getCoachStatus);
router.post("/coach/task/toggle", toggleCoachTask);
router.post("/chat", converseChatbot);
router.get("/chat/history", getChatHistory);
router.delete("/chat/history", clearChatHistory);

export default router;
