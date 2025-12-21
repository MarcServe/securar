/**
 * Context Builder
 * 
 * Assembles the 4 context layers for AI calls:
 * 1. Organizational context
 * 2. Assessment context
 * 3. Framework context
 * 4. Risk context
 */

/**
 * Build complete context for AI analysis
 * 
 * @param {Object} params - Context parameters
 * @returns {Object} Structured AI context
 */
export function buildAIContext({
  organisation,
  assessment,
  responses,
  evidence,
  controls,
}) {
  return {
    organizational: buildOrganizationalContext(organisation),
    assessment: buildAssessmentContextLayer(assessment, responses, evidence),
    framework: buildFrameworkContext(controls, assessment?.target_frameworks),
    risk: buildRiskContext(organisation, evidence),
  };
}

/**
 * Layer 1: Organizational Context
 */
function buildOrganizationalContext(org) {
  if (!org) {
    return {
      size: "unknown",
      industry: "unknown",
      geography: "unknown",
      infrastructure: "unknown",
      complianceTargets: ["iso27001"],
    };
  }

  // Map size band to category
  const sizeMap = {
    "1-10": "micro",
    "11-50": "small",
    "51-250": "medium",
    "251-1000": "large",
    "1000+": "enterprise",
  };

  return {
    size: sizeMap[org.size_band] || "small",
    industry: org.industry || "technology",
    geography: org.country || "GB",
    infrastructure: "hybrid", // Default assumption
    complianceTargets: ["iso27001"],
  };
}

/**
 * Layer 2: Assessment Context
 */
function buildAssessmentContextLayer(assessment, responses, evidence) {
  const responsesByDomain = {};
  
  if (responses) {
    for (const response of responses) {
      // Group by domain (would need question data to do properly)
      const domain = "general"; // Simplified
      if (!responsesByDomain[domain]) {
        responsesByDomain[domain] = [];
      }
      responsesByDomain[domain].push(response);
    }
  }

  const evidenceByType = {};
  
  if (evidence) {
    for (const doc of evidence) {
      const type = doc.file_type || "other";
      if (!evidenceByType[type]) {
        evidenceByType[type] = [];
      }
      evidenceByType[type].push(doc);
    }
  }

  return {
    status: assessment?.status || "draft",
    questionnaireResponses: responses || [],
    responseCount: responses?.length || 0,
    evidenceDocuments: evidence || [],
    evidenceCount: evidence?.length || 0,
    parsedEvidenceCount: evidence?.filter((e) => e.status === "parsed").length || 0,
    responsesByDomain,
    evidenceByType,
  };
}

/**
 * Layer 3: Framework Context
 */
function buildFrameworkContext(controls, targetFrameworks) {
  const frameworks = targetFrameworks || ["iso27001"];
  
  // Group controls by domain
  const controlsByDomain = {};
  
  if (controls) {
    for (const control of controls) {
      const domain = control.domain || "Other";
      if (!controlsByDomain[domain]) {
        controlsByDomain[domain] = [];
      }
      controlsByDomain[domain].push(control);
    }
  }

  return {
    targetFrameworks: frameworks,
    controls: controls || [],
    controlCount: controls?.length || 0,
    controlsByDomain,
    domains: Object.keys(controlsByDomain),
  };
}

/**
 * Layer 4: Risk Context
 */
function buildRiskContext(org, evidence) {
  // Infer risk profile from org characteristics
  const industryRisk = {
    finance: "high",
    healthcare: "high",
    government: "high",
    technology: "medium",
    retail: "medium",
    manufacturing: "medium",
    professional: "low",
    education: "low",
    other: "medium",
  };

  const sizeRisk = {
    micro: "low",
    small: "low",
    medium: "medium",
    large: "high",
    enterprise: "high",
  };

  const industry = org?.industry || "technology";
  const sizeMap = {
    "1-10": "micro",
    "11-50": "small",
    "51-250": "medium",
    "251-1000": "large",
    "1000+": "enterprise",
  };
  const size = sizeMap[org?.size_band] || "small";

  // Calculate overall risk profile
  const dataSensitivity = industryRisk[industry] || "medium";
  
  // Evidence quality affects confidence
  const evidenceQuality = evidence?.length > 5 ? "good" : evidence?.length > 0 ? "partial" : "poor";

  return {
    dataSensitivity,
    internetExposure: true, // Default assumption for modern orgs
    identityPosture: "unknown", // Would need specific signals
    businessCriticality: sizeRisk[size] || "medium",
    industryRiskProfile: industryRisk[industry] || "medium",
    evidenceQuality,
    overallRiskLevel: calculateOverallRisk(dataSensitivity, size, evidenceQuality),
  };
}

/**
 * Calculate overall risk level
 */
function calculateOverallRisk(dataSensitivity, size, evidenceQuality) {
  const sensitivityScore = { low: 1, medium: 2, high: 3 }[dataSensitivity] || 2;
  const sizeScore = { micro: 1, small: 1, medium: 2, large: 3, enterprise: 3 }[size] || 2;
  const evidenceScore = { good: 1, partial: 2, poor: 3 }[evidenceQuality] || 2;

  const avgScore = (sensitivityScore + sizeScore + evidenceScore) / 3;

  if (avgScore > 2.3) return "high";
  if (avgScore > 1.6) return "medium";
  return "low";
}

/**
 * Generate context summary for prompts
 */
export function summarizeContext(context) {
  return `
Organisation: ${context.organizational.industry} (${context.organizational.size})
Location: ${context.organizational.geography}
Risk Profile: ${context.risk.overallRiskLevel}

Assessment Data:
- Questionnaire responses: ${context.assessment.responseCount}
- Evidence documents: ${context.assessment.evidenceCount} (${context.assessment.parsedEvidenceCount} analyzed)
- Target frameworks: ${context.framework.targetFrameworks.join(", ")}
- Controls to assess: ${context.framework.controlCount}
`.trim();
}

