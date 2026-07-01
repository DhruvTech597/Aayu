import Tesseract from "tesseract.js";
import axios from "axios";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * OCR Service to extract text from images
 */
export const extractTextFromImage = async (fileUrl) => {
  try {
    const { data: { text } } = await Tesseract.recognize(
      fileUrl,
      "eng"
    );
    return text.trim();
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to extract text from report image");
  }
};

export const extractTextFromBuffer = async (buffer, mimetype = "", originalName = "") => {
  if (!buffer) return "";

  const isPdf = mimetype === "application/pdf" || originalName.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    try {
      const parser = new pdfParse.PDFParse({ data: new Uint8Array(buffer) });
      const data = await parser.getText();
      return data.text?.trim() || "";
    } catch (error) {
      console.error("PDF Parsing Error:", error);
      throw new Error("Failed to extract text from PDF report");
    }
  }

  return extractTextFromImage(buffer);
};

/**
 * Extract text from images or PDFs based on file type
 */
export const extractTextFromFile = async (fileUrl) => {
  if (!fileUrl) {
    return "";
  }
  
  const isPdf = fileUrl.split('?')[0].toLowerCase().endsWith('.pdf');
  
  if (isPdf) {
    try {
      const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data);
      const parser = new pdfParse.PDFParse({ data: new Uint8Array(buffer) });
      const data = await parser.getText();
      return data.text?.trim() || "";
    } catch (error) {
      console.error("PDF Parsing Error:", error);
      throw new Error("Failed to extract text from PDF report");
    }
  } else {
    return extractTextFromImage(fileUrl);
  }
};
