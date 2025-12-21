import mammoth from "mammoth";

/**
 * Parse DOCX document and extract text
 * 
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<Object>} Parsed document data
 */
export async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });

    return {
      success: true,
      text: result.value,
      messages: result.messages,
      wordCount: result.value.split(/\s+/).length,
    };
  } catch (error) {
    console.error("DOCX parsing error:", error);
    return {
      success: false,
      error: error.message,
      text: "",
    };
  }
}

/**
 * Parse DOCX and preserve some structure (HTML)
 * 
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<Object>} Parsed document with HTML
 */
export async function parseDOCXWithStructure(buffer) {
  try {
    const [textResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ buffer }),
      mammoth.convertToHtml({ buffer }),
    ]);

    return {
      success: true,
      text: textResult.value,
      html: htmlResult.value,
      messages: [...textResult.messages, ...htmlResult.messages],
    };
  } catch (error) {
    console.error("DOCX parsing error:", error);
    return {
      success: false,
      error: error.message,
      text: "",
      html: "",
    };
  }
}

/**
 * Extract headings from DOCX HTML
 * 
 * @param {string} html - HTML from mammoth
 * @returns {Array} List of headings
 */
export function extractDOCXHeadings(html) {
  const headings = [];
  const headingRegex = /<h(\d)>([^<]+)<\/h\1>/gi;

  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].trim(),
    });
  }

  return headings;
}

