import { BASE_SYSTEM_PROMPT } from "./system.js";

/**
 * Prompt for analyzing security policy documents
 */
export const EVIDENCE_ANALYSIS_SYSTEM = `${BASE_SYSTEM_PROMPT}

## Your Task: Evidence Analysis

You are analyzing security documentation to extract:
1. What security controls are claimed or implemented
2. Whether the document is current and complete
3. What ISO 27001 controls this evidence supports

Be thorough but conservative. Only claim evidence supports a control if there is clear, explicit documentation of that control.`;

/**
 * Generate prompt for document analysis
 */
export function buildEvidenceAnalysisPrompt(document, controls) {
  const controlList = controls
    .slice(0, 20) // Limit for context window
    .map((c) => `- ${c.control_code}: ${c.title}`)
    .join("\n");

  return `Analyze this security document and extract relevant information.

## Document
Filename: ${document.file_name}
Content:
---
${document.parsed_text?.substring(0, 15000) || "No content extracted"}
---

## Relevant Controls
${controlList}

## Required Output (JSON)

Respond with ONLY a JSON object in this exact format:

\`\`\`json
{
  "document_type": "policy|procedure|record|diagram|other",
  "document_title": "Extracted or inferred title",
  "document_date": "YYYY-MM-DD or null if not found",
  "is_current": true/false,
  "quality_score": 1-5,
  "quality_notes": "Brief assessment of document quality",
  "summary": "2-3 sentence summary of what this document covers",
  "controls_addressed": [
    {
      "control_code": "A.5.1",
      "relevance": "high|medium|low",
      "evidence_excerpt": "Specific quote or reference from document",
      "confidence": "high|medium|low",
      "notes": "How this document supports the control"
    }
  ],
  "gaps_identified": [
    "List any missing elements expected in this type of document"
  ],
  "recommendations": [
    "Suggestions for improving this document"
  ]
}
\`\`\`

Important:
- Only include controls where there is CLEAR evidence in the document
- Be conservative - if unsure, don't include the control
- Quote specific passages where possible
- Note if the document appears outdated`;
}

/**
 * Validate evidence analysis output
 */
export function validateEvidenceAnalysis(analysis) {
  const required = [
    "document_type",
    "summary",
    "controls_addressed",
    "quality_score",
  ];

  for (const field of required) {
    if (!(field in analysis)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate controls_addressed structure
  if (Array.isArray(analysis.controls_addressed)) {
    for (const control of analysis.controls_addressed) {
      if (!control.control_code || !control.confidence) {
        throw new Error("Invalid control structure in analysis");
      }
    }
  }

  return true;
}

