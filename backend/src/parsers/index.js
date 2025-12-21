import { parsePDF, extractPDFSections } from "./pdf.js";
import { parseDOCX, parseDOCXWithStructure, extractDOCXHeadings } from "./docx.js";
import { performOCR, shouldPerformOCR } from "./ocr.js";

/**
 * Parse any supported document type
 * 
 * @param {Buffer} buffer - File buffer
 * @param {string} fileType - File extension (pdf, docx, png, etc.)
 * @param {string} fileName - Original filename
 * @returns {Promise<Object>} Parsed document data
 */
export async function parseDocument(buffer, fileType, fileName) {
  const type = fileType?.toLowerCase();

  console.log(`Parsing document: ${fileName} (${type})`);

  try {
    switch (type) {
      case "pdf":
        const pdfResult = await parsePDF(buffer);
        if (pdfResult.success) {
          const sections = extractPDFSections(pdfResult.text);
          return {
            ...pdfResult,
            sections: sections.sections,
            hasStructure: sections.hasStructure,
          };
        }
        return pdfResult;

      case "doc":
      case "docx":
        const docResult = await parseDOCXWithStructure(buffer);
        if (docResult.success) {
          const headings = extractDOCXHeadings(docResult.html);
          return {
            ...docResult,
            headings,
            hasStructure: headings.length > 0,
          };
        }
        return docResult;

      case "png":
      case "jpg":
      case "jpeg":
      case "tiff":
      case "bmp":
        const ocrResult = await performOCR(buffer);
        return {
          ...ocrResult,
          type: "ocr",
          hasStructure: false,
        };

      case "csv":
        // For CSV, just convert buffer to text
        const csvText = buffer.toString("utf-8");
        return {
          success: true,
          text: csvText,
          type: "csv",
          hasStructure: true,
          rows: csvText.split("\n").length,
        };

      case "txt":
        // Plain text
        const txtText = buffer.toString("utf-8");
        return {
          success: true,
          text: txtText,
          type: "text",
          hasStructure: false,
          wordCount: txtText.split(/\s+/).length,
        };

      default:
        return {
          success: false,
          error: `Unsupported file type: ${type}`,
          text: "",
        };
    }
  } catch (error) {
    console.error(`Error parsing ${fileName}:`, error);
    return {
      success: false,
      error: error.message,
      text: "",
    };
  }
}

/**
 * Check if a file type is supported
 * 
 * @param {string} fileType - File extension
 * @returns {boolean} Whether the type is supported
 */
export function isSupported(fileType) {
  const supported = ["pdf", "doc", "docx", "png", "jpg", "jpeg", "tiff", "bmp", "csv", "txt"];
  return supported.includes(fileType?.toLowerCase());
}

/**
 * Truncate text to max length while preserving word boundaries
 * 
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50000) {
  if (!text || text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  return truncated.substring(0, lastSpace) + "... [truncated]";
}

export { parsePDF, parseDOCX, performOCR, shouldPerformOCR };

