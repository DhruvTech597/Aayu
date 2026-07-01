const REPORT_TEMPLATES = [
  {
    matches: ["complete blood count", "cbc", "hemogram"],
    name: "CBC",
    focus: "Interpret hemoglobin, red-cell indices, white-cell count, and platelets. Comment on anemia, infection/inflammation, erythrocytosis, and bleeding risk only when supported by the values.",
  },
  {
    matches: ["lipid", "cholesterol"],
    name: "Lipid Profile",
    focus: "Interpret total cholesterol, LDL, HDL, triglycerides, and calculated ratios. Explain cardiovascular risk only from the supplied values.",
  },
  {
    matches: ["liver function", "lft", "hepatic"],
    name: "LFT",
    focus: "Interpret bilirubin, ALT, AST, ALP, GGT, albumin, and total protein. Distinguish hepatocellular, cholestatic, and synthetic-function patterns only when supported.",
  },
  {
    matches: ["kidney function", "renal", "kft"],
    name: "KFT",
    focus: "Interpret creatinine, eGFR, urea/BUN, uric acid, and electrolytes. Explain possible renal impairment or electrolyte disturbance only when supported.",
  },
  {
    matches: ["thyroid", "tsh", "t3", "t4"],
    name: "Thyroid",
    focus: "Interpret TSH with free or total T3/T4 and describe a thyroid pattern only when the supplied values support it.",
  },
  {
    matches: ["diabetes", "hba1c", "glucose", "blood sugar"],
    name: "Diabetes/HbA1c",
    focus: "Interpret HbA1c and glucose values. Explain glycemic control and follow-up needs only from supplied values.",
  },
];

const KNOWN_PARAMETERS = [
  { name: "Hemoglobin", aliases: ["hemoglobin", "haemoglobin", "hb"], unit: "g/dL", groups: ["CBC"] },
  { name: "White Blood Cell Count", aliases: ["white blood cell count", "wbc count", "wbc", "total leukocyte count", "tlc"], unit: "x10^9/L", groups: ["CBC"] },
  { name: "Red Blood Cell Count", aliases: ["red blood cell count", "rbc count", "rbc"], unit: "x10^12/L", groups: ["CBC"] },
  { name: "Platelet Count", aliases: ["platelet count", "platelets"], unit: "x10^9/L", groups: ["CBC"] },
  { name: "Mean Corpuscular Volume", aliases: ["mean corpuscular volume", "mcv"], unit: "fL", groups: ["CBC"] },
  { name: "Mean Corpuscular Hemoglobin", aliases: ["mean corpuscular hemoglobin", "mch"], unit: "pg", groups: ["CBC"] },
  { name: "Mean Corpuscular Hemoglobin Concentration", aliases: ["mean corpuscular hemoglobin concentration", "mchc"], unit: "g/dL", groups: ["CBC"] },
  { name: "Total Cholesterol", aliases: ["total cholesterol", "cholesterol total"], unit: "mg/dL", groups: ["Lipid Profile"] },
  { name: "LDL Cholesterol", aliases: ["ldl cholesterol", "ldl-c", "ldl"], unit: "mg/dL", groups: ["Lipid Profile"] },
  { name: "HDL Cholesterol", aliases: ["hdl cholesterol", "hdl-c", "hdl"], unit: "mg/dL", groups: ["Lipid Profile"] },
  { name: "Triglycerides", aliases: ["triglycerides", "triglyceride"], unit: "mg/dL", groups: ["Lipid Profile"] },
  { name: "ALT", aliases: ["alanine aminotransferase", "sgpt", "alt"], unit: "U/L", groups: ["LFT"] },
  { name: "AST", aliases: ["aspartate aminotransferase", "sgot", "ast"], unit: "U/L", groups: ["LFT"] },
  { name: "Bilirubin", aliases: ["total bilirubin", "bilirubin total", "bilirubin"], unit: "mg/dL", groups: ["LFT"] },
  { name: "Creatinine", aliases: ["serum creatinine", "creatinine"], unit: "mg/dL", groups: ["KFT"] },
  { name: "eGFR", aliases: ["estimated glomerular filtration rate", "egfr"], unit: "mL/min/1.73m2", groups: ["KFT"] },
  { name: "Urea", aliases: ["blood urea nitrogen", "bun", "urea"], unit: "mg/dL", groups: ["KFT"] },
  { name: "TSH", aliases: ["thyroid stimulating hormone", "tsh"], unit: "mIU/L", groups: ["Thyroid"] },
  { name: "T3", aliases: ["free t3", "total t3", "t3"], unit: "", groups: ["Thyroid"] },
  { name: "T4", aliases: ["free t4", "total t4", "t4"], unit: "", groups: ["Thyroid"] },
  { name: "HbA1c", aliases: ["glycated hemoglobin", "glycosylated hemoglobin", "hba1c"], unit: "%", groups: ["Diabetes/HbA1c"] },
  { name: "Glucose", aliases: ["fasting blood glucose", "fasting glucose", "blood glucose", "glucose"], unit: "mg/dL", groups: ["Diabetes/HbA1c"] },
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const numericValue = (value) => {
  const match = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

export const getReportTemplate = (reportType = "") => {
  const normalized = reportType.toLowerCase();
  return REPORT_TEMPLATES.find((template) => template.matches.some((match) => normalized.includes(match))) || {
    name: reportType || "General Laboratory Report",
    focus: "Interpret only the supplied measured values, statuses, units, and reference ranges. Do not infer missing results.",
  };
};

export const getMeaningfulParameters = (parsedData = {}) => {
  const parameters = Array.isArray(parsedData?.parameters) ? parsedData.parameters : [];
  return parameters.filter((parameter) => (
    parameter
    && String(parameter.name || "").trim()
    && String(parameter.value ?? "").trim()
  ));
};

export const hasMeaningfulParameters = (parsedData = {}) => getMeaningfulParameters(parsedData).length > 0;

export const isInsufficientSummary = (summary = "") => (
  !String(summary).trim()
  || /insufficient information|insufficient data|lacks specific laboratory results|no summary could be generated/i.test(summary)
);

const inferStatus = (value, low, high) => {
  if (value === null || low === null || high === null) return "Unknown";
  if (value < low) return "Low";
  if (value > high) return "High";
  return "Normal";
};

export const extractKnownParametersFromText = (text = "", reportType = "") => {
  if (!String(text).trim()) return [];

  const template = getReportTemplate(reportType);
  const lines = String(text).split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const definitions = KNOWN_PARAMETERS.filter((definition) => (
    template.name === "General Laboratory Report" || definition.groups.includes(template.name)
  ));

  return definitions.flatMap((definition) => {
    for (const line of lines) {
      const alias = definition.aliases.find((candidate) => new RegExp(`\\b${escapeRegExp(candidate)}\\b`, "i").test(line));
      if (!alias) continue;

      const afterName = line.slice(line.toLowerCase().indexOf(alias.toLowerCase()) + alias.length);
      const value = numericValue(afterName);
      if (value === null) continue;

      const rangeMatch = afterName.match(/(-?\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(-?\d+(?:\.\d+)?)/i);
      const low = rangeMatch ? Number(rangeMatch[1]) : null;
      const high = rangeMatch ? Number(rangeMatch[2]) : null;

      return [{
        name: definition.name,
        value: String(value),
        unit: definition.unit,
        referenceRange: rangeMatch ? `${rangeMatch[1]} - ${rangeMatch[2]}` : "",
        status: inferStatus(value, low, high),
      }];
    }
    return [];
  });
};

const describeRisk = (parameter) => {
  const name = String(parameter.name || "").toLowerCase();
  const status = String(parameter.status || "Unknown").toLowerCase();
  if (status === "normal" || status === "unknown") return null;

  if (name.includes("hemoglobin")) return status === "low" ? "The low hemoglobin may be consistent with anemia and needs clinical correlation." : "The high hemoglobin may reflect erythrocytosis or hemoconcentration and needs clinical correlation.";
  if (name.includes("white") || name === "wbc") return "The abnormal white-cell count may reflect infection, inflammation, medication effects, or a hematologic process.";
  if (name.includes("platelet")) return status === "low" ? "The low platelet count may increase bleeding risk." : "The high platelet count may be reactive or increase thrombotic risk in context.";
  if (name.includes("ldl") || name.includes("cholesterol") || name.includes("triglycer")) return "The abnormal lipid value may increase cardiovascular risk.";
  if (name.includes("hdl")) return "The abnormal HDL value may affect cardiovascular risk assessment.";
  if (name.includes("alt") || name.includes("ast") || name.includes("bilirubin")) return "The abnormal liver marker warrants correlation with symptoms, medicines, and other liver tests.";
  if (name.includes("creatinine") || name.includes("egfr") || name.includes("urea")) return "The abnormal renal marker may indicate impaired kidney function or altered hydration.";
  if (name.includes("tsh") || name.includes("t3") || name.includes("t4")) return "The abnormal thyroid marker warrants interpretation with the complete thyroid panel and symptoms.";
  if (name.includes("glucose") || name.includes("hba1c")) return "The abnormal glycemic marker may indicate suboptimal glucose control.";
  return `${parameter.name} is ${parameter.status.toLowerCase()} and requires clinical correlation.`;
};

export const generateStructuredFallbackSummary = ({ reportType = "", parsedData = {} } = {}) => {
  const parameters = getMeaningfulParameters(parsedData);
  if (parameters.length === 0) {
    return "**Key Findings:** Insufficient information: no meaningful laboratory parameters were extracted from this report.\n\n**Abnormal Values:** None available for assessment.\n\n**Risks:** Cannot be assessed from the available data.\n\n**Recommendations:** Review the original scan and repeat OCR or enter the laboratory values manually.";
  }

  const abnormal = parameters.filter((parameter) => ["high", "low"].includes(String(parameter.status || "").toLowerCase()));
  const findings = parameters
    .map((parameter) => `${parameter.name} ${parameter.value}${parameter.unit ? ` ${parameter.unit}` : ""} (${parameter.status || "Unknown"})`)
    .join("; ");
  const abnormalText = abnormal.length
    ? abnormal.map((parameter) => `${parameter.name}: ${parameter.value}${parameter.unit ? ` ${parameter.unit}` : ""} (${parameter.status})`).join("; ")
    : "No supplied values are marked outside their reference ranges.";
  const risks = [...new Set(abnormal.map(describeRisk).filter(Boolean))];
  const recommendations = abnormal.length
    ? "Correlate abnormal results with the patient's history, examination, medicines, and the original laboratory report; repeat or extend testing when clinically indicated."
    : "Continue routine clinical correlation and monitoring based on the patient's history and risk factors.";

  return `**Key Findings:** ${reportType || "Laboratory report"} includes ${parameters.length} extracted parameters. ${findings}\n\n**Abnormal Values:** ${abnormalText}\n\n**Risks:** ${risks.length ? risks.join(" ") : "No specific risk is indicated by the supplied in-range values alone."}\n\n**Recommendations:** ${recommendations}`;
};

export const buildStructuredReportPrompt = ({ reportType = "", parsedData = {}, extractedText = "" } = {}) => {
  const template = getReportTemplate(reportType);
  const structuredData = {
    reportType: reportType || template.name,
    patientName: parsedData?.patientName || null,
    reportDate: parsedData?.reportDate || null,
    laboratory: parsedData?.laboratory || null,
    parameters: getMeaningfulParameters(parsedData),
  };

  return `You are a senior medical AI assistant analyzing a ${template.name} report.

Panel-specific guidance:
${template.focus}

Authoritative structured laboratory data:
${JSON.stringify(structuredData, null, 2)}

Supplemental OCR text (use only to clarify context; never override or invent structured values):
${String(extractedText || "").slice(0, 8000)}

Return exactly these four sections:
**Key Findings:** Reference the actual measured values and provide a concise clinical interpretation.
**Abnormal Values:** List every supplied High/Low value with its measured value, unit, and reference range.
**Risks:** Explain only risks supported by the supplied data.
**Recommendations:** Give data-driven follow-up recommendations and advise clinical correlation.

Do not claim information is insufficient when one or more structured parameters are supplied. Do not diagnose, invent missing values, or replace clinician judgment.`;
};

