import Tesseract from "tesseract.js";

/**
 * Perform OCR on an image
 * 
 * @param {Buffer} buffer - Image buffer
 * @param {string} language - Language code (default: eng)
 * @returns {Promise<Object>} OCR result
 */
export async function performOCR(buffer, language = "eng") {
  try {
    const result = await Tesseract.recognize(buffer, language, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          // Progress logging if needed
        }
      },
    });

    return {
      success: true,
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words?.length || 0,
    };
  } catch (error) {
    console.error("OCR error:", error);
    return {
      success: false,
      error: error.message,
      text: "",
      confidence: 0,
    };
  }
}

/**
 * Check if OCR is needed for an image
 * Simple heuristic based on file type
 * 
 * @param {string} fileType - File extension
 * @returns {boolean} Whether OCR should be attempted
 */
export function shouldPerformOCR(fileType) {
  const ocrTypes = ["png", "jpg", "jpeg", "tiff", "bmp", "gif"];
  return ocrTypes.includes(fileType?.toLowerCase());
}

