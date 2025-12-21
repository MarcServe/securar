/**
 * Risk Engine
 * 
 * Derives risks from control gaps with business context.
 */

/**
 * Risk severity mapping based on control domain
 */
const DOMAIN_SEVERITY_MAP = {
  "Organizational Controls": "medium",
  "People Controls": "medium",
  "Physical Controls": "low",
  "Technological Controls": "high",
  "Access Control": "high",
  "Operations Security": "high",
  "Network Security": "high",
  "Incident Management": "high",
  "Business Continuity": "high",
  "Governance & Policies": "medium",
  "Supplier Management": "medium",
  "People Security": "medium",
  "Compliance": "medium",
  "Development Security": "medium",
  "Asset Management": "medium",
};

/**
 * Industry risk multipliers
 */
const INDUSTRY_RISK_MULTIPLIER = {
  finance: 1.5,
  healthcare: 1.5,
  government: 1.3,
  technology: 1.2,
  retail: 1.0,
  manufacturing: 0.9,
  professional: 0.8,
  education: 0.8,
  other: 1.0,
};

/**
 * Derive risks from control gaps
 * 
 * @param {Array} gapControls - Controls with gap or partial status
 * @param {Object} org - Organisation context
 * @returns {Array} Risk records
 */
export function deriveRisks(gapControls, org) {
  const risks = [];
  const industry = org?.industry?.toLowerCase() || "other";
  const industryMultiplier = INDUSTRY_RISK_MULTIPLIER[industry] || 1.0;

  // Group gaps by severity
  const highPriority = [];
  const mediumPriority = [];
  const lowPriority = [];

  for (const control of gapControls) {
    const baseSeverity = DOMAIN_SEVERITY_MAP[control.domain] || "medium";
    
    // Adjust severity based on status
    let severity = baseSeverity;
    if (control.status === "gap") {
      // Escalate gaps
      if (baseSeverity === "medium") severity = "high";
      if (baseSeverity === "low") severity = "medium";
    }

    // Apply industry multiplier
    if (industryMultiplier >= 1.3 && severity === "medium") {
      severity = "high";
    }

    const risk = createRisk(control, severity, org);
    
    if (severity === "high" || severity === "critical") {
      highPriority.push(risk);
    } else if (severity === "medium") {
      mediumPriority.push(risk);
    } else {
      lowPriority.push(risk);
    }
  }

  // Combine and limit (prioritizing high severity)
  risks.push(...highPriority.slice(0, 10));
  risks.push(...mediumPriority.slice(0, 5));
  risks.push(...lowPriority.slice(0, 3));

  return risks;
}

/**
 * Create a risk record from a control gap
 * 
 * @param {Object} control - Control with gap
 * @param {string} severity - Calculated severity
 * @param {Object} org - Organisation context
 * @returns {Object} Risk record
 */
function createRisk(control, severity, org) {
  const riskTemplates = getRiskTemplates();
  const template = riskTemplates[control.domain] || riskTemplates.default;

  // Get detailed recommendation
  const detailedRec = getDetailedRecommendation(control);

  // Calculate likelihood based on control confidence
  const likelihood = control.confidence === "high" 
    ? "low" 
    : control.confidence === "medium" 
    ? "medium" 
    : "high";

  // Calculate impact
  const impact = severity === "high" || severity === "critical" 
    ? "high" 
    : severity === "medium" 
    ? "medium" 
    : "low";

  // Determine remediation timeframe
  const timeframe = severity === "high" || severity === "critical"
    ? "30-day"
    : severity === "medium"
    ? "60-day"
    : "90-day";

  return {
    title: template.title.replace("{control}", control.control_code),
    description: template.description
      .replace("{control}", control.control_code)
      .replace("{reasoning}", control.reasoning || "Control gap identified"),
    severity,
    likelihood,
    impact,
    recommendation: detailedRec.summary,
    recommendation_actions: detailedRec.actions,
    recommendation_resources: detailedRec.resources,
    remediation_timeframe: timeframe,
    risk_references: {
      control_id: control.control_id,
      control_code: control.control_code,
      control_title: control.title,
      domain: control.domain,
      confidence: control.confidence,
    },
  };
}

/**
 * Detailed control-specific recommendations
 * Maps ISO 27001:2022 control codes to actionable remediation steps
 */
const CONTROL_RECOMMENDATIONS = {
  // A.5 Organizational Controls
  "A.5.1": {
    title: "Information Security Policies",
    actions: [
      "Draft a comprehensive Information Security Policy document",
      "Include sections on: scope, responsibilities, access control, data classification, incident reporting",
      "Get policy approved by senior management or board",
      "Communicate policy to all employees via email and intranet",
      "Schedule annual policy review cycle",
    ],
    resources: "ISO 27001 Policy Template, NIST Cybersecurity Framework",
  },
  "A.5.2": {
    title: "Information Security Roles",
    actions: [
      "Define an Information Security Manager/Officer role",
      "Document security responsibilities in job descriptions",
      "Create RACI matrix for security tasks",
      "Establish security steering committee with quarterly meetings",
      "Ensure executive sponsorship for security programme",
    ],
    resources: "RACI Template, Role Description Templates",
  },
  "A.5.3": {
    title: "Segregation of Duties",
    actions: [
      "Map critical business processes and identify conflicting duties",
      "Ensure developers cannot deploy directly to production",
      "Separate financial approval and payment processing roles",
      "Implement dual authorization for privileged actions",
      "Document exceptions with compensating controls",
    ],
    resources: "Segregation of Duties Matrix Template",
  },
  "A.5.7": {
    title: "Threat Intelligence",
    actions: [
      "Subscribe to threat intelligence feeds (e.g., NCSC, CISA)",
      "Join industry ISACs for sector-specific intelligence",
      "Establish process to review and act on threat alerts",
      "Integrate threat data with security monitoring tools",
      "Brief leadership quarterly on emerging threats",
    ],
    resources: "NCSC Cyber Security Information Sharing Partnership (CiSP)",
  },
  "A.5.15": {
    title: "Access Control Policy",
    actions: [
      "Document access control policy covering all systems",
      "Implement role-based access control (RBAC) model",
      "Define access request and approval workflow",
      "Establish quarterly access review process",
      "Implement principle of least privilege across all systems",
    ],
    resources: "Access Control Policy Template, RBAC Implementation Guide",
  },
  "A.5.17": {
    title: "Authentication Information",
    actions: [
      "Implement Multi-Factor Authentication (MFA) for all users",
      "Enforce strong password policy (min 12 chars, complexity)",
      "Deploy password manager for secure credential storage",
      "Disable legacy authentication protocols",
      "Implement conditional access policies",
    ],
    resources: "Microsoft Entra MFA Guide, Password Policy Best Practices",
  },
  "A.5.23": {
    title: "Cloud Services Security",
    actions: [
      "Create cloud security policy and standards",
      "Enable cloud-native security controls (AWS GuardDuty, Azure Defender)",
      "Implement Cloud Security Posture Management (CSPM)",
      "Review shared responsibility model with each provider",
      "Configure cloud audit logging to central SIEM",
    ],
    resources: "CSA Cloud Controls Matrix, Cloud Provider Security Guides",
  },
  "A.5.24": {
    title: "Incident Management Planning",
    actions: [
      "Develop Incident Response Plan with clear escalation paths",
      "Define incident severity levels and response times",
      "Establish 24/7 incident reporting channel",
      "Create playbooks for common incident types",
      "Conduct tabletop exercises quarterly",
    ],
    resources: "NIST SP 800-61 Incident Handling Guide, Playbook Templates",
  },
  "A.5.26": {
    title: "Response to Security Incidents",
    actions: [
      "Document incident response procedures step-by-step",
      "Assign incident response team roles (Commander, Comms, Technical)",
      "Create evidence preservation guidelines",
      "Establish communication templates for stakeholders",
      "Define post-incident review process",
    ],
    resources: "Incident Response Checklist, Communication Templates",
  },
  "A.5.29": {
    title: "Business Continuity Planning",
    actions: [
      "Conduct Business Impact Analysis (BIA) for critical systems",
      "Define Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)",
      "Document business continuity procedures",
      "Establish alternate processing site/capability",
      "Test BC plans annually with documented results",
    ],
    resources: "BIA Template, BC Plan Template, ISO 22301 Guide",
  },
  "A.5.30": {
    title: "ICT Readiness for Business Continuity",
    actions: [
      "Implement automated backup solution with offsite replication",
      "Configure disaster recovery for critical infrastructure",
      "Document system recovery procedures",
      "Test restore procedures monthly",
      "Maintain up-to-date infrastructure documentation",
    ],
    resources: "Backup Strategy Guide, DR Planning Template",
  },
  // A.6 People Controls
  "A.6.3": {
    title: "Security Awareness Training",
    actions: [
      "Deploy security awareness training platform (KnowBe4, Proofpoint)",
      "Conduct monthly phishing simulations",
      "Require annual security training for all staff",
      "Track completion rates and report to management",
      "Provide role-specific training for IT and developers",
    ],
    resources: "Security Awareness Training Platforms, Phishing Simulation Tools",
  },
  "A.6.7": {
    title: "Remote Working Security",
    actions: [
      "Create remote working security policy",
      "Require VPN for all remote access",
      "Deploy endpoint detection and response (EDR) on all devices",
      "Implement device encryption (BitLocker, FileVault)",
      "Restrict data download to managed devices only",
    ],
    resources: "Remote Working Policy Template, VPN Configuration Guide",
  },
  // A.7 Physical Controls
  "A.7.1": {
    title: "Physical Security Perimeters",
    actions: [
      "Define physical security zones and access levels",
      "Install access control systems (card readers, biometrics)",
      "Implement visitor management procedures",
      "Deploy CCTV in sensitive areas",
      "Conduct regular physical security assessments",
    ],
    resources: "Physical Security Assessment Checklist",
  },
  // A.8 Technological Controls
  "A.8.1": {
    title: "Endpoint Device Security",
    actions: [
      "Deploy Mobile Device Management (MDM/EMM) solution",
      "Enforce device encryption on all endpoints",
      "Implement endpoint detection and response (EDR)",
      "Configure automatic screen lock after inactivity",
      "Maintain hardware asset inventory",
    ],
    resources: "MDM Solutions Comparison, Endpoint Security Checklist",
  },
  "A.8.5": {
    title: "Secure Authentication",
    actions: [
      "Implement SSO with modern identity provider",
      "Enable MFA for all applications",
      "Deploy passwordless authentication where possible",
      "Configure account lockout after failed attempts",
      "Monitor and alert on suspicious login activity",
    ],
    resources: "Azure AD/Entra Configuration Guide, Okta Setup Guide",
  },
  "A.8.7": {
    title: "Malware Protection",
    actions: [
      "Deploy next-gen antivirus/EDR on all endpoints",
      "Enable real-time scanning and automatic updates",
      "Configure email malware scanning",
      "Implement web filtering to block malicious sites",
      "Establish malware incident response procedures",
    ],
    resources: "EDR Solutions (CrowdStrike, SentinelOne, Defender for Endpoint)",
  },
  "A.8.8": {
    title: "Vulnerability Management",
    actions: [
      "Deploy vulnerability scanning tool (Nessus, Qualys)",
      "Scan all systems weekly, critical systems daily",
      "Define SLAs: Critical 7 days, High 30 days, Medium 90 days",
      "Integrate with patch management process",
      "Report vulnerability metrics to leadership monthly",
    ],
    resources: "Vulnerability Management Policy Template, Scanning Tools",
  },
  "A.8.9": {
    title: "Configuration Management",
    actions: [
      "Create security baseline configurations for all system types",
      "Use CIS Benchmarks as configuration standard",
      "Implement configuration management tools (Ansible, Puppet)",
      "Scan for configuration drift weekly",
      "Document and approve all configuration changes",
    ],
    resources: "CIS Benchmarks, Configuration Management Guide",
  },
  "A.8.15": {
    title: "Security Logging",
    actions: [
      "Deploy centralised SIEM solution",
      "Configure logging on all critical systems",
      "Retain logs for minimum 12 months",
      "Create alerting rules for security events",
      "Review security logs daily or via automated correlation",
    ],
    resources: "SIEM Solutions (Splunk, Microsoft Sentinel, Elastic)",
  },
  "A.8.16": {
    title: "Security Monitoring",
    actions: [
      "Implement 24/7 security monitoring capability",
      "Deploy network detection and response (NDR)",
      "Configure automated alerting and escalation",
      "Establish SOC procedures or managed SOC contract",
      "Conduct monthly security metrics review",
    ],
    resources: "SOC Setup Guide, Managed SOC Providers",
  },
  "A.8.20": {
    title: "Network Security",
    actions: [
      "Implement network segmentation with VLANs/subnets",
      "Deploy next-generation firewall with IPS",
      "Restrict unnecessary network protocols",
      "Implement zero-trust network access for sensitive systems",
      "Monitor network traffic for anomalies",
    ],
    resources: "Network Segmentation Guide, Zero Trust Architecture",
  },
  "A.8.24": {
    title: "Cryptography",
    actions: [
      "Create cryptographic policy defining approved algorithms",
      "Encrypt all data at rest (AES-256)",
      "Enforce TLS 1.2+ for data in transit",
      "Implement secure key management procedures",
      "Deprecate legacy encryption (DES, 3DES, MD5, SHA1)",
    ],
    resources: "Cryptographic Standards Guide, Key Management Best Practices",
  },
};

/**
 * Get detailed recommendation for a control
 */
function getDetailedRecommendation(control) {
  const controlCode = control.control_code;
  const specific = CONTROL_RECOMMENDATIONS[controlCode];
  
  if (specific) {
    const actionList = specific.actions.map((a, i) => `${i + 1}. ${a}`).join("\n");
    return {
      summary: `Implement ${specific.title} controls`,
      actions: specific.actions,
      resources: specific.resources,
      formatted: `**Recommended Actions:**\n${actionList}\n\n**Resources:** ${specific.resources}`,
    };
  }
  
  // Fall back to domain-based recommendation
  return getGenericRecommendation(control);
}

/**
 * Generate generic recommendation based on domain
 */
function getGenericRecommendation(control) {
  const domainActions = {
    "Organizational Controls": [
      "Document the required policy or procedure",
      "Assign ownership to appropriate role",
      "Get management approval and sign-off",
      "Communicate to relevant stakeholders",
      "Schedule periodic review",
    ],
    "People Controls": [
      "Review and update HR security procedures",
      "Implement or enhance security awareness training",
      "Document roles and responsibilities",
      "Establish clear reporting lines",
      "Conduct background checks where appropriate",
    ],
    "Physical Controls": [
      "Assess physical security requirements",
      "Implement appropriate access controls",
      "Document physical security procedures",
      "Install monitoring where needed",
      "Conduct regular physical security reviews",
    ],
    "Technological Controls": [
      "Assess technical control requirements",
      "Evaluate and select appropriate tools/solutions",
      "Implement with security configuration",
      "Test effectiveness of controls",
      "Monitor and maintain ongoing",
    ],
  };

  const actions = domainActions[control.domain] || domainActions["Technological Controls"];
  
  return {
    summary: `Review and implement ${control.title || 'control'} requirements`,
    actions,
    resources: "ISO 27001:2022 Implementation Guide",
    formatted: `**Recommended Actions:**\n${actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n**Resources:** ISO 27001:2022 Implementation Guide`,
  };
}

/**
 * Risk description templates by domain
 */
function getRiskTemplates() {
  return {
    "Access Control": {
      title: "Access Control Gap ({control})",
      description: "Insufficient access controls may allow unauthorized access to systems or data. {reasoning}",
    },
    "Operations Security": {
      title: "Operational Security Weakness ({control})",
      description: "Gaps in operational security processes increase vulnerability to attacks and data breaches. {reasoning}",
    },
    "Network Security": {
      title: "Network Security Vulnerability ({control})",
      description: "Network security gaps may expose the organisation to external threats. {reasoning}",
    },
    "Incident Management": {
      title: "Incident Response Gap ({control})",
      description: "Weak incident response capability may delay detection and recovery from security events. {reasoning}",
    },
    "Business Continuity": {
      title: "Business Continuity Risk ({control})",
      description: "Insufficient business continuity planning may result in extended downtime during incidents. {reasoning}",
    },
    "Governance & Policies": {
      title: "Governance Gap ({control})",
      description: "Missing or outdated security policies create uncertainty and inconsistent security practices. {reasoning}",
    },
    "People Security": {
      title: "People Security Weakness ({control})",
      description: "Gaps in people security increase risk of insider threats and social engineering attacks. {reasoning}",
    },
    "Organizational Controls": {
      title: "Organizational Control Gap ({control})",
      description: "Gaps in organizational security controls may lead to inconsistent security practices. {reasoning}",
    },
    "Technological Controls": {
      title: "Technical Security Gap ({control})",
      description: "Technical security gaps may expose systems and data to cyber threats. {reasoning}",
    },
    default: {
      title: "Security Control Gap ({control})",
      description: "A security control gap has been identified that may expose the organisation to risk. {reasoning}",
    },
  };
}

/**
 * Prioritize risks for reporting
 * 
 * @param {Array} risks - All identified risks
 * @returns {Array} Prioritized risks
 */
export function prioritizeRisks(risks) {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const likelihoodOrder = { high: 0, medium: 1, low: 2 };

  return [...risks].sort((a, b) => {
    // First by severity
    const sevDiff = (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
    if (sevDiff !== 0) return sevDiff;

    // Then by likelihood
    return (likelihoodOrder[a.likelihood] ?? 3) - (likelihoodOrder[b.likelihood] ?? 3);
  });
}

/**
 * Group risks by timeframe for remediation roadmap
 * 
 * @param {Array} risks - All risks
 * @returns {Object} Risks grouped by timeframe
 */
export function groupRisksByTimeframe(risks) {
  return {
    "30-day": risks.filter((r) => r.remediation_timeframe === "30-day"),
    "60-day": risks.filter((r) => r.remediation_timeframe === "60-day"),
    "90-day": risks.filter((r) => r.remediation_timeframe === "90-day"),
  };
}

