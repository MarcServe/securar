/**
 * AI Analysis Engine
 * 
 * Integrates document parsing, Claude AI analysis, and control mapping
 * into a unified analysis pipeline.
 */

import { supabaseAdmin } from "../supabaseAdmin.js";
import { parseDocument, truncateText } from "../parsers/index.js";
import { callClaudeJSON, isAIEnabled, getAIProvider } from "./client.js";
import { buildAIContext, summarizeContext } from "./contextBuilder.js";
import {
  EVIDENCE_ANALYSIS_SYSTEM,
  buildEvidenceAnalysisPrompt,
  validateEvidenceAnalysis,
} from "./prompts/evidence-analysis.js";
import {
  CONTROL_MAPPING_SYSTEM,
  buildControlMappingPrompt,
  validateControlMapping,
} from "./prompts/control-mapping.js";
import { validateControlAssessment, cleanForbiddenLanguage } from "./guardrails.js";

const admin = supabaseAdmin();

/**
 * Process a single evidence document
 * 
 * @param {Object} evidence - Evidence record from database
 * @param {Array} controls - Framework controls
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeEvidence(evidence, controls) {
  console.log(`[AI] Analyzing evidence: ${evidence.file_name}`);

  try {
    // Update status to parsing
    await admin
      .from("evidence")
      .update({ status: "parsing" })
      .eq("id", evidence.id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await admin.storage
      .from("evidence")
      .download(evidence.file_path);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Parse document
    const parseResult = await parseDocument(
      buffer,
      evidence.file_type,
      evidence.file_name
    );

    if (!parseResult.success) {
      await admin
        .from("evidence")
        .update({
          status: "failed",
          meta: { ...evidence.meta, error: parseResult.error },
        })
        .eq("id", evidence.id);

      return { success: false, error: parseResult.error };
    }

    // Truncate text for AI context
    const truncatedText = truncateText(parseResult.text, 15000);

    // Analyze with Claude
    const analysisPrompt = buildEvidenceAnalysisPrompt(
      { ...evidence, parsed_text: truncatedText },
      controls
    );

    let analysis;
    try {
      analysis = await callClaudeJSON({
        systemPrompt: EVIDENCE_ANALYSIS_SYSTEM,
        userPrompt: analysisPrompt,
      });

      // Validate output
      validateEvidenceAnalysis(analysis);
    } catch (aiError) {
      console.error(`[AI] Analysis failed for ${evidence.file_name}:`, aiError);
      // Continue with basic analysis if AI fails
      analysis = {
        document_type: "other",
        summary: "Document uploaded but AI analysis failed. Manual review recommended.",
        controls_addressed: [],
        quality_score: 0,
        quality_notes: "AI analysis error",
      };
    }

    // Update evidence record
    await admin
      .from("evidence")
      .update({
        status: "parsed",
        parsed_text: truncatedText,
        ai_summary: analysis.summary,
        ai_analysis: analysis,
        meta: {
          ...evidence.meta,
          parsed_at: new Date().toISOString(),
          word_count: parseResult.wordCount,
          has_structure: parseResult.hasStructure,
        },
      })
      .eq("id", evidence.id);

    console.log(`[AI] Evidence analysis complete: ${evidence.file_name}`);

    return {
      success: true,
      evidence_id: evidence.id,
      analysis,
    };
  } catch (error) {
    console.error(`[AI] Error analyzing evidence ${evidence.id}:`, error);

    await admin
      .from("evidence")
      .update({
        status: "failed",
        meta: { ...evidence.meta, error: error.message },
      })
      .eq("id", evidence.id);

    return { success: false, error: error.message };
  }
}

/**
 * Analyze all pending evidence for an assessment
 * 
 * @param {string} assessmentId - Assessment ID
 * @param {Array} controls - Framework controls
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeAllEvidence(assessmentId, controls) {
  // Get all evidence that hasn't been analyzed
  const { data: evidence, error } = await admin
    .from("evidence")
    .select("*")
    .eq("assessment_id", assessmentId)
    .in("status", ["uploaded", "failed"]);

  if (error) {
    throw new Error(`Failed to load evidence: ${error.message}`);
  }

  if (!evidence || evidence.length === 0) {
    return { analyzed: 0, results: [] };
  }

  console.log(`[AI] Analyzing ${evidence.length} evidence documents`);

  // Process evidence sequentially to avoid rate limits
  const results = [];
  for (const doc of evidence) {
    const result = await analyzeEvidence(doc, controls);
    results.push(result);

    // Small delay between documents
    await new Promise((r) => setTimeout(r, 500));
  }

  return {
    analyzed: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

/**
 * Map a single control using AI
 * 
 * @param {Object} control - Control to assess
 * @param {Object} signals - Questionnaire and evidence signals
 * @param {Object} context - AI context
 * @returns {Promise<Object>} Control assessment
 */
export async function mapControlWithAI(control, signals, context) {
  const prompt = buildControlMappingPrompt(control, signals, context.organizational);

  try {
    const assessment = await callClaudeJSON({
      systemPrompt: CONTROL_MAPPING_SYSTEM,
      userPrompt: prompt,
    });

    // Validate output
    validateControlMapping(assessment);

    // Run guardrails
    const validation = validateControlAssessment(assessment);
    if (!validation.valid) {
      console.warn(`[AI] Guardrail violations for ${control.control_code}:`, validation.errors);
      // Clean up output
      if (assessment.reasoning) {
        assessment.reasoning = cleanForbiddenLanguage(assessment.reasoning);
      }
    }

    return assessment;
  } catch (error) {
    console.error(`[AI] Control mapping failed for ${control.control_code}:`, error);

    // Return conservative fallback
    return {
      control_code: control.control_code,
      status: "unknown",
      confidence: "low",
      reasoning: "AI analysis could not complete. Manual review required.",
      source_inputs: [],
      evidence_gaps: ["AI analysis failed - manual assessment needed"],
    };
  }
}

/**
 * Build signals for a control from questionnaire and evidence
 * 
 * @param {Object} control - Control to get signals for
 * @param {Array} responses - Questionnaire responses
 * @param {Array} evidence - Evidence with analysis
 * @param {Array} questions - Question definitions
 * @returns {Object} Signals for the control
 */
export function buildControlSignals(control, responses, evidence, questions) {
  if (!Array.isArray(responses)) responses = [];
  if (!Array.isArray(evidence)) evidence = [];
  if (!Array.isArray(questions)) questions = [];

  // Find relevant questionnaire responses
  const relevantResponses = [];

  for (const response of responses) {
    const question = questions.find((q) => q.id === response.question_id);
    if (question) {
      // Check if question is linked to this control
      const controlRefs = question.control_refs || [];
      if (controlRefs.includes(control.control_code) || controlRefs.length === 0) {
        relevantResponses.push({
          question: question.question_text,
          answer: typeof response.answer === "object" 
            ? response.answer.value 
            : response.answer,
          domain: question.domain,
        });
      }
    }
  }

  // Find relevant evidence
  const relevantEvidence = [];
  
  for (const doc of evidence) {
    if (doc.status !== "parsed" || !doc.ai_analysis) continue;

    const analysis = doc.ai_analysis;
    const controlsAddressed = analysis.controls_addressed || [];

    for (const addressed of controlsAddressed) {
      if (addressed.control_code === control.control_code) {
        relevantEvidence.push({
          file_name: doc.file_name,
          relevance: addressed.relevance,
          excerpt: addressed.evidence_excerpt,
          confidence: addressed.confidence,
        });
      }
    }
  }

  return {
    responses: relevantResponses.slice(0, 5), // Limit for context
    evidence: relevantEvidence.slice(0, 3),
  };
}

/**
 * Run full AI-powered analysis for an assessment
 * 
 * @param {string} assessmentId - Assessment ID
 * @returns {Promise<Object>} Full analysis results
 */
export async function runFullAnalysis(assessmentId) {
  console.log(`[AI] Starting full analysis for assessment ${assessmentId}`);

  // Load assessment with org
  const { data: assessment, error: aErr } = await admin
    .from("assessments")
    .select("*, organisations(*)")
    .eq("id", assessmentId)
    .single();

  if (aErr) throw new Error(`Assessment not found: ${aErr.message}`);

  // Load all related data
  const [
    { data: responses },
    { data: evidence },
    { data: controls },
    { data: questions },
  ] = await Promise.all([
    admin.from("responses").select("*").eq("assessment_id", assessmentId),
    admin.from("evidence").select("*").eq("assessment_id", assessmentId),
    admin.from("controls").select("*").in("framework", assessment.target_frameworks || ["iso27001"]),
    admin.from("questions").select("*").eq("framework_tag", "iso27001"),
  ]);

  // Build AI context
  const context = buildAIContext({
    organisation: assessment.organisations,
    assessment,
    responses,
    evidence,
    controls,
  });

  console.log(`[AI] Context: ${summarizeContext(context)}`);

  // Analyze any pending evidence
  if (isAIEnabled()) {
    console.log(`[AI] Using AI provider: ${getAIProvider()}`);
    const evidenceResults = await analyzeAllEvidence(assessmentId, controls);
    console.log(`[AI] Evidence analysis: ${evidenceResults.analyzed} documents processed`);

    // Reload evidence with analysis
    const { data: updatedEvidence } = await admin
      .from("evidence")
      .select("*")
      .eq("assessment_id", assessmentId);

    context.assessment.evidenceDocuments = updatedEvidence || evidence;
  }

  // Map controls (use AI if available, fallback to rule-based)
  const controlResults = [];
  const useAI = isAIEnabled();

  for (const control of controls || []) {
    const signals = buildControlSignals(
      control,
      responses || [],
      context.assessment.evidenceDocuments,
      questions || []
    );

    let result;
    if (useAI && (signals.responses.length > 0 || signals.evidence.length > 0)) {
      result = await mapControlWithAI(control, signals, context);
      // Add small delay for rate limiting
      await new Promise((r) => setTimeout(r, 200));
    } else {
      // Rule-based fallback
      result = mapControlRuleBased(control, signals);
    }

    controlResults.push({
      control_id: control.id,
      control_code: control.control_code,
      ...result,
    });
  }

  console.log(`[AI] Mapped ${controlResults.length} controls`);

  return {
    assessmentId,
    controlResults,
    context,
    summary: {
      controlsAssessed: controlResults.length,
      compliant: controlResults.filter((r) => r.status === "compliant").length,
      partial: controlResults.filter((r) => r.status === "partial").length,
      gaps: controlResults.filter((r) => r.status === "gap").length,
      evidenceAnalyzed: context.assessment.parsedEvidenceCount,
      questionsAnswered: context.assessment.responseCount,
    },
  };
}

/**
 * Rule-based control mapping fallback
 */
function mapControlRuleBased(control, signals) {
  try {
  if (!signals || !Array.isArray(signals.evidence)) signals = { evidence: [], responses: [] };
  const hasEvidence = signals.evidence.length > 0;
  const hasResponses = signals.responses.length > 0;

  // Check for positive responses
  const positiveResponses = signals.responses.filter((r) => {
    const answer = String(r.answer || "").toLowerCase();
    return answer.includes("yes") || answer.includes("annually") || answer.includes("regularly");
  });

  let status = "gap";
  let confidence = "low";
  let reasoning = "";

  if (hasEvidence && positiveResponses.length > 0) {
    status = "compliant";
    confidence = "medium";
    reasoning = `Evidence found (${signals.evidence.map((e) => e.file_name).join(", ")}) and positive questionnaire responses support this control.`;
  } else if (hasEvidence || positiveResponses.length > 0) {
    status = "partial";
    confidence = "low";
    reasoning = hasEvidence
      ? "Evidence found but questionnaire responses are incomplete."
      : "Positive responses but no supporting documentation uploaded.";
  } else if (hasResponses) {
    status = "gap";
    confidence = "low";
    reasoning = "Responses indicate this control may not be fully implemented.";
  } else {
    status = "unknown";
    confidence = "low";
    reasoning = "Insufficient data to assess this control.";
  }

  return {
    status,
    confidence,
    reasoning,
    source_inputs: [
      ...signals.responses.map((r) => ({
        type: "questionnaire",
        reference: r.question,
        excerpt: r.answer,
      })),
      ...signals.evidence.map((e) => ({
        type: "evidence",
        reference: e.file_name,
        excerpt: e.excerpt,
      })),
    ],
    evidence_gaps: status !== "compliant"
      ? ["Additional documentation may strengthen this assessment"]
      : [],
  };
  } catch (err) {
    console.error("[analysisEngine] mapControlRuleBased error:", err);
    return {
      status: "unknown",
      confidence: "low",
      reasoning: "Rule-based assessment failed. Manual review required.",
      source_inputs: [],
      evidence_gaps: ["Assessment error - manual review needed"],
    };
  }
}

