import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { supabaseAdmin } from "./supabaseAdmin.js";
import { runFullAnalysis } from "./ai/analysisEngine.js";
import { computeReadinessScore, computeDomainScores } from "./scoring.js";
import { deriveRisks } from "./riskEngine.js";
import { generateReport, generateReportHTML } from "./reports/generator.js";
import { getAIProvider, isAIEnabled } from "./ai/client.js";

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-shared-secret"],
}));
app.use(express.json({ limit: "10mb" }));

const admin = supabaseAdmin();

// Auth middleware — verifies Supabase JWT or shared backend secret
async function requireAuth(req, res, next) {
  // Allow internal calls with shared secret
  const sharedSecret = process.env.NODE_BACKEND_SECRET;
  if (sharedSecret && req.headers["x-shared-secret"] === sharedSecret) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }
  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
  req.user = user;
  next();
}

// In-memory rate limiter — use Redis in production for distributed deployments
const rateLimitMap = new Map();
function rateLimitMiddleware(maxRequests = 20, windowMs = 60_000) {
  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= maxRequests) {
      return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
    }
    entry.count++;
    next();
  };
}

app.use("/assessments", requireAuth);
app.use("/evidence", requireAuth);

// ============================================
// Health Check
// ============================================
app.get("/health", (_req, res) => {
  const provider = getAIProvider();
  res.json({
    ok: true,
    service: "securar-backend",
    version: "1.0.0",
    ai_enabled: isAIEnabled(),
    ai_provider: provider || "none",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Run Assessment Analysis
// ============================================
app.post("/assessments/:id/run", rateLimitMiddleware(5, 60_000), async (req, res) => {
  const paramsSchema = z.object({ id: z.string().uuid() });
  
  let assessmentId;
  try {
    const parsed = paramsSchema.parse(req.params);
    assessmentId = parsed.id;
  } catch (e) {
    return res.status(400).json({ ok: false, error: "Invalid assessment ID" });
  }

  console.log(`[Server] Starting assessment run: ${assessmentId}`);

  try {
    // 1) Load assessment to verify it exists
    const { data: assessment, error: aErr } = await admin
      .from("assessments")
      .select("*, organisations(*)")
      .eq("id", assessmentId)
      .single();

    if (aErr || !assessment) {
      return res.status(404).json({ ok: false, error: "Assessment not found" });
    }

    // 2) Update status to analysing
    await admin
      .from("assessments")
      .update({ status: "analysing" })
      .eq("id", assessmentId);

    // 3) Run AI analysis
    const analysisResult = await runFullAnalysis(assessmentId);

    // 4) Upsert control results
    const controlRows = analysisResult.controlResults.map((r) => ({
      assessment_id: assessmentId,
      control_id: r.control_id,
      status: r.status,
      reasoning: r.reasoning,
      confidence: r.confidence,
      evidence_refs: r.source_inputs || [],
    }));

    const { error: crErr } = await admin
      .from("control_results")
      .upsert(controlRows, { onConflict: "assessment_id,control_id" });

    if (crErr) {
      console.error("[Server] Control results upsert error:", crErr);
    }

    // 5) Generate risks from gaps
    const gaps = analysisResult.controlResults.filter((r) => r.status === "gap" || r.status === "partial");
    const risks = deriveRisks(gaps, assessment.organisations);

    // Replace risks for this assessment
    await admin.from("risks").delete().eq("assessment_id", assessmentId);
    
    if (risks.length > 0) {
      // Only include columns that exist in the database table
      const riskRows = risks.map((r) => ({
        assessment_id: assessmentId,
        title: r.title,
        description: r.description,
        severity: r.severity,
        likelihood: r.likelihood,
        impact: r.impact,
        recommendation: r.recommendation,
        remediation_timeframe: r.remediation_timeframe,
        risk_references: r.risk_references || {},
      }));
      
      const { error: riskErr } = await admin.from("risks").insert(riskRows);
      if (riskErr) {
        console.error("[Server] Risks insert error:", riskErr);
      } else {
        console.log(`[Server] Inserted ${riskRows.length} risks`);
      }
    }

    // 6) Calculate scores
    const { score, breakdown } = computeReadinessScore(analysisResult.controlResults);
    const domainScores = computeDomainScores(analysisResult.controlResults, analysisResult.context?.framework?.controlsByDomain);

    // 7) Update assessment with final results
    const { error: updateErr } = await admin
      .from("assessments")
      .update({
        status: "completed",
        readiness_score: score,
        score_breakdown: {
          ...breakdown,
          domains: domainScores,
          summary: analysisResult.summary,
        },
      })
      .eq("id", assessmentId);

    if (updateErr) {
      console.error("[Server] Assessment update error:", updateErr);
    }

    // 8) Log the analysis
    await admin.from("audit_logs").insert({
      org_id: assessment.organisations?.id,
      action: "assessment_completed",
      entity_type: "assessment",
      entity_id: assessmentId,
      meta: {
        readiness_score: score,
        controls_assessed: analysisResult.summary.controlsAssessed,
        risks_identified: risks.length,
        ai_enabled: isAIEnabled(),
        ai_provider: getAIProvider(),
      },
    });

    console.log(`[Server] Assessment complete: ${assessmentId}, Score: ${score}%`);

    return res.json({
      ok: true,
      assessment_id: assessmentId,
      readiness_score: score,
      breakdown,
      summary: analysisResult.summary,
      risks_generated: risks.length,
    });
  } catch (err) {
    console.error("[Server] Assessment run error:", err);

    // Try to mark as failed
    await admin
      .from("assessments")
      .update({ status: "draft" })
      .eq("id", assessmentId)
      .catch(() => {});

    return res.status(500).json({
      ok: false,
      error: "Assessment analysis failed. Please try again.",
    });
  }
});

// ============================================
// Process Single Evidence Document
// ============================================
app.post("/evidence/:id/process", async (req, res) => {
  const paramsSchema = z.object({ id: z.string().uuid() });

  let evidenceId;
  try {
    evidenceId = paramsSchema.parse(req.params).id;
  } catch (e) {
    return res.status(400).json({ ok: false, error: "Invalid evidence ID" });
  }

  try {
    // Load evidence record
    const { data: evidence, error: eErr } = await admin
      .from("evidence")
      .select("*")
      .eq("id", evidenceId)
      .single();

    if (eErr || !evidence) {
      return res.status(404).json({ ok: false, error: "Evidence not found" });
    }

    // Load controls for analysis
    const { data: controls } = await admin
      .from("controls")
      .select("*")
      .eq("framework", "iso27001");

    // Import and run analysis
    const { analyzeEvidence } = await import("./ai/analysisEngine.js");
    const result = await analyzeEvidence(evidence, controls);

    return res.json({
      ok: result.success,
      evidence_id: evidenceId,
      analysis: result.analysis,
      error: result.error,
    });
  } catch (err) {
    console.error("[Server] Evidence processing error:", err);
    return res.status(500).json({
      ok: false,
      error: "Evidence processing failed. Please try again.",
    });
  }
});

// ============================================
// Get Assessment Status
// ============================================
app.get("/assessments/:id/status", async (req, res) => {
  const paramsSchema = z.object({ id: z.string().uuid() });

  let assessmentId;
  try {
    assessmentId = paramsSchema.parse(req.params).id;
  } catch (e) {
    return res.status(400).json({ ok: false, error: "Invalid assessment ID" });
  }

  try {
    const { data: assessment, error } = await admin
      .from("assessments")
      .select("id, status, readiness_score, score_breakdown, updated_at")
      .eq("id", assessmentId)
      .single();

    if (error || !assessment) {
      return res.status(404).json({ ok: false, error: "Assessment not found" });
    }

    // Get counts
    const [
      { count: controlCount },
      { count: riskCount },
      { count: evidenceCount },
    ] = await Promise.all([
      admin.from("control_results").select("*", { count: "exact", head: true }).eq("assessment_id", assessmentId),
      admin.from("risks").select("*", { count: "exact", head: true }).eq("assessment_id", assessmentId),
      admin.from("evidence").select("*", { count: "exact", head: true }).eq("assessment_id", assessmentId),
    ]);

    return res.json({
      ok: true,
      assessment: {
        ...assessment,
        controls_assessed: controlCount,
        risks_identified: riskCount,
        evidence_count: evidenceCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Failed to load assessment status." });
  }
});

// ============================================
// Generate Report
// ============================================
app.post("/assessments/:id/report", async (req, res) => {
  const paramsSchema = z.object({ id: z.string().uuid() });

  let assessmentId;
  try {
    assessmentId = paramsSchema.parse(req.params).id;
  } catch (e) {
    return res.status(400).json({ ok: false, error: "Invalid assessment ID" });
  }

  try {
    const { report, reportId } = await generateReport(assessmentId);
    
    return res.json({
      ok: true,
      report_id: reportId,
      report,
    });
  } catch (err) {
    console.error("[Server] Report generation error:", err);
    return res.status(500).json({
      ok: false,
      error: "Report generation failed. Please try again.",
    });
  }
});

// ============================================
// Get Report HTML (for PDF generation)
// ============================================
app.get("/assessments/:id/report/html", async (req, res) => {
  const paramsSchema = z.object({ id: z.string().uuid() });

  let assessmentId;
  try {
    assessmentId = paramsSchema.parse(req.params).id;
  } catch (e) {
    return res.status(400).json({ ok: false, error: "Invalid assessment ID" });
  }

  try {
    // Load existing report
    const { data: reportRecord, error } = await admin
      .from("reports")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !reportRecord) {
      // Generate new report if none exists
      const { report } = await generateReport(assessmentId);
      const html = generateReportHTML(report);
      return res.type("html").send(html);
    }

    const html = generateReportHTML(reportRecord.summary);
    return res.type("html").send(html);
  } catch (err) {
    console.error("[Server] Report HTML error:", err);
    return res.status(500).json({
      ok: false,
      error: "Report generation failed. Please try again.",
    });
  }
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  const provider = getAIProvider();
  console.log(`[Server] Securar Backend running on :${PORT}`);
  console.log(`[Server] AI enabled: ${isAIEnabled()}`);
  console.log(`[Server] AI provider: ${provider || "none (using rule-based analysis)"}`);
  
  if (!isAIEnabled()) {
    console.log(`[Server] ⚠️  To enable AI analysis, set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env`);
  }
});
