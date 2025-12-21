import { BASE_SYSTEM_PROMPT, buildOrgContext, buildAssessmentContext } from "./system.js";

/**
 * Prompt for mapping controls to compliance status
 */
export const CONTROL_MAPPING_SYSTEM = `${BASE_SYSTEM_PROMPT}

## Your Task: Control Compliance Mapping

You are determining the compliance status of specific ISO 27001 controls based on:
1. Questionnaire responses
2. Evidence document analysis
3. Organisational context

For each control, you must:
- Determine status: compliant, partial, gap, or not_applicable
- Provide clear reasoning citing specific evidence
- Assign a confidence level
- Recommend next steps if gaps exist`;

/**
 * Generate prompt for control mapping
 */
export function buildControlMappingPrompt(control, signals, orgContext) {
  const responsesText = signals.responses?.length
    ? signals.responses.map((r) => `Q: ${r.question}\nA: ${r.answer}`).join("\n\n")
    : "No relevant questionnaire responses.";

  const evidenceText = signals.evidence?.length
    ? signals.evidence.map((e) => `Document: ${e.file_name}\nRelevance: ${e.relevance}\nExcerpt: ${e.excerpt}`).join("\n\n")
    : "No relevant evidence documents.";

  return `Assess the compliance status of this control.

## Control
Code: ${control.control_code}
Title: ${control.title}
Requirement: ${control.description || control.title}
Guidance: ${control.guidance || "See ISO 27001 standard"}

## Organisation Context
${buildOrgContext(orgContext)}

## Questionnaire Responses
${responsesText}

## Evidence Documents
${evidenceText}

## Required Output (JSON)

Respond with ONLY a JSON object:

\`\`\`json
{
  "control_code": "${control.control_code}",
  "status": "compliant|partial|gap|not_applicable",
  "confidence": "high|medium|low",
  "reasoning": "Clear explanation of why this status was assigned, citing specific evidence",
  "source_inputs": [
    {
      "type": "questionnaire|evidence|inference",
      "reference": "Specific question ID or document name",
      "excerpt": "Relevant quote or response"
    }
  ],
  "evidence_gaps": [
    "What additional evidence would strengthen this assessment"
  ],
  "recommendations": [
    "Specific actions to improve compliance"
  ]
}
\`\`\`

Rules:
- Status "compliant": Clear evidence of implementation AND documentation
- Status "partial": Some evidence but incomplete implementation or documentation
- Status "gap": No evidence found, or clear non-compliance
- Status "not_applicable": Control doesn't apply to this organisation (must justify)
- Be conservative: when in doubt, mark as "partial" or "gap"`;
}

/**
 * Validate control mapping output
 */
export function validateControlMapping(mapping) {
  const validStatuses = ["compliant", "partial", "gap", "not_applicable"];
  const validConfidence = ["high", "medium", "low"];

  if (!validStatuses.includes(mapping.status)) {
    throw new Error(`Invalid status: ${mapping.status}`);
  }

  if (!validConfidence.includes(mapping.confidence)) {
    throw new Error(`Invalid confidence: ${mapping.confidence}`);
  }

  if (!mapping.reasoning || mapping.reasoning.length < 20) {
    throw new Error("Reasoning is required and must be substantive");
  }

  return true;
}

