import Groq from "groq-sdk";
import dotenv from "dotenv";
import {
  buildStructuredReportPrompt,
  generateStructuredFallbackSummary,
  hasMeaningfulParameters,
  isInsufficientSummary,
} from "./reportAnalysisService.js";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const logReportPipeline = (label, value) => {
  if (process.env.DEBUG_REPORT_PIPELINE !== "false") {
    console.log(`[ReportPipeline] ${label}:`, value);
  }
};

/**
 * AI Summary Service to generate medical summaries
 */
export const generateMedicalSummary = async (text, context = "") => {
  try {
    const prompt = `
      You are a senior medical AI assistant. Analyze the following medical report text and provide a concise, doctor-friendly summary.
      
      Context: ${context}
      Report Text: ${text}
      
      Please provide the output in the following structured format:
      - Key Findings: (Main observations)
      - Abnormal Values: (List any values outside normal range)
      - Risks: (Potential health risks identified)
      - Recommendations: (Suggested next steps or tests)
      
      Keep it professional, concise, and avoid hallucinations. If the text is insufficient, state that clearly.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    return chatCompletion.choices[0]?.message?.content || "No summary could be generated.";
  } catch (error) {
    console.error("AI Summary Error:", error);
    return "AI Summary currently unavailable. Please review the report manually.";
  }
};

/**
 * Generate a report summary from authoritative structured parameters.
 */
export const generateReportSummary = async ({ reportType, parsedData, extractedText }) => {
  const fallback = generateStructuredFallbackSummary({ reportType, parsedData });
  if (!hasMeaningfulParameters(parsedData)) {
    return fallback;
  }

  const prompt = buildStructuredReportPrompt({ reportType, parsedData, extractedText });
  logReportPipeline("Prompt sent to Groq", prompt);

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a cautious clinical decision-support assistant. Use only the supplied structured laboratory data.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    const content = chatCompletion.choices[0]?.message?.content?.trim() || "";
    logReportPipeline("Raw AI response", content);
    return isInsufficientSummary(content) ? fallback : content;
  } catch (error) {
    console.error("AI Report Summary Error:", error);
    return fallback;
  }
};

/**
 * AI Parser Service to convert raw report text into structured JSON parameters
 */
export const parseMedicalReport = async (text, reportType = "") => {
  if (!text) {
    return { parameters: [] };
  }
  
  try {
    const prompt = `
      You are a senior medical AI extraction assistant. Extract all clinical laboratory parameters and metadata from the following raw report text.
      
      Report Type: ${reportType}
      Report Text: ${text}
      
      You MUST respond with a valid JSON object matching the following structure. Do NOT include any markdown framing, comments, or extra text. Output ONLY valid JSON:
      {
        "patientName": "Name if found, else null",
        "reportDate": "Date of report in YYYY-MM-DD format if found, else null",
        "testName": "Overall test or panel name, e.g., Complete Blood Count",
        "laboratory": "Lab name if found, else null",
        "parameters": [
          {
            "name": "Parameter name, e.g., Hemoglobin",
            "value": "Measured value, e.g., 14.2",
            "unit": "Unit, e.g., g/dL",
            "referenceRange": "Reference range, e.g., 12.0 - 16.0",
            "status": "Normal"
          }
        ]
      }
      
      Ensure "status" is either "Normal", "High", "Low", or "Unknown" depending on whether the value is inside or outside the referenceRange.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    const content = chatCompletion.choices[0]?.message?.content || "{}";
    logReportPipeline("Raw AI parser response", content);
    
    let cleanJson = content.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Report Parsing Error:", error);
    return {
      error: "Parsing service temporarily unavailable",
      parameters: []
    };
  }
};
