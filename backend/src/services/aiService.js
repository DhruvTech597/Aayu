import Groq from "groq-sdk";
import dotenv from "dotenv";
import Patient from "../models/Patient.js";
import Visit from "../models/Visit.js";
import Prescription from "../models/Prescription.js";
import Report from "../models/Report.js";
import Appointment from "../models/Appointment.js";
import HealthCoach from "../models/HealthCoach.js";
import ChatConversation from "../models/ChatConversation.js";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MEDICAL_DISCLAIMER = "\n\n*AI-generated guidance only. Consult a qualified doctor for diagnosis or treatment.*";

/**
 * AI Module 1 – AI Health Summary ("Explain My Health")
 */
export const explainMyHealth = async (patientId, language = "English") => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error("Patient not found");

  const [visits, prescriptions, reports, appointments] = await Promise.all([
    Visit.find({ patientId }).populate("doctorId", "name"),
    Prescription.find({ patientId, isDeleted: false }).populate("doctorId", "name"),
    Report.find({ patientId }),
    Appointment.find({ patientId }).populate("doctorId", "name"),
  ]);

  // Compile medical context for LLM
  const contextData = {
    patientInfo: {
      name: patient.fullName,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      chronicDiseases: patient.chronicDiseases,
    },
    visits: visits.map(v => ({
      date: v.createdAt,
      doctor: v.doctorId?.name,
      diagnosis: v.diagnosis,
      symptoms: v.symptoms,
      notes: v.notes,
    })),
    prescriptions: prescriptions.map(p => ({
      date: p.createdAt,
      doctor: p.doctorId?.name,
      medicines: p.medicines,
    })),
    reports: reports.map(r => ({
      type: r.reportType,
      fileName: r.fileName,
      parameters: r.parsedData?.parameters || [],
    })),
    appointments: appointments.map(a => ({
      date: a.appointmentDate,
      doctor: a.doctorId?.name,
      reason: a.reason,
      status: a.status,
    })),
  };

  const prompt = `
    You are a senior medical AI assistant. Your task is to explain the patient's health condition and timeline in a plain-English, warm, patient-friendly manner.
    
    Translate the entire output into the requested language: ${language}.
    
    Here is the patient's compiled medical file:
    ${JSON.stringify(contextData, null, 2)}
    
    Generate your output in the following format:
    
    ### Health Overview
    [Provide a warm, reassuring summary of their overall health status based on visits, history, and reports]
    
    ### Current Conditions
    [Explain any chronic conditions or active diagnoses they have in simple terms]
    
    ### Medication Purpose
    [For each medicine they are currently taking in their prescriptions, explain in simple words why they are taking it and what it does]
    
    ### Lifestyle Suggestions
    [Provide 3-4 actionable lifestyle modifications, e.g. exercise, diet changes, sleep schedules, specific to their conditions]
    
    ### Follow-up Recommendations
    [Suggest next steps, upcoming appointments to attend, or future lab tests to book]
    
    ### Risk Level
    [State the overall risk level: Low, Moderate, or High, and a 1-sentence reason]
    
    Never diagnose, never claim certainty. Follow the exact headings above.
  `;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
  });

  return (response.choices[0]?.message?.content || "No health summary could be generated.") + MEDICAL_DISCLAIMER;
};

/**
 * AI Module 2 – Report Explainer
 */
export const explainReport = async (reportId, regenerate = false) => {
  const report = await Report.findById(reportId);
  if (!report) throw new Error("Report not found");

  if (!regenerate && report.aiExplanation) {
    return report.aiExplanation;
  }

  const parameters = report.parsedData?.parameters || [];
  const text = report.extractedText || "";

  const prompt = `
    You are a senior medical AI explainer. Analyze the following laboratory parameters and OCR text from a medical report. Explain the findings to the patient in simple, non-jargon language.
    
    Report Type: ${report.reportType}
    Parameters:
    ${JSON.stringify(parameters, null, 2)}
    
    Raw Extracted Text (for context):
    ${text.slice(0, 4000)}
    
    Provide your response under these exact headings:
    
    ### Report Summary
    [A brief summary of what this report is testing and the overall conclusion]
    
    ### Abnormal Values
    [Identify any parameters marked High or Low. Explain what these parameters represent and what the values mean]
    
    ### Normal Values
    [Reassuringly list parameters that are within normal range]
    
    ### Possible Medical Meaning
    [Explain the possible reasons for the findings. Write in a supportive, cautious tone. Do not diagnose]
    
    ### Recommended Follow-up
    [Actions the patient should take: diet recommendations, booking appointments, or repeating tests]
    
    Always remain cautious and recommend professional clinician correlation.
  `;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
  });

  const explanation = (response.choices[0]?.message?.content || "No explanation could be generated.") + MEDICAL_DISCLAIMER;
  
  report.aiExplanation = explanation;
  await report.save();

  return explanation;
};

/**
 * AI Module 3 – AI Symptom Checker
 */
export const checkSymptoms = async (symptoms, duration, age, gender) => {
  const prompt = `
    You are a senior medical AI symptom assessment tool. Evaluate the following symptoms to guide the patient on possible conditions and next steps.
    
    Symptoms: ${symptoms}
    Duration: ${duration}
    Age: ${age}
    Gender: ${gender}
    
    Provide your response in the following format:
    
    ### Possible Conditions
    [Explain 2-3 potential causes for these symptoms in a supportive, cautious tone]
    
    ### Severity Indicator
    [Provide a severity assessment: Low, Moderate, or High, explaining why]
    
    ### Recommended Action
    [Suggest immediate home care steps, clinical appointments, or emergency warnings if high severity]
    
    Strictly adhere to clinical safety guidelines. Never state a definitive diagnosis, always remind the patient that symptoms require clinical evaluation, and append the disclaimer.
  `;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
  });

  return (response.choices[0]?.message?.content || "Could not complete symptom check.") + MEDICAL_DISCLAIMER;
};

/**
 * AI Module 4 – Medication Assistant
 */
export const answerMedicationQuery = async (patientId, question) => {
  const prescriptions = await Prescription.find({ patientId, isDeleted: false });
  
  const activeMeds = prescriptions.flatMap(p => 
    p.medicines.map(m => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      notes: p.notes,
    }))
  );

  const prompt = `
    You are a patient's personal medication assistant. Answer their question about medications in simple, friendly, and plain language.
    
    Patient's Active Medications:
    ${JSON.stringify(activeMeds, null, 2)}
    
    Patient's Question:
    "${question}"
    
    Respond in simple words. If they ask about one of their active medications, provide context tailored to their active prescription. Explain what the medicine is used for, common side effects, and how they should take it based on active instructions.
  `;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
  });

  return (response.choices[0]?.message?.content || "No guidance available.") + MEDICAL_DISCLAIMER;
};

/**
 * AI Module 5 – Health Risk Predictor
 */
export const predictHealthRisks = async (patientId) => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error("Patient not found");

  const reports = await Report.find({ patientId });

  const recentBioData = reports.flatMap(r => r.parsedData?.parameters || []);

  const contextData = {
    age: patient.age,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    chronicDiseases: patient.chronicDiseases || [],
    allergies: patient.allergies || [],
    recentBiomarkers: recentBioData,
  };

  const prompt = `
    You are a senior clinical risk assessment engine. Analyze the patient profile and biomarkers to estimate metabolic and clinical health risks.
    
    Patient Data:
    ${JSON.stringify(contextData, null, 2)}
    
    Output exactly this format:
    
    ### Heart Risk
    Risk: [Low / Moderate / High]
    Reasoning: [State brief explainable reasoning based on age, gender, biomarkers or history]
    
    ### Diabetes Risk
    Risk: [Low / Moderate / High]
    Reasoning: [Reasoning based on blood sugar levels or history]
    
    ### Obesity Risk
    Risk: [Low / Moderate / High]
    Reasoning: [Reasoning based on BMI or physical stats]
    
    ### Hypertension Risk
    Risk: [Low / Moderate / High]
    Reasoning: [Reasoning based on blood pressure indicators or history]
    
    ### Prevention Steps
    - [Step 1]
    - [Step 2]
    - [Step 3]
    
    Be cautious, do not claim medical certainty, and explain the reasoning.
  `;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
  });

  return (response.choices[0]?.message?.content || "Risk assessment currently unavailable.") + MEDICAL_DISCLAIMER;
};

/**
 * AI Module 6 – AI Health Coach (Streak & Tasks Generator)
 */
export const getOrInitializeCoach = async (patientId) => {
  let coach = await HealthCoach.findOne({ patientId });
  
  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error("Patient not found");

  const today = new Date();
  today.setHours(0,0,0,0);

  // Helper to calculate health score based on metrics
  const calculateHealthScore = async () => {
    let score = 96;
    if (patient.chronicDiseases && patient.chronicDiseases.length > 0) {
      score -= patient.chronicDiseases.length * 8;
    }
    if (patient.allergies && patient.allergies.length > 0) {
      score -= patient.allergies.length * 4;
    }
    const reports = await Report.find({ patientId });
    let abnormalParamsCount = 0;
    reports.forEach(r => {
      const params = r.parsedData?.parameters || [];
      params.forEach(p => {
        if (p.status === "High" || p.status === "Low") {
          abnormalParamsCount++;
        }
      });
    });
    score -= abnormalParamsCount * 3;
    if (score < 50) score = 50;
    return score;
  };

  const currentScore = await calculateHealthScore();

  if (!coach) {
    coach = await HealthCoach.create({
      patientId,
      streak: 0,
      healthScoreHistory: [{ score: currentScore, date: new Date() }],
    });
  }

  // Check if daily tasks need a refresh (i.e. task list is empty or lastActiveDate is not today)
  const lastActive = coach.lastActiveDate ? new Date(coach.lastActiveDate) : null;
  if (lastActive) lastActive.setHours(0,0,0,0);

  if (!lastActive || lastActive < today || coach.dailyTasks.length === 0) {
    // Generate daily tasks and weekly goals using Groq
    const prompt = `
      You are an AI Health Coach. Generate exactly 3 personalized daily tasks and 2 weekly goals for this patient.
      Age: ${patient.age}
      Gender: ${patient.gender}
      Chronic Conditions: ${JSON.stringify(patient.chronicDiseases || [])}
      Health Score: ${currentScore}%
      
      Output ONLY a valid JSON object matching this schema. Do not output markdown, comments, or extra text:
      {
        "dailyTasks": ["Task 1 string", "Task 2 string", "Task 3 string"],
        "weeklyGoals": ["Goal 1 string", "Goal 2 string"]
      }
      
      Tasks must be actionable, small, and relevant (e.g. walk 4000 steps, drink 3 liters of water, check blood pressure, avoid sugary beverages).
    `;

    try {
      const response = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
      });

      let content = response.choices[0]?.message?.content || "{}";
      content = content.trim();
      if (content.startsWith("```json")) {
        content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (content.startsWith("```")) {
        content = content.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(content);
      
      coach.dailyTasks = (parsed.dailyTasks || []).map(task => ({ task, completed: false }));
      coach.weeklyGoals = (parsed.weeklyGoals || []).map(goal => ({ goal, completed: false }));
    } catch (err) {
      console.error("Coach Generation Error:", err);
      // Fallback defaults
      coach.dailyTasks = [
        { task: "Drink 3 liters of water today", completed: false },
        { task: "Walk 4000 steps after dinner", completed: false },
        { task: "Avoid processed sugar and high-sodium meals", completed: false }
      ];
      coach.weeklyGoals = [
        { goal: "Maintain a 5-day active walking streak", completed: false },
        { goal: "Track daily blood pressure readings", completed: false }
      ];
    }
  }

  // Update health score history to keep track of trends
  const hasScoreForToday = coach.healthScoreHistory.some(h => {
    const d = new Date(h.date);
    d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  });

  if (!hasScoreForToday) {
    coach.healthScoreHistory.push({ score: currentScore, date: new Date() });
    // Keep history clean (last 10 values)
    if (coach.healthScoreHistory.length > 10) {
      coach.healthScoreHistory.shift();
    }
  }

  await coach.save();
  return coach;
};

export const toggleCoachTask = async (patientId, taskId, completed) => {
  const coach = await HealthCoach.findOne({ patientId });
  if (!coach) throw new Error("Coach records not initialized");

  const task = coach.dailyTasks.id(taskId);
  if (!task) throw new Error("Task not found");

  task.completed = completed;
  task.completedAt = completed ? new Date() : undefined;

  // Calculate streaks: if all daily tasks are completed, increment streak
  const allCompleted = coach.dailyTasks.every(t => t.completed);
  const today = new Date();
  today.setHours(0,0,0,0);

  if (allCompleted) {
    const lastActive = coach.lastActiveDate ? new Date(coach.lastActiveDate) : null;
    if (lastActive) lastActive.setHours(0,0,0,0);

    if (!lastActive || lastActive < today) {
      coach.streak = (coach.streak || 0) + 1;
      coach.lastActiveDate = new Date();

      // Allocate badges based on streak levels
      if (coach.streak === 3 && !coach.badges.includes("Streak Starter")) {
        coach.badges.push("Streak Starter");
      }
      if (coach.streak === 7 && !coach.badges.includes("Consistency Champion")) {
        coach.badges.push("Consistency Champion");
      }
      if (coach.streak === 14 && !coach.badges.includes("Biometric Master")) {
        coach.badges.push("Biometric Master");
      }
    }
  } else {
    // If they uncheck a task and it was previously fully completed, decrement streak
    const lastActive = coach.lastActiveDate ? new Date(coach.lastActiveDate) : null;
    if (lastActive && lastActive.setHours(0,0,0,0) === today.getTime()) {
      coach.streak = Math.max(0, coach.streak - 1);
      coach.lastActiveDate = undefined;
    }
  }

  await coach.save();
  return coach;
};

/**
 * AI Module 7 – Multilingual Health Chatbot
 */
export const converseChatbot = async (patientId, message, language = "English") => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error("Patient not found");

  // Fetch clinical details for RAG context
  const [prescriptions, reports, appointments] = await Promise.all([
    Prescription.find({ patientId, isDeleted: false }),
    Report.find({ patientId }),
    Appointment.find({ patientId }).populate("doctorId", "name"),
  ]);

  const activeMeds = prescriptions.flatMap(p => p.medicines.map(m => m.name));
  const labReports = reports.map(r => r.reportType);
  const upAppts = appointments.filter(a => a.status === "scheduled").map(a => `${a.appointmentDate} with Dr. ${a.doctorId?.name}`);

  const clinicalContext = {
    fullName: patient.fullName,
    age: patient.age,
    gender: patient.gender,
    allergies: patient.allergies || [],
    chronicDiseases: patient.chronicDiseases || [],
    activeMedications: activeMeds,
    labReports: labReports,
    upcomingAppointments: upAppts,
  };

  // Find or create chat conversation
  let chat = await ChatConversation.findOne({ patientId });
  if (!chat) {
    chat = await ChatConversation.create({ patientId, messages: [] });
  }

  // Load last 10 messages for conversation context
  const historyMessages = chat.messages.slice(-10).map(m => ({
    role: m.role,
    content: m.content,
  }));

  const systemInstructions = `
    You are Aayu, a friendly clinical AI assistant on the MedAI Connect (Aayu OS) patient portal.
    Converse warmheartedly and answer the patient's questions about their health, report findings, or generic medical information.
    
    Translate all your messages into the requested language: ${language}.
    
    Patient Clinical File Context:
    ${JSON.stringify(clinicalContext, null, 2)}
    
    Instructions:
    - Base your answers on their clinical file when they ask about their active medications, allergies, appointments, or medical conditions.
    - Be supportive and clear. Keep replies concise and patient-friendly.
    - Do not diagnose, never prescribe remedies, and do not pretend to be a primary care doctor.
  `;

  const messagesPayload = [
    { role: "system", content: systemInstructions },
    ...historyMessages,
    { role: "user", content: message },
  ];

  const response = await groq.chat.completions.create({
    messages: messagesPayload,
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
  });

  const reply = (response.choices[0]?.message?.content || "I am here to support you, but I could not formulate a response.") + MEDICAL_DISCLAIMER;

  // Save conversation history
  chat.messages.push({ role: "user", content: message });
  chat.messages.push({ role: "assistant", content: reply });

  // Prevent memory leaks / keep messages database reasonable (last 50 messages)
  if (chat.messages.length > 50) {
    chat.messages = chat.messages.slice(-50);
  }

  await chat.save();

  return {
    reply,
    messages: chat.messages,
  };
};

export const getChatHistory = async (patientId) => {
  let chat = await ChatConversation.findOne({ patientId });
  if (!chat) {
    chat = await ChatConversation.create({ patientId, messages: [] });
  }
  return chat.messages;
};

export const clearChatHistory = async (patientId) => {
  const chat = await ChatConversation.findOne({ patientId });
  if (chat) {
    chat.messages = [];
    await chat.save();
  }
  return [];
};
