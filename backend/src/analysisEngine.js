/**
 * Analysis Engine for Security Readiness Assessment
 * 
 * This module contains the core logic for:
 * - Mapping questionnaire responses + evidence to controls
 * - Deriving risk findings from gaps
 * - Generating explainable reasoning
 * 
 * MVP version uses rule-based logic.
 * Production version will integrate Claude AI for intelligent analysis.
 */

/**
 * Map controls to compliance status based on available evidence
 * 
 * MVP Implementation: Basic rule-based mapping
 * TODO: Replace with AI-powered analysis in ai/controlMapping.js
 * 
 * @param {Object} params - Input parameters
 * @param {Array} params.controls - Control definitions from database
 * @param {Array} params.responses - Questionnaire responses
 * @param {Array} params.evidence - Uploaded evidence documents
 * @param {Object} params.orgContext - Organisation context (size, industry, etc.)
 * @returns {Array} Control mapping results
 */
export function mapControlsMVP({ controls, responses, evidence, orgContext = {} }) {
  // Build lookup maps for efficient access
  const responseByQuestionId = new Map(responses.map(r => [r.question_id, r]));
  const evidenceByType = groupEvidenceByType(evidence);

  return controls.map(control => {
    // Find relevant evidence for this control
    const relevantEvidence = findRelevantEvidence(control, evidence, evidenceByType);
    const hasEvidence = relevantEvidence.length > 0;
    
    // Find relevant questionnaire responses
    const relevantResponses = findRelevantResponses(control, responses, responseByQuestionId);
    const hasResponses = relevantResponses.length > 0;

    // Determine status based on evidence and responses
    const { status, confidence } = determineControlStatus(
      control, 
      relevantEvidence, 
      relevantResponses,
      orgContext
    );

    // Generate reasoning (explainability requirement)
    const reasoning = generateReasoning(
      control,
      status,
      relevantEvidence,
      relevantResponses,
      confidence
    );

    // Build source inputs for audit trail
    const sourceInputs = buildSourceInputs(relevantEvidence, relevantResponses);

    return {
      control_id: control.id,
      status,
      reasoning,
      confidence,
      evidence_refs: relevantEvidence.map(e => ({
        evidence_id: e.id,
        file_name: e.file_name,
        excerpt: e.ai_summary || null
      })),
      source_inputs: sourceInputs
    };
  });
}

/**
 * Group evidence by file type for efficient lookup
 */
function groupEvidenceByType(evidence) {
  return evidence.reduce((acc, e) => {
    const type = e.file_type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(e);
    return acc;
  }, {});
}

/**
 * Find evidence relevant to a specific control
 * 
 * MVP: Simple keyword matching on file names and AI summaries
 * Production: AI-powered semantic matching
 */
function findRelevantEvidence(control, evidence, evidenceByType) {
  const keywords = extractControlKeywords(control);
  
  return evidence.filter(e => {
    const searchText = [
      e.file_name,
      e.ai_summary || '',
      JSON.stringify(e.ai_analysis || {})
    ].join(' ').toLowerCase();
    
    return keywords.some(kw => searchText.includes(kw.toLowerCase()));
  });
}

/**
 * Extract keywords from control for matching
 */
function extractControlKeywords(control) {
  const keywords = [];
  
  // Add domain keywords
  if (control.domain) {
    keywords.push(...control.domain.toLowerCase().split(' '));
  }
  
  // Add title keywords
  if (control.title) {
    keywords.push(...control.title.toLowerCase().split(' ').filter(w => w.length > 3));
  }
  
  // Add control code
  keywords.push(control.control_code);
  
  // Common policy document keywords by domain
  const domainKeywords = {
    'Information Security Policies': ['policy', 'isms', 'information security'],
    'Access Control': ['access', 'password', 'authentication', 'mfa', 'privileges'],
    'Cryptography': ['encryption', 'crypto', 'key management', 'tls', 'ssl'],
    'Operations Security': ['backup', 'logging', 'monitoring', 'malware', 'antivirus'],
    'Business Continuity': ['continuity', 'disaster recovery', 'bcp', 'drp'],
    'Incident Management': ['incident', 'breach', 'response']
  };
  
  for (const [domain, kws] of Object.entries(domainKeywords)) {
    if (control.domain?.includes(domain)) {
      keywords.push(...kws);
    }
  }
  
  return [...new Set(keywords)];
}

/**
 * Find questionnaire responses relevant to a control
 */
function findRelevantResponses(control, responses, responseByQuestionId) {
  // In production, questions would have control_refs linking them to controls
  // For MVP, we return all responses (AI will filter in production)
  return responses.filter(r => {
    // Check if response's question is linked to this control
    // This requires the question to have control_refs populated
    return true; // MVP: include all responses for analysis
  }).slice(0, 5); // Limit for MVP
}

/**
 * Determine control compliance status
 */
function determineControlStatus(control, evidence, responses, orgContext) {
  const hasEvidence = evidence.length > 0;
  const hasParsedEvidence = evidence.some(e => e.status === 'parsed' && e.parsed_text);
  const hasAIAnalysis = evidence.some(e => e.ai_analysis && Object.keys(e.ai_analysis).length > 0);

  // Check for positive responses
  const positiveResponses = responses.filter(r => {
    const answer = r.answer;
    if (typeof answer === 'boolean') return answer;
    if (typeof answer === 'string') return ['yes', 'true', 'implemented'].includes(answer.toLowerCase());
    if (answer?.value) return ['yes', 'true', 'implemented'].includes(String(answer.value).toLowerCase());
    return false;
  });

  // Determine status based on signals
  if (hasAIAnalysis && positiveResponses.length > 0) {
    return { status: 'compliant', confidence: 'high' };
  }
  
  if (hasParsedEvidence && positiveResponses.length > 0) {
    return { status: 'compliant', confidence: 'medium' };
  }
  
  if (hasEvidence || positiveResponses.length > 0) {
    return { status: 'partial', confidence: 'medium' };
  }
  
  if (responses.length > 0) {
    return { status: 'partial', confidence: 'low' };
  }

  return { status: 'gap', confidence: 'low' };
}

/**
 * Generate explainable reasoning for control status
 * 
 * Every AI output must include reasoning (context engineering requirement)
 */
function generateReasoning(control, status, evidence, responses, confidence) {
  const evidenceCount = evidence.length;
  const responseCount = responses.length;

  const templates = {
    compliant: `Control appears to be implemented. Based on ${evidenceCount} evidence document(s) and ${responseCount} questionnaire response(s), this control appears compliant with ${control.title}. Evidence suggests policies and procedures are in place.`,
    
    partial: `Control is partially addressed. ${evidenceCount > 0 ? `${evidenceCount} evidence document(s) provided` : 'No direct evidence uploaded'}${responseCount > 0 ? `, ${responseCount} relevant response(s) recorded` : ''}. Additional documentation or implementation verification recommended.`,
    
    gap: `Control gap identified. No evidence or positive attestation found for ${control.title}. This control requires implementation and documentation to meet ${control.framework} requirements.`,
    
    unknown: `Unable to assess. Insufficient information available to determine compliance status for ${control.title}. Please provide evidence or complete relevant questionnaire sections.`
  };

  let reasoning = templates[status] || templates.unknown;
  
  // Add confidence qualifier
  if (confidence === 'low') {
    reasoning += ' Note: This assessment has low confidence due to limited evidence. Manual verification recommended.';
  }

  return reasoning;
}

/**
 * Build source inputs array for audit trail
 */
function buildSourceInputs(evidence, responses) {
  const inputs = [];

  evidence.forEach(e => {
    inputs.push({
      type: 'evidence',
      reference: e.id,
      label: e.file_name
    });
  });

  responses.forEach(r => {
    inputs.push({
      type: 'questionnaire',
      reference: r.id,
      label: `Response to question ${r.question_id}`
    });
  });

  return inputs;
}

/**
 * Derive top risks from control gaps
 * 
 * @param {Array} controlResults - Mapped control results
 * @param {Array} controls - Control definitions (for context)
 * @returns {Array} Risk findings
 */
export function deriveTopRisksMVP(controlResults, controls = []) {
  const controlLookup = new Map(controls.map(c => [c.id, c]));
  
  // Find gaps and partial compliance
  const gaps = controlResults.filter(r => r.status === 'gap');
  const partial = controlResults.filter(r => r.status === 'partial' && r.confidence === 'low');

  const risks = [];

  // Generate risks from gaps
  gaps.forEach((gap, idx) => {
    const control = controlLookup.get(gap.control_id);
    const domain = control?.domain || 'Unknown Domain';
    const severity = determineSeverity(control);
    
    risks.push({
      title: `Missing control: ${control?.title || gap.control_id}`,
      description: `The control "${control?.control_code} - ${control?.title}" is not implemented or lacks supporting evidence. This represents a gap in your security posture that could impact certification readiness.`,
      severity,
      likelihood: 'medium',
      impact: severity === 'critical' ? 'high' : 'medium',
      recommendation: control?.guidance || 'Implement this control according to framework guidance and provide documented evidence of implementation.',
      remediation_timeframe: severity === 'critical' ? '30-day' : severity === 'high' ? '60-day' : '90-day',
      references: {
        control_id: gap.control_id,
        control_code: control?.control_code,
        domain,
        confidence: gap.confidence
      }
    });
  });

  // Add risks from low-confidence partial compliance (top 5)
  partial.slice(0, 5).forEach(p => {
    const control = controlLookup.get(p.control_id);
    
    risks.push({
      title: `Insufficient evidence: ${control?.title || p.control_id}`,
      description: `Control "${control?.control_code}" appears partially implemented but evidence is insufficient for confident assessment. This may be flagged during audit.`,
      severity: 'medium',
      likelihood: 'medium',
      impact: 'medium',
      recommendation: 'Provide additional documentation or evidence demonstrating full implementation of this control.',
      remediation_timeframe: '60-day',
      references: {
        control_id: p.control_id,
        control_code: control?.control_code,
        domain: control?.domain,
        confidence: p.confidence
      }
    });
  });

  // Sort by severity and return top 10
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return risks
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 10);
}

/**
 * Determine risk severity based on control characteristics
 */
function determineSeverity(control) {
  if (!control) return 'medium';
  
  const criticalDomains = [
    'Access Control',
    'Information Security Incident Management',
    'Business Continuity'
  ];
  
  const highDomains = [
    'Cryptography',
    'Operations Security',
    'Communications Security'
  ];

  if (criticalDomains.some(d => control.domain?.includes(d))) return 'critical';
  if (highDomains.some(d => control.domain?.includes(d))) return 'high';
  return 'medium';
}

