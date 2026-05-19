import type { ReportData } from "./generate-report";

function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateReportHTML(report: ReportData): string {
  const { organisation, executive_summary, scores, controls, risks, evidence, disclaimer } =
    report;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Security Assessment Report - ${esc(organisation.name)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a2e; background: #fff; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    .cover { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; text-align: center; page-break-after: always; }
    .cover h1 { font-size: 32pt; font-weight: 700; color: #6366f1; margin-bottom: 16px; }
    .cover h2 { font-size: 18pt; font-weight: 500; color: #64748b; margin-bottom: 40px; }
    .cover .meta { margin-top: 60px; color: #94a3b8; }
    .section { margin-bottom: 40px; page-break-inside: avoid; }
    .section h2 { font-size: 16pt; font-weight: 600; color: #6366f1; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 20px; }
    .section h3 { font-size: 13pt; font-weight: 600; color: #334155; margin: 20px 0 12px 0; }
    .score-display { text-align: center; padding: 30px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; color: white; margin-bottom: 24px; }
    .score-display .score { font-size: 48pt; font-weight: 700; }
    .status-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
    .status-card { padding: 16px; border-radius: 12px; text-align: center; }
    .status-card.compliant { background: #dcfce7; color: #166534; }
    .status-card.partial { background: #fef3c7; color: #92400e; }
    .status-card.gap { background: #fee2e2; color: #991b1b; }
    .status-card.na { background: #f1f5f9; color: #64748b; }
    .status-card .count { font-size: 24pt; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; color: #475569; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 9pt; font-weight: 500; }
    .badge.critical { background: #fef2f2; color: #dc2626; }
    .badge.high { background: #fff7ed; color: #ea580c; }
    .badge.medium { background: #fefce8; color: #ca8a04; }
    .badge.low { background: #f0fdf4; color: #16a34a; }
    .badge.compliant { background: #dcfce7; color: #166534; }
    .badge.partial { background: #fef3c7; color: #92400e; }
    .badge.gap { background: #fee2e2; color: #991b1b; }
    .finding { padding: 16px; background: #f8fafc; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #6366f1; }
    .finding.high { border-left-color: #dc2626; }
    .finding.medium { border-left-color: #f59e0b; }
    .finding-title { font-weight: 600; margin-bottom: 8px; }
    .finding-text { color: #64748b; font-size: 10pt; }
    .disclaimer { margin-top: 60px; padding: 20px; background: #f8fafc; border-radius: 8px; font-size: 9pt; color: #64748b; }
    .page-break { page-break-before: always; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="cover">
      <h1>Security Assessment Report</h1>
      <h2>${esc(organisation.name)}</h2>
      <p>ISO 27001 Readiness Assessment</p>
      <div class="meta">
        <p>Generated: ${esc(new Date(report.meta.generated_at).toLocaleDateString("en-GB"))}</p>
        <p>Framework: ${esc(report.meta.framework.toUpperCase())}</p>
      </div>
    </div>

    <div class="section">
      <h2>Executive Summary</h2>
      <p><strong>${esc(executive_summary.headline)}</strong></p>
      <p>${esc(executive_summary.summary)}</p>
      <h3>Key Findings</h3>
      <ul>
        ${executive_summary.key_findings.map((f) => `<li>${esc(f)}</li>`).join("")}
      </ul>
    </div>

    <div class="section">
      <h2>Readiness Score</h2>
      <div class="score-display">
        <div class="score">${esc(scores.overall)}%</div>
        <div class="label">Overall Readiness</div>
      </div>
      <div class="status-grid">
        <div class="status-card compliant"><div class="count">${esc(scores.breakdown?.compliant ?? 0)}</div><div>Compliant</div></div>
        <div class="status-card partial"><div class="count">${esc(scores.breakdown?.partial ?? 0)}</div><div>Partial</div></div>
        <div class="status-card gap"><div class="count">${esc(scores.breakdown?.gap ?? 0)}</div><div>Gaps</div></div>
        <div class="status-card na"><div class="count">${esc(scores.breakdown?.not_applicable ?? 0)}</div><div>N/A</div></div>
      </div>
      <h3>Certification Readiness</h3>
      <p><strong>Status:</strong> ${esc(scores.readiness?.status)}</p>
      <p>${esc(scores.readiness?.message)}</p>
    </div>

    <div class="section page-break">
      <h2>Top Risks</h2>
      ${risks.details
        .slice(0, 10)
        .map(
          (risk) => `
        <div class="finding ${esc(risk.severity)}">
          <div class="finding-title">
            <span class="badge ${esc(risk.severity)}">${esc(risk.severity.toUpperCase())}</span>
            ${esc(risk.title)}
          </div>
          <p class="finding-text">${esc(risk.description)}</p>
          <p><strong>Recommendation:</strong> ${esc(risk.recommendation)}</p>
        </div>`
        )
        .join("")}
    </div>

    <div class="section">
      <h2>Remediation Roadmap</h2>
      <h3>30-Day Priority Actions</h3>
      <ul>
        ${(risks.remediation_roadmap["30-day"] || [])
          .slice(0, 5)
          .map((r) => `<li>${esc(r.title)} — ${esc(r.recommendation)}</li>`)
          .join("") || "<li>No critical actions identified</li>"}
      </ul>
      <h3>60-Day Actions</h3>
      <ul>
        ${(risks.remediation_roadmap["60-day"] || [])
          .slice(0, 5)
          .map((r) => `<li>${esc(r.title)} — ${esc(r.recommendation)}</li>`)
          .join("") || "<li>No high-priority actions identified</li>"}
      </ul>
      <h3>90-Day Actions</h3>
      <ul>
        ${(risks.remediation_roadmap["90-day"] || [])
          .slice(0, 5)
          .map((r) => `<li>${esc(r.title)} — ${esc(r.recommendation)}</li>`)
          .join("") || "<li>Foundation strengthening as needed</li>"}
      </ul>
    </div>

    <div class="section page-break">
      <h2>Control Assessment Details</h2>
      <table>
        <thead><tr><th>Control</th><th>Title</th><th>Status</th><th>Confidence</th></tr></thead>
        <tbody>
          ${controls.details
            .slice(0, 50)
            .map(
              (c) => `
            <tr>
              <td>${esc(c.code)}</td>
              <td>${esc(c.title)}</td>
              <td><span class="badge ${esc(c.status)}">${esc(c.status)}</span></td>
              <td>${esc(c.confidence || "—")}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Evidence Reviewed</h2>
      <p>${esc(evidence.analyzed)} of ${esc(evidence.total)} documents analyzed</p>
      <table>
        <thead><tr><th>Document</th><th>Type</th><th>Status</th></tr></thead>
        <tbody>
          ${evidence.documents
            .map(
              (e) => `
            <tr><td>${esc(e.name)}</td><td>${esc(e.type || "—")}</td><td>${esc(e.status)}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="disclaimer">
      <h3>Important Disclaimer</h3>
      <p>${esc(disclaimer)}</p>
    </div>
  </div>
</body>
</html>`;
}
