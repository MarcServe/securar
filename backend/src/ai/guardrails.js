/**
 * AI Output Guardrails
 * 
 * Validates AI outputs to ensure compliance with context engineering requirements.
 */

// Forbidden words that should never appear in AI outputs
const FORBIDDEN_WORDS = [
  "certified",
  "certification achieved",
  "fully compliant",
  "guaranteed",
  "approved",
  "confirmed compliant",
  "legally compliant",
  "audit passed",
];

// Required fields for different output types
const REQUIRED_FIELDS = {
  controlAssessment: ["status", "confidence", "reasoning", "source_inputs"],
  evidenceAnalysis: ["document_type", "summary", "controls_addressed"],
  executiveSummary: ["headline", "summary", "key_findings", "disclaimer"],
};

/**
 * Check for forbidden language in AI output
 * 
 * @param {string} text - Text to check
 * @returns {Object} Validation result
 */
export function checkForbiddenLanguage(text) {
  const lowerText = text.toLowerCase();
  const violations = [];

  for (const word of FORBIDDEN_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      violations.push(word);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    message: violations.length > 0
      ? `Output contains forbidden language: ${violations.join(", ")}`
      : "No forbidden language detected",
  };
}

/**
 * Validate AI output has required fields
 * 
 * @param {Object} output - AI output object
 * @param {string} outputType - Type of output (controlAssessment, evidenceAnalysis, etc.)
 * @returns {Object} Validation result
 */
export function validateRequiredFields(output, outputType) {
  const required = REQUIRED_FIELDS[outputType] || [];
  const missing = [];

  for (const field of required) {
    if (!(field in output) || output[field] === null || output[field] === undefined) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    message: missing.length > 0
      ? `Missing required fields: ${missing.join(", ")}`
      : "All required fields present",
  };
}

/**
 * Validate confidence indicator is present and valid
 * 
 * @param {Object} output - AI output
 * @returns {Object} Validation result
 */
export function validateConfidence(output) {
  const validValues = ["high", "medium", "low"];
  
  if (!output.confidence) {
    return {
      valid: false,
      message: "Confidence indicator is required",
    };
  }

  if (!validValues.includes(output.confidence.toLowerCase())) {
    return {
      valid: false,
      message: `Invalid confidence value: ${output.confidence}. Must be: ${validValues.join(", ")}`,
    };
  }

  return { valid: true, message: "Valid confidence indicator" };
}

/**
 * Validate source inputs are cited
 * 
 * @param {Object} output - AI output
 * @returns {Object} Validation result
 */
export function validateSourceInputs(output) {
  if (!output.source_inputs || !Array.isArray(output.source_inputs)) {
    return {
      valid: false,
      message: "Source inputs array is required",
    };
  }

  if (output.source_inputs.length === 0 && output.status !== "not_applicable") {
    return {
      valid: false,
      message: "At least one source input must be cited (unless status is not_applicable)",
    };
  }

  for (const input of output.source_inputs) {
    if (!input.type || !input.reference) {
      return {
        valid: false,
        message: "Each source input must have type and reference",
      };
    }
  }

  return { valid: true, message: "Source inputs properly cited" };
}

/**
 * Full validation of AI control assessment output
 * 
 * @param {Object} output - AI output
 * @returns {Object} Validation result with all checks
 */
export function validateControlAssessment(output) {
  const results = {
    forbiddenLanguage: checkForbiddenLanguage(JSON.stringify(output)),
    requiredFields: validateRequiredFields(output, "controlAssessment"),
    confidence: validateConfidence(output),
    sourceInputs: validateSourceInputs(output),
  };

  const allValid = Object.values(results).every((r) => r.valid);

  return {
    valid: allValid,
    results,
    errors: Object.entries(results)
      .filter(([_, r]) => !r.valid)
      .map(([key, r]) => `${key}: ${r.message}`),
  };
}

/**
 * Clean AI output by replacing forbidden words
 * 
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
export function cleanForbiddenLanguage(text) {
  let cleaned = text;

  const replacements = {
    "certified": "appears to meet requirements",
    "fully compliant": "appears compliant",
    "guaranteed": "based on available evidence",
    "approved": "assessed as meeting",
    "confirmed compliant": "evidence suggests compliance",
  };

  for (const [forbidden, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(forbidden, "gi");
    cleaned = cleaned.replace(regex, replacement);
  }

  return cleaned;
}

