import { BASE_SYSTEM_PROMPT, buildOrgContext } from "./system.js";

/**
 * Prompt for generating executive summary
 */
export const REPORT_SYSTEM = `${BASE_SYSTEM_PROMPT}

## Your Task: Report Generation

You are generating professional security assessment reports that are:
1. Understandable by non-technical executives
2. Actionable for security teams
3. Auditor-ready with proper evidence references
4. Conservative and honest about limitations`;

/**
 * Generate executive summary prompt
 */
export function buildExecutiveSummaryPrompt(assessment, scoreData, org) {
  return `Generate an executive summary for this security assessment.

## Organisation
${buildOrgContext(org)}

## Assessment Results
- Overall Readiness Score: ${scoreData.score}%
- Status: ${scoreData.score >= 80 ? "Ready" : scoreData.score >= 50 ? "Needs Remediation" : "Not Ready"}

## Control Status Breakdown
- Compliant: ${scoreData.breakdown?.compliant || 0} controls
- Partial: ${scoreData.breakdown?.partial || 0} controls
- Gaps: ${scoreData.breakdown?.gap || 0} controls
- N/A: ${scoreData.breakdown?.not_applicable || 0} controls

## Top Risks Identified
${assessment.risks?.slice(0, 5).map((r, i) => `${i + 1}. ${r.title} (${r.severity})`).join("\n") || "No critical risks identified"}

## Required Output (JSON)

Respond with ONLY a JSON object:

\`\`\`json
{
  "headline": "One-line summary of assessment outcome",
  "summary": "2-3 paragraph executive summary (plain English, no jargon)",
  "key_findings": [
    "Top 3-5 key findings in plain language"
  ],
  "strengths": [
    "Areas where the organisation is performing well"
  ],
  "priority_actions": [
    {
      "action": "Specific action to take",
      "impact": "high|medium|low",
      "timeframe": "30-day|60-day|90-day",
      "rationale": "Why this matters"
    }
  ],
  "certification_readiness": {
    "status": "ready|needs_work|not_ready",
    "explanation": "Plain-language explanation of readiness",
    "estimated_timeline": "Time to certification readiness"
  },
  "disclaimer": "Standard disclaimer about this being decision support, not certification"
}
\`\`\`

Important:
- Use plain language understandable by non-technical executives
- Be honest about gaps but constructive about path forward
- Include standard disclaimer about not being certification
- Prioritise actionable recommendations`;
}

/**
 * Generate remediation roadmap prompt
 */
export function buildRemediationRoadmapPrompt(gaps, org) {
  const gapList = gaps
    .slice(0, 20)
    .map((g) => `- ${g.control_code}: ${g.title} (${g.severity})`)
    .join("\n");

  return `Generate a remediation roadmap for these security gaps.

## Organisation Context
${buildOrgContext(org)}

## Identified Gaps
${gapList}

## Required Output (JSON)

\`\`\`json
{
  "overview": "Brief overview of remediation approach",
  "phases": [
    {
      "phase": "30-day",
      "focus": "Critical security gaps",
      "actions": [
        {
          "control": "A.X.X",
          "action": "Specific action",
          "owner_role": "Suggested owner (IT Manager, CISO, etc.)",
          "effort": "Low|Medium|High",
          "priority": 1
        }
      ]
    },
    {
      "phase": "60-day",
      "focus": "High-priority improvements",
      "actions": []
    },
    {
      "phase": "90-day", 
      "focus": "Foundation strengthening",
      "actions": []
    }
  ],
  "quick_wins": [
    "Actions that can be completed immediately with low effort"
  ],
  "resource_requirements": {
    "internal_effort": "Estimated internal hours",
    "external_support": "Any external resources recommended",
    "budget_considerations": "Key cost factors"
  }
}
\`\`\``;
}

