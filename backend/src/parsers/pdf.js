import pdf from "pdf-parse";

/**
 * Parse PDF document and extract text
 * 
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<Object>} Parsed document data
 */
export async function parsePDF(buffer) {
  try {
    const data = await pdf(buffer);

    return {
      success: true,
      text: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info,
        version: data.version,
      },
      wordCount: data.text.split(/\s+/).length,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    return {
      success: false,
      error: error.message,
      text: "",
    };
  }
}

/**
 * Extract structured sections from PDF text
 * 
 * @param {string} text - Extracted PDF text
 * @returns {Object} Structured sections
 */
export function extractPDFSections(text) {
  const sections = [];
  const lines = text.split("\n").filter((l) => l.trim());

  let currentSection = null;
  let currentContent = [];

  // Common section header patterns
  const headerPatterns = [
    /^(\d+\.?\s+[A-Z][A-Za-z\s]+)$/,           // "1. Introduction" or "1 Introduction"
    /^([A-Z][A-Z\s]+)$/,                         // "INTRODUCTION"
    /^(Chapter\s+\d+[:\s]+.+)$/i,                // "Chapter 1: Introduction"
    /^(Section\s+\d+[:\s]+.+)$/i,                // "Section 1: Introduction"
  ];

  for (const line of lines) {
    const isHeader = headerPatterns.some((p) => p.test(line.trim()));

    if (isHeader) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        sections.push({
          title: currentSection,
          content: currentContent.join("\n"),
        });
      }
      currentSection = line.trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    } else {
      // Content before first section
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection && currentContent.length > 0) {
    sections.push({
      title: currentSection,
      content: currentContent.join("\n"),
    });
  }

  // If no sections found, return full text as single section
  if (sections.length === 0) {
    return {
      sections: [{
        title: "Document",
        content: text,
      }],
      hasStructure: false,
    };
  }

  return {
    sections,
    hasStructure: true,
  };
}

