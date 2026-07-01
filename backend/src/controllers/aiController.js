import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Patient from "../models/Patient.js";
import * as aiService from "../services/aiService.js";

/**
 * AI Module 1 – Explain My Health Summary
 */
export const explainMyHealth = asyncHandler(async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    throw new ApiError(400, "Patient ID is not associated with this user account");
  }

  const { language = "English" } = req.query;

  const result = await aiService.explainMyHealth(patientId, language);

  return res.status(200).json(
    new ApiResponse(200, { summary: result }, "Health summary generated successfully")
  );
});

/**
 * AI Module 2 – Explain Lab Report
 */
export const explainReport = asyncHandler(async (req, res) => {
  const { reportId, regenerate = false } = req.body;

  if (!reportId) {
    throw new ApiError(400, "Report ID is required");
  }

  const result = await aiService.explainReport(reportId, regenerate);

  return res.status(200).json(
    new ApiResponse(200, { explanation: result }, "Report explanation generated successfully")
  );
});

/**
 * AI Module 3 – Symptom Checker
 */
export const checkSymptoms = asyncHandler(async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    throw new ApiError(400, "Patient ID is not associated with this user account");
  }

  const { symptoms, duration } = req.body;
  if (!symptoms || !duration) {
    throw new ApiError(400, "Symptoms and duration are required");
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, "Patient record not found");
  }

  const result = await aiService.checkSymptoms(
    symptoms,
    duration,
    patient.age,
    patient.gender
  );

  return res.status(200).json(
    new ApiResponse(200, { analysis: result }, "Symptom check completed successfully")
  );
});

/**
 * AI Module 4 – Medication Q&A
 */
export const answerMedicationQuery = asyncHandler(async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    throw new ApiError(400, "Patient ID is not associated with this user account");
  }

  const { question } = req.body;
  if (!question) {
    throw new ApiError(400, "Question is required");
  }

  const result = await aiService.answerMedicationQuery(patientId, question);

  return res.status(200).json(
    new ApiResponse(200, { answer: result }, "Medication query answered successfully")
  );
});

/**
 * AI Module 5 – Health Risk Predictor
 */
export const predictHealthRisks = asyncHandler(async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    throw new ApiError(400, "Patient ID is not associated with this user account");
  }

  const result = await aiService.predictHealthRisks(patientId);

  return res.status(200).json(
    new ApiResponse(200, { predictions: result }, "Health risks predicted successfully")
  );
});

/**
 * AI Module 6 – Health Coach Initialization / Status
 */
export const getCoachStatus = asyncHandler(async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    throw new ApiError(400, "Patient ID is not associated with this user account");
  }

  const coach = await aiService.getOrInitializeCoach(patientId);

  return res.status(200).json(
    new ApiResponse(200, coach, "Health coach status retrieved successfully")
  );
});

/**
 * AI Module 6 – Health Coach Task Toggle
 */
export const toggleCoachTask = asyncHandler(async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    throw new ApiError(400, "Patient ID is not associated with this user account");
  }

  const { taskId, completed } = req.body;
  if (!taskId || typeof completed === "undefined") {
    throw new ApiError(400, "Task ID and completed state are required");
  }

  const coach = await aiService.toggleCoachTask(patientId, taskId, completed);

  return res.status(200).json(
    new ApiResponse(200, coach, "Health coach task updated successfully")
  );
});

/**
 * AI Module 7 – Chatbot Conversation
 */
export const converseChatbot = asyncHandler(async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    throw new ApiError(400, "Patient ID is not associated with this user account");
  }

  const { message, language = "English" } = req.body;
  if (!message) {
    throw new ApiError(400, "Message is required");
  }

  const result = await aiService.converseChatbot(patientId, message, language);

  return res.status(200).json(
    new ApiResponse(200, result, "Chatbot response received successfully")
  );
});

/**
 * AI Module 7 – Chatbot History Retrieval
 */
export const getChatHistory = asyncHandler(async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    throw new ApiError(400, "Patient ID is not associated with this user account");
  }

  const history = await aiService.getChatHistory(patientId);

  return res.status(200).json(
    new ApiResponse(200, { messages: history }, "Chat history retrieved successfully")
  );
});

/**
 * AI Module 7 – Clear Chatbot History
 */
export const clearChatHistory = asyncHandler(async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    throw new ApiError(400, "Patient ID is not associated with this user account");
  }

  const history = await aiService.clearChatHistory(patientId);

  return res.status(200).json(
    new ApiResponse(200, { messages: history }, "Chat history cleared successfully")
  );
});
