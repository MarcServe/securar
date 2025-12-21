/**
 * Scoring Engine
 * 
 * Computes readiness scores with explainable breakdowns.
 */

/**
 * Status weights for scoring
 */
const STATUS_WEIGHTS = {
  compliant: 1.0,
  partial: 0.5,
  gap: 0,
  not_applicable: null, // Excluded from calculation
  unknown: 0,
};

/**
 * Confidence modifiers
 */
const CONFIDENCE_MODIFIERS = {
  high: 1.0,
  medium: 0.9,
  low: 0.7,
};

/**
 * Compute overall readiness score
 * 
 * @param {Array} controlResults - Array of control assessment results
 * @returns {Object} Score and breakdown
 */
export function computeReadinessScore(controlResults) {
  // Filter out N/A controls
  const scorableControls = controlResults.filter(
    (r) => r.status !== "not_applicable"
  );

  if (scorableControls.length === 0) {
    return {
      score: 0,
      breakdown: {
        compliant: 0,
        partial: 0,
        gap: 0,
        not_applicable: controlResults.length,
        unknown: 0,
      },
    };
  }

  // Calculate weighted score
  let totalWeight = 0;
  let totalScore = 0;

  for (const result of scorableControls) {
    const baseWeight = STATUS_WEIGHTS[result.status] ?? 0;
    const confidenceModifier = CONFIDENCE_MODIFIERS[result.confidence] ?? 0.8;
    
    // Weight by confidence
    const weight = baseWeight * confidenceModifier;
    totalScore += weight;
    totalWeight += 1;
  }

  const score = Math.round((totalScore / totalWeight) * 100);

  // Build breakdown
  const breakdown = controlResults.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {
    compliant: 0,
    partial: 0,
    gap: 0,
    not_applicable: 0,
    unknown: 0,
  });

  // Add metadata
  breakdown.total_assessed = scorableControls.length;
  breakdown.total_controls = controlResults.length;

  return { score, breakdown };
}

/**
 * Compute scores by domain
 * 
 * @param {Array} controlResults - Control results with control_code
 * @param {Object} controlsByDomain - Controls grouped by domain
 * @returns {Object} Domain scores
 */
export function computeDomainScores(controlResults, controlsByDomain = {}) {
  const domainScores = {};

  // Group results by domain
  const resultsByDomain = {};
  
  for (const result of controlResults) {
    // Find domain for this control
    let domain = "Other";
    for (const [d, controls] of Object.entries(controlsByDomain)) {
      if (controls.some((c) => c.id === result.control_id)) {
        domain = d;
        break;
      }
    }

    if (!resultsByDomain[domain]) {
      resultsByDomain[domain] = [];
    }
    resultsByDomain[domain].push(result);
  }

  // Calculate score per domain
  for (const [domain, results] of Object.entries(resultsByDomain)) {
    const { score, breakdown } = computeReadinessScore(results);
    domainScores[domain] = {
      score,
      breakdown,
      controlCount: results.length,
    };
  }

  return domainScores;
}

/**
 * Determine certification readiness status
 * 
 * @param {number} score - Overall readiness score
 * @param {Object} breakdown - Status breakdown
 * @returns {Object} Readiness status
 */
export function getCertificationReadiness(score, breakdown) {
  // Criteria for readiness
  const criticalGaps = breakdown.gap || 0;
  const partialControls = breakdown.partial || 0;
  const totalAssessed = breakdown.total_assessed || 1;

  const gapPercentage = (criticalGaps / totalAssessed) * 100;
  const partialPercentage = (partialControls / totalAssessed) * 100;

  if (score >= 80 && gapPercentage < 10) {
    return {
      status: "ready",
      message: "Organisation appears ready for certification audit",
      recommendation: "Consider scheduling Stage 1 audit",
      confidence: score >= 90 ? "high" : "medium",
    };
  }

  if (score >= 50 && gapPercentage < 30) {
    return {
      status: "needs_work",
      message: "Organisation has a foundation but needs remediation before audit",
      recommendation: "Address identified gaps within 60-90 days",
      estimatedTimeToReady: `${Math.ceil((100 - score) / 10)} weeks`,
      confidence: "medium",
    };
  }

  return {
    status: "not_ready",
    message: "Significant work required before certification is viable",
    recommendation: "Focus on building foundational controls and documentation",
    estimatedTimeToReady: "3-6 months minimum",
    confidence: "low",
  };
}

/**
 * Calculate score trend compared to previous assessment
 * 
 * @param {number} currentScore - Current score
 * @param {number} previousScore - Previous score (if any)
 * @returns {Object} Trend information
 */
export function calculateScoreTrend(currentScore, previousScore) {
  if (previousScore === null || previousScore === undefined) {
    return {
      trend: "new",
      change: 0,
      message: "First assessment",
    };
  }

  const change = currentScore - previousScore;

  if (change > 10) {
    return {
      trend: "improving",
      change,
      message: `Score improved by ${change} points`,
    };
  }

  if (change < -10) {
    return {
      trend: "declining",
      change,
      message: `Score decreased by ${Math.abs(change)} points`,
    };
  }

  return {
    trend: "stable",
    change,
    message: "Score is relatively stable",
  };
}
