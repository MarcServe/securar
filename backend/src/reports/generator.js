/**
 * PDF Report Generator
 * 
 * Generates professional security assessment reports.
 */

import { supabaseAdmin } from "../supabaseAdmin.js";
import { callClaudeJSON } from "../ai/client.js";
import { REPORT_SYSTEM, buildExecutiveSummaryPrompt, buildRemediationRoadmapPrompt } from "../ai/prompts/report-generation.js";
import { getCertificationReadiness } from "../scoring.js";
import { groupRisksByTimeframe, prioritizeRisks } from "../riskEngine.js";

const admin = supabaseAdmin();

/**
 * Generate a full assessment report
 * 
 * @param {string} assessmentId - Assessment ID
 * @returns {Promise<Object>} Report data
 */
export async function generateReport(assessmentId) {
  console.log(`[Report] Generating report for assessment ${assessmentId}`);

  // Load all assessment data
  const { data: assessment, error: aErr } = await admin
    .from("assessments")
    .select("*, organisations(*)")
    .eq("id", assessmentId)
    .single();

  if (aErr || !assessment) {
    throw new Error(`Assessment not found: ${aErr?.message}`);
  }

  const org = assessment.organisations;
  const scoreData = {
    score: assessment.readiness_score,
    breakdown: assessment.score_breakdown,
  };

  // Load control results
  const { data: controlResults } = await admin
    .from("control_results")
    .select("*, controls(*)")
    .eq("assessment_id", assessmentId);

  // Load risks
  const { data: risks } = await admin
    .from("risks")
    .select("*")
    .eq("assessment_id", assessmentId);

  // Load evidence
  const { data: evidence } = await admin
    .from("evidence")
    .select("*")
    .eq("assessment_id", assessmentId);

  // Generate AI executive summary if available
  let executiveSummary;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      executiveSummary = await callClaudeJSON({
        systemPrompt: REPORT_SYSTEM,
        userPrompt: buildExecutiveSummaryPrompt(
          { ...assessment, risks: prioritizeRisks(risks || []) },
          scoreData,
          org
        ),
      });
    } catch (e) {
      console.error("[Report] AI summary generation failed:", e);
    }
  }

  // Fallback executive summary
  if (!executiveSummary) {
    executiveSummary = generateFallbackSummary(assessment, scoreData, risks);
  }

  // Get certification readiness
  const readiness = getCertificationReadiness(
    scoreData.score,
    scoreData.breakdown
  );

  // Group risks by timeframe
  const risksByTimeframe = groupRisksByTimeframe(prioritizeRisks(risks || []));

  // Group controls by domain and status
  const controlsByDomain = groupControlsByDomain(controlResults || []);

  // Build full report structure
  const report = {
    meta: {
      generated_at: new Date().toISOString(),
      assessment_id: assessmentId,
      framework: assessment.target_frameworks?.[0] || "iso27001",
      version: "1.0",
    },
    organisation: {
      name: org?.name || "Unknown",
      industry: org?.industry || "Not specified",
      size: org?.size_band || "Not specified",
      country: org?.country || "Not specified",
    },
    executive_summary: executiveSummary,
    scores: {
      overall: scoreData.score,
      breakdown: scoreData.breakdown,
      readiness,
      domains: scoreData.breakdown?.domains || {},
    },
    controls: {
      total: controlResults?.length || 0,
      by_status: scoreData.breakdown,
      by_domain: controlsByDomain,
      details: (controlResults || []).map((cr) => ({
        code: cr.controls?.control_code || cr.control_code,
        title: cr.controls?.title || "Unknown",
        domain: cr.controls?.domain || "Unknown",
        status: cr.status,
        confidence: cr.confidence,
        reasoning: cr.reasoning,
      })),
    },
    risks: {
      total: risks?.length || 0,
      by_severity: groupBySeverity(risks || []),
      remediation_roadmap: risksByTimeframe,
      details: (risks || []).slice(0, 20).map((r) => ({
        title: r.title,
        description: r.description,
        severity: r.severity,
        likelihood: r.likelihood,
        impact: r.impact,
        recommendation: r.recommendation,
        timeframe: r.remediation_timeframe,
      })),
    },
    evidence: {
      total: evidence?.length || 0,
      analyzed: evidence?.filter((e) => e.status === "parsed").length || 0,
      documents: (evidence || []).map((e) => ({
        name: e.file_name,
        type: e.file_type,
        status: e.status,
        summary: e.ai_summary || null,
      })),
    },
    disclaimer: getDisclaimer(),
  };

  // Store report record
  const { data: reportRecord, error: rErr } = await admin
    .from("reports")
    .insert({
      assessment_id: assessmentId,
      org_id: org?.id,
      summary: report,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (rErr) {
    console.error("[Report] Failed to save report record:", rErr);
  }

  console.log(`[Report] Report generated successfully`);

  return {
    report,
    reportId: reportRecord?.id,
  };
}

/**
 * Generate HTML for PDF
 */
export function generateReportHTML(report) {
  const { organisation, executive_summary, scores, controls, risks, evidence, disclaimer } = report;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Security Assessment Report - ${organisation.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a2e;
      background: #fff;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    
    /* Cover Page */
    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
      page-break-after: always;
    }
    
    .cover h1 {
      font-size: 32pt;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 16px;
    }
    
    .cover h2 {
      font-size: 18pt;
      font-weight: 500;
      color: #64748b;
      margin-bottom: 40px;
    }
    
    .cover .meta {
      margin-top: 60px;
      color: #94a3b8;
    }
    
    /* Sections */
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .section h2 {
      font-size: 16pt;
      font-weight: 600;
      color: #6366f1;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 20px;
    }
    
    .section h3 {
      font-size: 13pt;
      font-weight: 600;
      color: #334155;
      margin: 20px 0 12px 0;
    }
    
    /* Score Display */
    .score-display {
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 16px;
      color: white;
      margin-bottom: 24px;
    }
    
    .score-display .score {
      font-size: 48pt;
      font-weight: 700;
    }
    
    .score-display .label {
      font-size: 14pt;
      opacity: 0.9;
    }
    
    /* Status Grid */
    .status-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin: 24px 0;
    }
    
    .status-card {
      padding: 16px;
      border-radius: 12px;
      text-align: center;
    }
    
    .status-card.compliant { background: #dcfce7; color: #166534; }
    .status-card.partial { background: #fef3c7; color: #92400e; }
    .status-card.gap { background: #fee2e2; color: #991b1b; }
    .status-card.na { background: #f1f5f9; color: #64748b; }
    
    .status-card .count {
      font-size: 24pt;
      font-weight: 700;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
    
    /* Badges */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 9pt;
      font-weight: 500;
    }
    
    .badge.critical { background: #fef2f2; color: #dc2626; }
    .badge.high { background: #fff7ed; color: #ea580c; }
    .badge.medium { background: #fefce8; color: #ca8a04; }
    .badge.low { background: #f0fdf4; color: #16a34a; }
    
    .badge.compliant { background: #dcfce7; color: #166534; }
    .badge.partial { background: #fef3c7; color: #92400e; }
    .badge.gap { background: #fee2e2; color: #991b1b; }
    
    /* Findings */
    .finding {
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      margin-bottom: 12px;
      border-left: 4px solid #6366f1;
    }
    
    .finding.high { border-left-color: #dc2626; }
    .finding.medium { border-left-color: #f59e0b; }
    
    .finding-title {
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .finding-text {
      color: #64748b;
      font-size: 10pt;
    }
    
    /* Footer */
    .disclaimer {
      margin-top: 60px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      font-size: 9pt;
      color: #64748b;
    }
    
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Cover Page -->
    <div class="cover">
      <h1>Security Assessment Report</h1>
      <h2>${organisation.name}</h2>
      <p>ISO 27001 Readiness Assessment</p>
      <div class="meta">
        <p>Generated: ${new Date(report.meta.generated_at).toLocaleDateString()}</p>
        <p>Framework: ${report.meta.framework.toUpperCase()}</p>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <h2>Executive Summary</h2>
      <p><strong>${executive_summary.headline || 'Security Assessment Complete'}</strong></p>
      <p>${executive_summary.summary || 'Assessment has been completed.'}</p>
      
      <h3>Key Findings</h3>
      <ul>
        ${(executive_summary.key_findings || []).map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>

    <!-- Score Overview -->
    <div class="section">
      <h2>Readiness Score</h2>
      <div class="score-display">
        <div class="score">${scores.overall}%</div>
        <div class="label">Overall Readiness</div>
      </div>
      
      <div class="status-grid">
        <div class="status-card compliant">
          <div class="count">${scores.breakdown?.compliant || 0}</div>
          <div>Compliant</div>
        </div>
        <div class="status-card partial">
          <div class="count">${scores.breakdown?.partial || 0}</div>
          <div>Partial</div>
        </div>
        <div class="status-card gap">
          <div class="count">${scores.breakdown?.gap || 0}</div>
          <div>Gaps</div>
        </div>
        <div class="status-card na">
          <div class="count">${scores.breakdown?.not_applicable || 0}</div>
          <div>N/A</div>
        </div>
      </div>

      <h3>Certification Readiness</h3>
      <p><strong>Status:</strong> ${scores.readiness?.status || 'Unknown'}</p>
      <p>${scores.readiness?.message || ''}</p>
    </div>

    <!-- Top Risks -->
    <div class="section page-break">
      <h2>Top Risks</h2>
      ${(risks.details || []).slice(0, 10).map(risk => `
        <div class="finding ${risk.severity}">
          <div class="finding-title">
            <span class="badge ${risk.severity}">${risk.severity.toUpperCase()}</span>
            ${risk.title}
          </div>
          <p class="finding-text">${risk.description}</p>
          <p><strong>Recommendation:</strong> ${risk.recommendation}</p>
        </div>
      `).join('')}
    </div>

    <!-- Remediation Roadmap -->
    <div class="section">
      <h2>Remediation Roadmap</h2>
      
      <h3>30-Day Priority Actions</h3>
      <ul>
        ${(risks.remediation_roadmap?.['30-day'] || []).slice(0, 5).map(r => `<li>${r.title} - ${r.recommendation}</li>`).join('') || '<li>No critical actions identified</li>'}
      </ul>
      
      <h3>60-Day Actions</h3>
      <ul>
        ${(risks.remediation_roadmap?.['60-day'] || []).slice(0, 5).map(r => `<li>${r.title} - ${r.recommendation}</li>`).join('') || '<li>No high-priority actions identified</li>'}
      </ul>
      
      <h3>90-Day Actions</h3>
      <ul>
        ${(risks.remediation_roadmap?.['90-day'] || []).slice(0, 5).map(r => `<li>${r.title} - ${r.recommendation}</li>`).join('') || '<li>Foundation strengthening as needed</li>'}
      </ul>
    </div>

    <!-- Control Details -->
    <div class="section page-break">
      <h2>Control Assessment Details</h2>
      <table>
        <thead>
          <tr>
            <th>Control</th>
            <th>Title</th>
            <th>Status</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          ${(controls.details || []).slice(0, 30).map(c => `
            <tr>
              <td>${c.code}</td>
              <td>${c.title}</td>
              <td><span class="badge ${c.status}">${c.status}</span></td>
              <td>${c.confidence || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Evidence -->
    <div class="section">
      <h2>Evidence Reviewed</h2>
      <p>${evidence.analyzed} of ${evidence.total} documents analyzed</p>
      <table>
        <thead>
          <tr>
            <th>Document</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(evidence.documents || []).map(e => `
            <tr>
              <td>${e.name}</td>
              <td>${e.type || '-'}</td>
              <td>${e.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Disclaimer -->
    <div class="disclaimer">
      <h3>Important Disclaimer</h3>
      <p>${disclaimer}</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Fallback summary when AI is not available
 */
function generateFallbackSummary(assessment, scoreData, risks) {
  const score = scoreData.score;
  const gapCount = scoreData.breakdown?.gap || 0;
  const riskCount = risks?.length || 0;

  let status = "not_ready";
  let headline = "Significant Work Required";
  
  if (score >= 80) {
    status = "ready";
    headline = "Organisation Appears Ready for Audit";
  } else if (score >= 50) {
    status = "needs_work";
    headline = "Remediation Needed Before Audit";
  }

  return {
    headline,
    summary: `This assessment evaluated the organisation against ISO 27001 Annex A controls. The overall readiness score is ${score}%, with ${gapCount} control gaps identified and ${riskCount} risks to address. ${score >= 50 ? 'With focused remediation, certification readiness is achievable.' : 'Significant work is required to build a compliant security programme.'}`,
    key_findings: [
      `Overall readiness score: ${score}%`,
      `${scoreData.breakdown?.compliant || 0} controls appear compliant`,
      `${gapCount} control gaps require attention`,
      `${riskCount} risks identified for remediation`,
    ],
    strengths: score >= 50 
      ? ["Some security controls are in place", "Documentation foundation exists"]
      : ["Assessment provides clear baseline", "Gap analysis complete"],
    priority_actions: (risks || []).slice(0, 5).map((r, i) => ({
      action: r.recommendation || r.title,
      impact: r.severity === "high" ? "high" : "medium",
      timeframe: r.remediation_timeframe || "60-day",
      rationale: r.description,
    })),
    certification_readiness: {
      status,
      explanation: headline,
      estimated_timeline: score >= 80 ? "1-2 months" : score >= 50 ? "3-4 months" : "6+ months",
    },
    disclaimer: getDisclaimer(),
  };
}

/**
 * Group controls by domain
 */
function groupControlsByDomain(controlResults) {
  const byDomain = {};
  
  for (const cr of controlResults) {
    const domain = cr.controls?.domain || "Other";
    if (!byDomain[domain]) {
      byDomain[domain] = { compliant: 0, partial: 0, gap: 0, total: 0 };
    }
    byDomain[domain][cr.status] = (byDomain[domain][cr.status] || 0) + 1;
    byDomain[domain].total++;
  }
  
  return byDomain;
}

/**
 * Group risks by severity
 */
function groupBySeverity(risks) {
  return {
    critical: risks.filter((r) => r.severity === "critical").length,
    high: risks.filter((r) => r.severity === "high").length,
    medium: risks.filter((r) => r.severity === "medium").length,
    low: risks.filter((r) => r.severity === "low").length,
  };
}

/**
 * Standard disclaimer
 */
function getDisclaimer() {
  return `This report is provided for decision-support purposes only and does not constitute certification, legal advice, or a guarantee of compliance. The assessments contained herein are based on information provided during the assessment period and may not reflect all aspects of the organisation's security posture. This report is not a substitute for formal certification audits conducted by accredited certification bodies. All AI-assisted assessments should be reviewed by qualified personnel before taking action. Securar and its affiliates accept no liability for decisions made based on this report.`;
}

