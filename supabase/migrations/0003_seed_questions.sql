-- 0003_seed_questions.sql
-- Security Assessment Questionnaire Bank
-- Organized by domain, linked to ISO 27001 controls

-- Clear existing questions (for re-seeding)
DELETE FROM public.questions WHERE framework_tag = 'iso27001';

-- ========================================
-- DOMAIN: Governance & Policies
-- ========================================
INSERT INTO public.questions (framework_tag, domain, question_text, help_text, answer_type, choices, control_refs, role_target, org_size_relevance, display_order) VALUES

('iso27001', 'Governance & Policies', 
'Does your organisation have a documented Information Security Policy?',
'This should be a formal document approved by management that defines your approach to information security.',
'single', '["Yes, formally approved and reviewed annually", "Yes, but not recently reviewed", "In development", "No"]'::jsonb,
ARRAY['A.5.1'], 'management', ARRAY['micro', 'small', 'medium', 'large'], 1),

('iso27001', 'Governance & Policies',
'Who is responsible for information security in your organisation?',
'There should be a named individual or role with clear accountability for security.',
'single', '["Dedicated CISO/Security Manager", "IT Manager with security responsibilities", "CEO/Founder", "No one formally assigned"]'::jsonb,
ARRAY['A.5.2'], 'management', ARRAY['micro', 'small', 'medium', 'large'], 2),

('iso27001', 'Governance & Policies',
'How often is your security policy reviewed?',
'Policies should be reviewed at least annually or when significant changes occur.',
'single', '["Annually or more frequently", "Every 2-3 years", "Rarely/when issues arise", "Never reviewed"]'::jsonb,
ARRAY['A.5.1'], 'management', ARRAY['small', 'medium', 'large'], 3),

('iso27001', 'Governance & Policies',
'Do you have documented acceptable use policies for IT systems?',
'This covers how employees should use company systems, email, internet, etc.',
'single', '["Yes, comprehensive and signed by all staff", "Yes, basic policy exists", "Informal guidelines only", "No"]'::jsonb,
ARRAY['A.5.10'], 'management', ARRAY['small', 'medium', 'large'], 4),

-- ========================================
-- DOMAIN: Access Control
-- ========================================
('iso27001', 'Access Control',
'Do you have a formal process for granting and revoking user access?',
'This includes joiners/leavers processes and access request workflows.',
'single', '["Yes, fully documented and followed", "Yes, informal process", "Ad-hoc handling", "No process"]'::jsonb,
ARRAY['A.5.15', 'A.5.18'], 'it', ARRAY['micro', 'small', 'medium', 'large'], 10),

('iso27001', 'Access Control',
'Do you use multi-factor authentication (MFA) for critical systems?',
'MFA adds a second layer of security beyond passwords.',
'single', '["Yes, for all systems", "Yes, for critical systems only", "Partially implemented", "No MFA in use"]'::jsonb,
ARRAY['A.8.5'], 'it', ARRAY['micro', 'small', 'medium', 'large'], 11),

('iso27001', 'Access Control',
'How do you manage privileged/admin accounts?',
'Privileged accounts have elevated access and require special controls.',
'single', '["Dedicated PAM solution", "Separate admin accounts with monitoring", "Shared admin accounts", "No special controls"]'::jsonb,
ARRAY['A.8.2'], 'it', ARRAY['small', 'medium', 'large'], 12),

('iso27001', 'Access Control',
'Do you conduct regular access reviews?',
'Periodic reviews ensure users only have access they still need.',
'single', '["Quarterly or more frequently", "Annually", "Occasionally", "Never"]'::jsonb,
ARRAY['A.5.18'], 'it', ARRAY['small', 'medium', 'large'], 13),

('iso27001', 'Access Control',
'How are passwords managed in your organisation?',
'This includes password policies, complexity requirements, and storage.',
'single', '["Password manager enforced, complexity policies", "Password policies defined but not enforced", "Basic guidance only", "No password controls"]'::jsonb,
ARRAY['A.5.17'], 'it', ARRAY['micro', 'small', 'medium', 'large'], 14),

-- ========================================
-- DOMAIN: Asset Management
-- ========================================
('iso27001', 'Asset Management',
'Do you maintain an inventory of IT assets?',
'This includes hardware, software, and data assets.',
'single', '["Yes, comprehensive and regularly updated", "Yes, but not complete", "Partial/informal inventory", "No inventory"]'::jsonb,
ARRAY['A.5.9'], 'it', ARRAY['micro', 'small', 'medium', 'large'], 20),

('iso27001', 'Asset Management',
'Do you classify information based on sensitivity?',
'Data classification helps determine appropriate protection levels.',
'single', '["Yes, with defined classification scheme", "Informal classification", "Critical data identified only", "No classification"]'::jsonb,
ARRAY['A.5.12'], 'it', ARRAY['small', 'medium', 'large'], 21),

('iso27001', 'Asset Management',
'Do you have procedures for secure disposal of equipment?',
'Ensures data is properly wiped before disposal or reuse.',
'single', '["Yes, with verification/certificates", "Yes, basic wiping process", "Ad-hoc handling", "No procedures"]'::jsonb,
ARRAY['A.7.14'], 'it', ARRAY['small', 'medium', 'large'], 22),

-- ========================================
-- DOMAIN: Operations Security
-- ========================================
('iso27001', 'Operations Security',
'Do you have anti-malware protection on all endpoints?',
'This includes antivirus, anti-malware, and endpoint detection.',
'single', '["Yes, centrally managed EDR/AV", "Yes, standalone AV on devices", "Partial coverage", "No protection"]'::jsonb,
ARRAY['A.8.7'], 'it', ARRAY['micro', 'small', 'medium', 'large'], 30),

('iso27001', 'Operations Security',
'How do you manage software updates and patches?',
'Regular patching addresses known vulnerabilities.',
'single', '["Automated patching with testing", "Regular manual patching", "Occasional patching", "No patching process"]'::jsonb,
ARRAY['A.8.8'], 'it', ARRAY['micro', 'small', 'medium', 'large'], 31),

('iso27001', 'Operations Security',
'Do you perform regular backups of critical data?',
'Backups enable recovery from data loss or ransomware.',
'single', '["Yes, automated with offsite/cloud copy", "Yes, regular manual backups", "Occasional backups", "No backups"]'::jsonb,
ARRAY['A.8.13'], 'it', ARRAY['micro', 'small', 'medium', 'large'], 32),

('iso27001', 'Operations Security',
'Do you test backup restores?',
'Testing ensures backups actually work when needed.',
'single', '["Yes, regularly tested", "Occasionally tested", "Never tested", "No backups to test"]'::jsonb,
ARRAY['A.8.13'], 'it', ARRAY['small', 'medium', 'large'], 33),

('iso27001', 'Operations Security',
'Do you have logging and monitoring in place?',
'Logs help detect and investigate security incidents.',
'single', '["Yes, centralized SIEM/logging", "Yes, basic logging on systems", "Minimal logging", "No logging"]'::jsonb,
ARRAY['A.8.15', 'A.8.16'], 'it', ARRAY['small', 'medium', 'large'], 34),

-- ========================================
-- DOMAIN: Network Security
-- ========================================
('iso27001', 'Network Security',
'Do you use firewalls to protect your network?',
'Firewalls control traffic between networks.',
'single', '["Yes, enterprise firewall with rules", "Yes, basic firewall", "Cloud provider firewall only", "No firewall"]'::jsonb,
ARRAY['A.8.20'], 'it', ARRAY['micro', 'small', 'medium', 'large'], 40),

('iso27001', 'Network Security',
'Is your network segmented?',
'Segmentation limits the spread of attacks.',
'single', '["Yes, with VLANs/zones", "Partial segmentation", "Flat network", "Don''t know"]'::jsonb,
ARRAY['A.8.22'], 'it', ARRAY['small', 'medium', 'large'], 41),

('iso27001', 'Network Security',
'How do remote workers connect to company resources?',
'Secure remote access is essential for distributed teams.',
'single', '["VPN with MFA", "VPN without MFA", "Direct access to cloud services", "No remote access controls"]'::jsonb,
ARRAY['A.6.7', 'A.8.20'], 'it', ARRAY['micro', 'small', 'medium', 'large'], 42),

('iso27001', 'Network Security',
'Do you encrypt data in transit?',
'Encryption protects data as it moves across networks.',
'single', '["Yes, TLS/HTTPS everywhere", "Yes, for sensitive data", "Partial encryption", "No encryption"]'::jsonb,
ARRAY['A.8.24'], 'it', ARRAY['micro', 'small', 'medium', 'large'], 43),

-- ========================================
-- DOMAIN: Incident Management
-- ========================================
('iso27001', 'Incident Management',
'Do you have an incident response plan?',
'A documented plan for handling security incidents.',
'single', '["Yes, documented and tested", "Yes, basic plan exists", "Informal understanding", "No plan"]'::jsonb,
ARRAY['A.5.24'], 'security', ARRAY['small', 'medium', 'large'], 50),

('iso27001', 'Incident Management',
'Do staff know how to report security incidents?',
'Clear reporting channels encourage early detection.',
'single', '["Yes, trained and clear channels", "Basic awareness", "Unclear process", "No training"]'::jsonb,
ARRAY['A.6.8'], 'management', ARRAY['micro', 'small', 'medium', 'large'], 51),

('iso27001', 'Incident Management',
'Have you had a security incident in the past year?',
'Understanding your incident history helps assess risk.',
'single', '["No incidents", "Minor incidents handled", "Significant incident occurred", "Don''t know"]'::jsonb,
ARRAY['A.5.26'], 'security', ARRAY['micro', 'small', 'medium', 'large'], 52),

-- ========================================
-- DOMAIN: Business Continuity
-- ========================================
('iso27001', 'Business Continuity',
'Do you have a business continuity plan?',
'Plans for maintaining operations during disruptions.',
'single', '["Yes, documented and tested", "Yes, basic plan", "In development", "No plan"]'::jsonb,
ARRAY['A.5.29', 'A.5.30'], 'management', ARRAY['small', 'medium', 'large'], 60),

('iso27001', 'Business Continuity',
'Can you recover critical systems within acceptable timeframes?',
'Recovery time objectives define acceptable downtime.',
'single', '["Yes, tested and confirmed", "Likely but untested", "Uncertain", "No recovery capability"]'::jsonb,
ARRAY['A.5.30'], 'it', ARRAY['small', 'medium', 'large'], 61),

-- ========================================
-- DOMAIN: Supplier Management
-- ========================================
('iso27001', 'Supplier Management',
'Do you assess security of key suppliers?',
'Third parties can introduce security risks.',
'single', '["Yes, formal assessment process", "Yes, basic questionnaires", "Rely on certifications only", "No assessment"]'::jsonb,
ARRAY['A.5.19', 'A.5.21'], 'management', ARRAY['small', 'medium', 'large'], 70),

('iso27001', 'Supplier Management',
'Do contracts include security requirements?',
'Contracts should specify security expectations.',
'single', '["Yes, standard security clauses", "Yes, for some suppliers", "Rarely", "No"]'::jsonb,
ARRAY['A.5.20'], 'management', ARRAY['small', 'medium', 'large'], 71),

-- ========================================
-- DOMAIN: Human Resources Security
-- ========================================
('iso27001', 'People Security',
'Do you conduct background checks on new hires?',
'Screening appropriate to role sensitivity.',
'single', '["Yes, for all roles", "Yes, for sensitive roles", "Rarely", "Never"]'::jsonb,
ARRAY['A.6.1'], 'management', ARRAY['small', 'medium', 'large'], 80),

('iso27001', 'People Security',
'Do you provide security awareness training?',
'Training helps staff recognize and avoid threats.',
'single', '["Yes, regular/annual training", "Yes, during onboarding only", "Occasional reminders", "No training"]'::jsonb,
ARRAY['A.6.3'], 'management', ARRAY['micro', 'small', 'medium', 'large'], 81),

('iso27001', 'People Security',
'Are security responsibilities in employment contracts?',
'Contracts should define security obligations.',
'single', '["Yes, with confidentiality clauses", "Basic mention", "No", "Don''t know"]'::jsonb,
ARRAY['A.6.2'], 'management', ARRAY['small', 'medium', 'large'], 82),

-- ========================================
-- DOMAIN: Physical Security
-- ========================================
('iso27001', 'Physical Security',
'Do you control physical access to offices/data centres?',
'Physical security protects against unauthorized access.',
'single', '["Yes, access cards/biometrics", "Yes, key-based access", "Minimal controls", "No controls"]'::jsonb,
ARRAY['A.7.1', 'A.7.2'], 'operations', ARRAY['small', 'medium', 'large'], 90),

('iso27001', 'Physical Security',
'Do you have a clear desk/clear screen policy?',
'Prevents casual observation of sensitive information.',
'single', '["Yes, enforced", "Yes, policy exists", "Informal guidance", "No policy"]'::jsonb,
ARRAY['A.7.7'], 'management', ARRAY['small', 'medium', 'large'], 91),

-- ========================================
-- DOMAIN: Development Security
-- ========================================
('iso27001', 'Development Security',
'Do you follow secure development practices?',
'Security should be built into development lifecycle.',
'single', '["Yes, SDLC with security gates", "Yes, code reviews for security", "Basic awareness", "No secure development process"]'::jsonb,
ARRAY['A.8.25', 'A.8.28'], 'it', ARRAY['small', 'medium', 'large'], 100),

('iso27001', 'Development Security',
'Do you separate development and production environments?',
'Prevents development activities from affecting live systems.',
'single', '["Yes, fully separated", "Partially separated", "Same environment", "N/A - no development"]'::jsonb,
ARRAY['A.8.31'], 'it', ARRAY['small', 'medium', 'large'], 101),

-- ========================================
-- DOMAIN: Compliance
-- ========================================
('iso27001', 'Compliance',
'Are you aware of applicable legal/regulatory requirements?',
'Understanding obligations is the first step to compliance.',
'single', '["Yes, documented compliance register", "Yes, general awareness", "Partially aware", "Uncertain"]'::jsonb,
ARRAY['A.5.31'], 'management', ARRAY['micro', 'small', 'medium', 'large'], 110),

('iso27001', 'Compliance',
'Do you process personal data (PII)?',
'Personal data triggers privacy requirements like GDPR.',
'single', '["Yes, significant volumes", "Yes, limited", "No personal data", "Uncertain"]'::jsonb,
ARRAY['A.5.34'], 'management', ARRAY['micro', 'small', 'medium', 'large'], 111);

-- Verify question count
DO $$
DECLARE
  question_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO question_count FROM public.questions WHERE framework_tag = 'iso27001';
  RAISE NOTICE 'ISO 27001 questions seeded: % questions', question_count;
END $$;

