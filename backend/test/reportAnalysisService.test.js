import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStructuredReportPrompt,
  extractKnownParametersFromText,
  generateStructuredFallbackSummary,
  hasMeaningfulParameters,
} from "../src/services/reportAnalysisService.js";

const cbcData = {
  parameters: [
    { name: "Hemoglobin", value: "17.1", unit: "g/dL", referenceRange: "12.0 - 16.0", status: "High" },
    { name: "White Blood Cell Count", value: "7.5", unit: "x10^9/L", referenceRange: "4.0 - 11.0", status: "Normal" },
  ],
};

test("structured CBC prompt includes authoritative extracted values", () => {
  const prompt = buildStructuredReportPrompt({
    reportType: "Complete Blood Count",
    parsedData: cbcData,
    extractedText: "CBC report",
  });

  assert.match(prompt, /CBC/);
  assert.match(prompt, /"Hemoglobin"/);
  assert.match(prompt, /"17.1"/);
  assert.match(prompt, /Do not claim information is insufficient/);
});

test("fallback summary references actual abnormal values", () => {
  const summary = generateStructuredFallbackSummary({
    reportType: "Complete Blood Count",
    parsedData: cbcData,
  });

  assert.match(summary, /Hemoglobin 17.1 g\/dL \(High\)/);
  assert.match(summary, /\*\*Abnormal Values:\*\*/);
  assert.doesNotMatch(summary, /Insufficient information/i);
});

test("insufficient information is used only when parameters are absent", () => {
  assert.equal(hasMeaningfulParameters({ parameters: [] }), false);
  assert.match(
    generateStructuredFallbackSummary({ reportType: "CBC", parsedData: { parameters: [] } }),
    /Insufficient information/i
  );
});

test("local parser extracts common CBC values from OCR text", () => {
  const parameters = extractKnownParametersFromText(
    "Hemoglobin: 17.1 g/dL 12.0 - 16.0\nWBC Count: 7.5 x10^9/L 4.0 - 11.0",
    "Complete Blood Count"
  );

  assert.equal(parameters.length, 2);
  assert.deepEqual(parameters.map(({ name, value, status }) => ({ name, value, status })), [
    { name: "Hemoglobin", value: "17.1", status: "High" },
    { name: "White Blood Cell Count", value: "7.5", status: "Normal" },
  ]);
});

