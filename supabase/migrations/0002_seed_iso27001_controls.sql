-- 0002_seed_iso27001_controls.sql
-- ISO 27001:2022 Annex A Controls (93 controls across 4 themes)
-- Note: ISO 27001:2022 reorganized the controls from 14 domains to 4 themes
-- For backwards compatibility, we include domain mapping to legacy structure

-- Clear existing ISO 27001 controls (for re-seeding)
DELETE FROM public.controls WHERE framework = 'iso27001';

-- =============================================================================
-- THEME 5: ORGANISATIONAL CONTROLS (37 controls)
-- =============================================================================

INSERT INTO public.controls (framework, control_code, domain, title, description, guidance, evidence_types) VALUES

-- A.5.1 Policies for information security
('iso27001', 'A.5.1', 'Organisational Controls', 'Policies for information security',
'Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and if significant changes occur.',
'Create a comprehensive information security policy document that defines the organisation''s approach to managing information security. Include topic-specific policies for areas like access control, data classification, and incident management. Ensure management approval and regular review cycles (at least annually).',
ARRAY['Information Security Policy', 'Policy review records', 'Management approval records', 'Communication records']),

-- A.5.2 Information security roles and responsibilities
('iso27001', 'A.5.2', 'Organisational Controls', 'Information security roles and responsibilities',
'Information security roles and responsibilities shall be defined and allocated according to the organisation needs.',
'Define clear roles including CISO/Security Manager, asset owners, system administrators, and users. Document responsibilities in job descriptions and ensure accountability at all levels.',
ARRAY['RACI matrix', 'Job descriptions', 'Organisational chart', 'Role definitions']),

-- A.5.3 Segregation of duties
('iso27001', 'A.5.3', 'Organisational Controls', 'Segregation of duties',
'Conflicting duties and conflicting areas of responsibility shall be segregated.',
'Identify and separate conflicting duties to reduce opportunities for unauthorized modification or misuse. Key separations include development vs production, approval vs execution, and audit vs operations.',
ARRAY['Segregation of duties matrix', 'Access control lists', 'Workflow approvals']),

-- A.5.4 Management responsibilities
('iso27001', 'A.5.4', 'Organisational Controls', 'Management responsibilities',
'Management shall require all personnel to apply information security in accordance with the established information security policy, topic-specific policies and procedures of the organisation.',
'Ensure management actively promotes security culture, enforces compliance, provides resources, and leads by example. Include security in performance objectives.',
ARRAY['Management meeting minutes', 'Security communications', 'Performance reviews']),

-- A.5.5 Contact with authorities
('iso27001', 'A.5.5', 'Organisational Controls', 'Contact with authorities',
'The organisation shall establish and maintain contact with relevant authorities.',
'Maintain a register of relevant authorities (regulators, law enforcement, emergency services) and establish contact procedures for different scenarios.',
ARRAY['Authority contact register', 'Communication procedures', 'Incident notification records']),

-- A.5.6 Contact with special interest groups
('iso27001', 'A.5.6', 'Organisational Controls', 'Contact with special interest groups',
'The organisation shall establish and maintain contact with special interest groups or other specialist security forums and professional associations.',
'Join relevant industry groups, ISACs, and professional associations. Subscribe to threat intelligence feeds and security bulletins.',
ARRAY['Membership records', 'Subscription records', 'Threat intelligence sources']),

-- A.5.7 Threat intelligence
('iso27001', 'A.5.7', 'Organisational Controls', 'Threat intelligence',
'Information relating to information security threats shall be collected and analysed to produce threat intelligence.',
'Establish processes to collect, analyse, and act on threat intelligence relevant to your organisation. Include both strategic and tactical intelligence.',
ARRAY['Threat intelligence reports', 'Analysis records', 'Action taken records']),

-- A.5.8 Information security in project management
('iso27001', 'A.5.8', 'Organisational Controls', 'Information security in project management',
'Information security shall be integrated into project management.',
'Include security requirements in project initiation, planning, execution, and closure phases. Conduct security reviews at project gates.',
ARRAY['Project security requirements', 'Security gate reviews', 'Project documentation']),

-- A.5.9 Inventory of information and other associated assets
('iso27001', 'A.5.9', 'Organisational Controls', 'Inventory of information and other associated assets',
'An inventory of information and other associated assets, including owners, shall be developed and maintained.',
'Create and maintain a comprehensive asset register including hardware, software, data, and services. Assign owners and classify assets.',
ARRAY['Asset register', 'Asset classification records', 'Owner assignments']),

-- A.5.10 Acceptable use of information and other associated assets
('iso27001', 'A.5.10', 'Organisational Controls', 'Acceptable use of information and other associated assets',
'Rules for the acceptable use of information and other associated assets shall be identified, documented and implemented.',
'Define acceptable use policies covering internet, email, social media, mobile devices, and information handling. Communicate and enforce compliance.',
ARRAY['Acceptable use policy', 'User acknowledgments', 'Compliance monitoring records']),

-- A.5.11 Return of assets
('iso27001', 'A.5.11', 'Organisational Controls', 'Return of assets',
'Personnel and other interested parties as appropriate shall return all the organisation''s assets in their possession upon change or termination of their employment, contract or agreement.',
'Implement asset return procedures as part of offboarding. Track and verify return of all physical and logical assets.',
ARRAY['Offboarding checklist', 'Asset return records', 'Account deactivation records']),

-- A.5.12 Classification of information
('iso27001', 'A.5.12', 'Organisational Controls', 'Classification of information',
'Information shall be classified according to the information security needs of the organisation based on confidentiality, integrity, availability and relevant interested party requirements.',
'Define classification scheme (e.g., Public, Internal, Confidential, Restricted). Apply labels and handling procedures appropriate to each level.',
ARRAY['Classification policy', 'Data classification records', 'Labelling procedures']),

-- A.5.13 Labelling of information
('iso27001', 'A.5.13', 'Organisational Controls', 'Labelling of information',
'An appropriate set of procedures for information labelling shall be developed and implemented in accordance with the information classification scheme adopted by the organisation.',
'Implement consistent labelling across physical and digital assets. Include visual markers, metadata, and handling instructions.',
ARRAY['Labelling procedures', 'Label examples', 'Compliance checks']),

-- A.5.14 Information transfer
('iso27001', 'A.5.14', 'Organisational Controls', 'Information transfer',
'Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organisation and between the organisation and other parties.',
'Define secure transfer methods for different classification levels. Include encryption requirements, approved channels, and third-party agreements.',
ARRAY['Transfer policy', 'Encryption standards', 'Transfer logs', 'NDAs']),

-- A.5.15 Access control
('iso27001', 'A.5.15', 'Organisational Controls', 'Access control',
'Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.',
'Implement role-based access control. Define access rules based on need-to-know and least privilege principles.',
ARRAY['Access control policy', 'Access matrices', 'Role definitions']),

-- A.5.16 Identity management
('iso27001', 'A.5.16', 'Organisational Controls', 'Identity management',
'The full life cycle of identities shall be managed.',
'Implement identity lifecycle management including provisioning, modification, and deprovisioning. Maintain unique identifiers.',
ARRAY['Identity management procedures', 'Provisioning records', 'Deprovisioning records']),

-- A.5.17 Authentication information
('iso27001', 'A.5.17', 'Organisational Controls', 'Authentication information',
'Allocation and management of authentication information shall be controlled by a management process including advising personnel on appropriate handling of authentication information.',
'Define password policies, MFA requirements, and credential management procedures. Implement secure credential storage and transmission.',
ARRAY['Password policy', 'MFA configuration', 'Credential management procedures']),

-- A.5.18 Access rights
('iso27001', 'A.5.18', 'Organisational Controls', 'Access rights',
'Access rights to information and other associated assets shall be provisioned, reviewed, modified and removed in accordance with the organisation''s topic-specific policy on and rules for access control.',
'Implement access request and approval workflows. Conduct regular access reviews. Remove access promptly when no longer needed.',
ARRAY['Access request records', 'Access review records', 'Deprovisioning records']),

-- A.5.19 Information security in supplier relationships
('iso27001', 'A.5.19', 'Organisational Controls', 'Information security in supplier relationships',
'Processes and procedures shall be defined and implemented to manage the information security risks associated with the use of supplier''s products or services.',
'Conduct security assessments of suppliers. Include security requirements in contracts. Monitor supplier compliance.',
ARRAY['Supplier security policy', 'Security assessments', 'Contract clauses']),

-- A.5.20 Addressing information security within supplier agreements
('iso27001', 'A.5.20', 'Organisational Controls', 'Addressing information security within supplier agreements',
'Relevant information security requirements shall be established and agreed with each supplier based on the type of supplier relationship.',
'Include specific security requirements in supplier contracts covering confidentiality, incident notification, audit rights, and data handling.',
ARRAY['Supplier contracts', 'Security schedules', 'SLAs']),

-- A.5.21 Managing information security in the ICT supply chain
('iso27001', 'A.5.21', 'Organisational Controls', 'Managing information security in the ICT supply chain',
'Processes and procedures shall be defined and implemented to manage the information security risks associated with the ICT products and services supply chain.',
'Assess supply chain risks. Implement controls for software integrity, hardware provenance, and service continuity.',
ARRAY['Supply chain risk assessment', 'Integrity verification records', 'Supplier monitoring']),

-- A.5.22 Monitoring, review and change management of supplier services
('iso27001', 'A.5.22', 'Organisational Controls', 'Monitoring, review and change management of supplier services',
'The organisation shall regularly monitor, review, evaluate and manage change in supplier information security practices and service delivery.',
'Conduct regular supplier reviews. Monitor SLA compliance. Manage changes to supplier relationships.',
ARRAY['Supplier review records', 'SLA monitoring', 'Change records']),

-- A.5.23 Information security for use of cloud services
('iso27001', 'A.5.23', 'Organisational Controls', 'Information security for use of cloud services',
'Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organisation''s information security requirements.',
'Define cloud security policy. Assess cloud provider security. Implement appropriate controls for data in cloud.',
ARRAY['Cloud security policy', 'Cloud provider assessments', 'Configuration records']),

-- A.5.24 Information security incident management planning and preparation
('iso27001', 'A.5.24', 'Organisational Controls', 'Information security incident management planning and preparation',
'The organisation shall plan and prepare for managing information security incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities.',
'Develop incident response plan. Define roles and escalation procedures. Conduct regular training and exercises.',
ARRAY['Incident response plan', 'Contact lists', 'Training records', 'Exercise records']),

-- A.5.25 Assessment and decision on information security events
('iso27001', 'A.5.25', 'Organisational Controls', 'Assessment and decision on information security events',
'The organisation shall assess information security events and decide if they are to be categorised as information security incidents.',
'Define event classification criteria. Implement triage procedures. Document decisions.',
ARRAY['Classification criteria', 'Triage procedures', 'Event logs']),

-- A.5.26 Response to information security incidents
('iso27001', 'A.5.26', 'Organisational Controls', 'Response to information security incidents',
'Information security incidents shall be responded to in accordance with the documented procedures.',
'Implement response procedures for different incident types. Coordinate with relevant parties. Document actions taken.',
ARRAY['Response procedures', 'Incident tickets', 'Communication records']),

-- A.5.27 Learning from information security incidents
('iso27001', 'A.5.27', 'Organisational Controls', 'Learning from information security incidents',
'Knowledge gained from information security incidents shall be used to strengthen and improve the information security controls.',
'Conduct post-incident reviews. Identify root causes and improvements. Update controls and procedures.',
ARRAY['Post-incident reviews', 'Lessons learned', 'Improvement records']),

-- A.5.28 Collection of evidence
('iso27001', 'A.5.28', 'Organisational Controls', 'Collection of evidence',
'The organisation shall establish and implement procedures for the identification, collection, acquisition and preservation of evidence related to information security events.',
'Define evidence handling procedures. Maintain chain of custody. Preserve evidence integrity.',
ARRAY['Evidence procedures', 'Chain of custody records', 'Evidence logs']),

-- A.5.29 Information security during disruption
('iso27001', 'A.5.29', 'Organisational Controls', 'Information security during disruption',
'The organisation shall plan how to maintain information security at an appropriate level during disruption.',
'Include security in business continuity planning. Define security requirements for alternative processing. Test security during exercises.',
ARRAY['BCP security requirements', 'Alternative processing procedures', 'Test records']),

-- A.5.30 ICT readiness for business continuity
('iso27001', 'A.5.30', 'Organisational Controls', 'ICT readiness for business continuity',
'ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements.',
'Define RTOs and RPOs. Implement DR capabilities. Test regularly.',
ARRAY['BIA', 'DR plan', 'Test results', 'RTO/RPO documentation']),

-- A.5.31 Legal, statutory, regulatory and contractual requirements
('iso27001', 'A.5.31', 'Organisational Controls', 'Legal, statutory, regulatory and contractual requirements',
'Legal, statutory, regulatory and contractual requirements relevant to information security and the organisation''s approach to meet these requirements shall be identified, documented and kept up to date.',
'Maintain a compliance register. Monitor regulatory changes. Assign compliance responsibilities.',
ARRAY['Compliance register', 'Legal requirements', 'Monitoring records']),

-- A.5.32 Intellectual property rights
('iso27001', 'A.5.32', 'Organisational Controls', 'Intellectual property rights',
'The organisation shall implement appropriate procedures to protect intellectual property rights.',
'Implement software asset management. Respect licensing terms. Protect organisational IP.',
ARRAY['Software asset register', 'License records', 'IP protection procedures']),

-- A.5.33 Protection of records
('iso27001', 'A.5.33', 'Organisational Controls', 'Protection of records',
'Records shall be protected from loss, destruction, falsification, unauthorized access and unauthorized release in accordance with legal, statutory, regulatory and contractual requirements.',
'Define retention schedules. Implement secure storage. Control access to records.',
ARRAY['Retention policy', 'Records management procedures', 'Access controls']),

-- A.5.34 Privacy and protection of PII
('iso27001', 'A.5.34', 'Organisational Controls', 'Privacy and protection of PII',
'The organisation shall identify and meet the requirements regarding the preservation of privacy and protection of PII according to applicable laws and regulations and contractual requirements.',
'Implement privacy by design. Conduct DPIAs. Maintain processing records.',
ARRAY['Privacy policy', 'DPIA records', 'Processing records', 'Consent records']),

-- A.5.35 Independent review of information security
('iso27001', 'A.5.35', 'Organisational Controls', 'Independent review of information security',
'The organisation''s approach to managing information security and its implementation including people, processes and technologies shall be reviewed independently at planned intervals, or when significant changes occur.',
'Conduct regular independent reviews (internal audit or external). Address findings. Report to management.',
ARRAY['Audit reports', 'Audit schedule', 'Corrective actions']),

-- A.5.36 Compliance with policies, rules and standards for information security
('iso27001', 'A.5.36', 'Organisational Controls', 'Compliance with policies, rules and standards for information security',
'Compliance with the organisation''s information security policy, topic-specific policies, rules and standards shall be regularly reviewed.',
'Conduct compliance reviews. Monitor policy adherence. Address non-compliance.',
ARRAY['Compliance review records', 'Monitoring reports', 'Non-compliance records']),

-- A.5.37 Documented operating procedures
('iso27001', 'A.5.37', 'Organisational Controls', 'Documented operating procedures',
'Operating procedures for information processing facilities shall be documented and made available to personnel who need them.',
'Document key operational procedures. Keep current and accessible. Review regularly.',
ARRAY['Operating procedures', 'Procedure register', 'Review records']);

-- =============================================================================
-- THEME 6: PEOPLE CONTROLS (8 controls)
-- =============================================================================

INSERT INTO public.controls (framework, control_code, domain, title, description, guidance, evidence_types) VALUES

-- A.6.1 Screening
('iso27001', 'A.6.1', 'People Controls', 'Screening',
'Background verification checks on all candidates to become personnel shall be carried out prior to joining the organisation and on an ongoing basis taking into consideration applicable laws, regulations and ethics and be proportional to the business requirements, the classification of the information to be accessed and the perceived risks.',
'Implement pre-employment screening including identity verification, qualification checks, reference checks, and criminal background checks where permitted. Define screening levels based on role sensitivity.',
ARRAY['Screening policy', 'Screening records', 'Reference check records']),

-- A.6.2 Terms and conditions of employment
('iso27001', 'A.6.2', 'People Controls', 'Terms and conditions of employment',
'The employment contractual agreements shall state the personnel''s and the organisation''s responsibilities for information security.',
'Include information security responsibilities in employment contracts. Cover confidentiality, acceptable use, and compliance requirements.',
ARRAY['Employment contracts', 'Confidentiality agreements', 'Security clauses']),

-- A.6.3 Information security awareness, education and training
('iso27001', 'A.6.3', 'People Controls', 'Information security awareness, education and training',
'Personnel of the organisation and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organisation''s information security policy, topic-specific policies and procedures, as relevant for their job function.',
'Implement security awareness programme. Provide role-specific training. Track completion and effectiveness.',
ARRAY['Training programme', 'Training records', 'Awareness materials', 'Completion records']),

-- A.6.4 Disciplinary process
('iso27001', 'A.6.4', 'People Controls', 'Disciplinary process',
'A disciplinary process shall be formalized and communicated to take actions against personnel and other relevant interested parties who have committed an information security policy violation.',
'Define disciplinary procedures for security violations. Communicate consequences. Apply consistently.',
ARRAY['Disciplinary policy', 'Communication records', 'Disciplinary records']),

-- A.6.5 Responsibilities after termination or change of employment
('iso27001', 'A.6.5', 'People Controls', 'Responsibilities after termination or change of employment',
'Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated to relevant personnel and other interested parties.',
'Include post-employment obligations in contracts. Conduct exit interviews. Communicate ongoing responsibilities.',
ARRAY['Exit procedures', 'Post-employment agreements', 'Exit interview records']),

-- A.6.6 Confidentiality or non-disclosure agreements
('iso27001', 'A.6.6', 'People Controls', 'Confidentiality or non-disclosure agreements',
'Confidentiality or non-disclosure agreements reflecting the organisation''s needs for the protection of information shall be identified, documented, regularly reviewed and signed by personnel and other relevant interested parties.',
'Use NDAs for employees, contractors, and third parties. Review and update regularly. Maintain signed copies.',
ARRAY['NDA templates', 'Signed NDAs', 'Review records']),

-- A.6.7 Remote working
('iso27001', 'A.6.7', 'People Controls', 'Remote working',
'Security measures shall be implemented when personnel are working remotely to protect information accessed, processed or stored outside the organisation''s premises.',
'Define remote working security requirements. Implement secure access, device security, and data handling rules for remote workers.',
ARRAY['Remote working policy', 'Security controls', 'VPN configuration']),

-- A.6.8 Information security event reporting
('iso27001', 'A.6.8', 'People Controls', 'Information security event reporting',
'The organisation shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner.',
'Establish reporting channels. Train personnel on what to report. Make reporting easy and non-punitive.',
ARRAY['Reporting procedures', 'Reporting channels', 'Training records']);

-- =============================================================================
-- THEME 7: PHYSICAL CONTROLS (14 controls)
-- =============================================================================

INSERT INTO public.controls (framework, control_code, domain, title, description, guidance, evidence_types) VALUES

-- A.7.1 Physical security perimeters
('iso27001', 'A.7.1', 'Physical Controls', 'Physical security perimeters',
'Security perimeters shall be defined and used to protect areas that contain information and other associated assets.',
'Define and implement physical perimeters around sensitive areas. Use barriers, walls, and access points.',
ARRAY['Perimeter definitions', 'Physical security design', 'Access point inventory']),

-- A.7.2 Physical entry
('iso27001', 'A.7.2', 'Physical Controls', 'Physical entry',
'Secure areas shall be protected by appropriate entry controls to ensure that only authorised personnel are allowed access.',
'Implement access controls at entry points. Use badges, PINs, biometrics as appropriate. Log access.',
ARRAY['Access control system', 'Access logs', 'Badge records']),

-- A.7.3 Securing offices, rooms and facilities
('iso27001', 'A.7.3', 'Physical Controls', 'Securing offices, rooms and facilities',
'Physical security for offices, rooms and facilities shall be designed and implemented.',
'Apply security measures appropriate to area sensitivity. Include locks, access controls, and monitoring.',
ARRAY['Security design', 'Lock records', 'Monitoring configuration']),

-- A.7.4 Physical security monitoring
('iso27001', 'A.7.4', 'Physical Controls', 'Physical security monitoring',
'Premises shall be continuously monitored for unauthorized physical access.',
'Implement CCTV, intrusion detection, and security patrols. Monitor and respond to alerts.',
ARRAY['CCTV system', 'Intrusion detection', 'Monitoring logs', 'Response records']),

-- A.7.5 Protecting against physical and environmental threats
('iso27001', 'A.7.5', 'Physical Controls', 'Protecting against physical and environmental threats',
'Protection against physical and environmental threats, such as natural disasters and other intentional or unintentional physical threats to infrastructure shall be designed and implemented.',
'Assess and mitigate environmental risks. Implement fire suppression, flood protection, and climate control.',
ARRAY['Risk assessment', 'Fire suppression', 'Environmental controls']),

-- A.7.6 Working in secure areas
('iso27001', 'A.7.6', 'Physical Controls', 'Working in secure areas',
'Security measures for working in secure areas shall be designed and implemented.',
'Define rules for secure areas. Control access, prohibit recording devices, supervise visitors.',
ARRAY['Secure area procedures', 'Visitor logs', 'Supervision records']),

-- A.7.7 Clear desk and clear screen
('iso27001', 'A.7.7', 'Physical Controls', 'Clear desk and clear screen',
'Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities shall be defined and appropriately enforced.',
'Define and enforce clear desk/screen policy. Include automatic screen lock and secure storage.',
ARRAY['Clear desk policy', 'Screen lock configuration', 'Compliance checks']),

-- A.7.8 Equipment siting and protection
('iso27001', 'A.7.8', 'Physical Controls', 'Equipment siting and protection',
'Equipment shall be sited securely and protected.',
'Site equipment to minimize unauthorized access and environmental risks. Protect power and network connections.',
ARRAY['Equipment location records', 'Protection measures', 'Environmental monitoring']),

-- A.7.9 Security of assets off-premises
('iso27001', 'A.7.9', 'Physical Controls', 'Security of assets off-premises',
'Off-site assets shall be protected.',
'Define controls for assets taken off-site. Include encryption, physical security, and tracking.',
ARRAY['Off-site asset policy', 'Encryption configuration', 'Asset tracking']),

-- A.7.10 Storage media
('iso27001', 'A.7.10', 'Physical Controls', 'Storage media',
'Storage media shall be managed through their life cycle of acquisition, use, transportation and disposal in accordance with the organisation''s classification scheme and handling requirements.',
'Implement media management procedures. Control access, transport, and disposal based on classification.',
ARRAY['Media management procedures', 'Media inventory', 'Disposal records']),

-- A.7.11 Supporting utilities
('iso27001', 'A.7.11', 'Physical Controls', 'Supporting utilities',
'Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities.',
'Implement UPS, backup power, and redundant utilities. Test regularly.',
ARRAY['UPS configuration', 'Backup power', 'Test records']),

-- A.7.12 Cabling security
('iso27001', 'A.7.12', 'Physical Controls', 'Cabling security',
'Cables carrying power and data or supporting information services shall be protected from interception, interference or damage.',
'Protect cables from unauthorized access and physical damage. Separate power and data cables.',
ARRAY['Cabling documentation', 'Protection measures', 'Cable management']),

-- A.7.13 Equipment maintenance
('iso27001', 'A.7.13', 'Physical Controls', 'Equipment maintenance',
'Equipment shall be maintained correctly to ensure availability, integrity and confidentiality of information.',
'Implement maintenance schedules. Use authorized personnel. Protect data during maintenance.',
ARRAY['Maintenance schedules', 'Maintenance records', 'Service contracts']),

-- A.7.14 Secure disposal or re-use of equipment
('iso27001', 'A.7.14', 'Physical Controls', 'Secure disposal or re-use of equipment',
'Items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use.',
'Implement secure disposal procedures. Verify data destruction. Maintain disposal records.',
ARRAY['Disposal procedures', 'Data destruction records', 'Certificates of destruction']);

-- =============================================================================
-- THEME 8: TECHNOLOGICAL CONTROLS (34 controls)
-- =============================================================================

INSERT INTO public.controls (framework, control_code, domain, title, description, guidance, evidence_types) VALUES

-- A.8.1 User endpoint devices
('iso27001', 'A.8.1', 'Technological Controls', 'User endpoint devices',
'Information stored on, processed by or accessible via user endpoint devices shall be protected.',
'Implement endpoint protection including antimalware, encryption, patching, and configuration management.',
ARRAY['Endpoint security policy', 'AV configuration', 'Encryption status', 'Patch levels']),

-- A.8.2 Privileged access rights
('iso27001', 'A.8.2', 'Technological Controls', 'Privileged access rights',
'The allocation and use of privileged access rights shall be restricted and managed.',
'Implement PAM controls. Restrict and monitor privileged accounts. Use just-in-time access where possible.',
ARRAY['PAM solution', 'Privileged account inventory', 'Access logs', 'Review records']),

-- A.8.3 Information access restriction
('iso27001', 'A.8.3', 'Technological Controls', 'Information access restriction',
'Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control.',
'Implement access controls at application, database, and file levels. Enforce need-to-know.',
ARRAY['Access control configuration', 'Permission matrices', 'Access logs']),

-- A.8.4 Access to source code
('iso27001', 'A.8.4', 'Technological Controls', 'Access to source code',
'Read and write access to source code, development tools and software libraries shall be appropriately managed.',
'Restrict access to source code repositories. Implement code review processes. Protect development environments.',
ARRAY['Repository access controls', 'Code review procedures', 'Access logs']),

-- A.8.5 Secure authentication
('iso27001', 'A.8.5', 'Technological Controls', 'Secure authentication',
'Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control.',
'Implement MFA for sensitive systems. Use strong authentication methods. Protect authentication data.',
ARRAY['MFA configuration', 'Authentication policy', 'System configuration']),

-- A.8.6 Capacity management
('iso27001', 'A.8.6', 'Technological Controls', 'Capacity management',
'The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.',
'Monitor resource utilization. Plan for capacity needs. Implement alerting for capacity issues.',
ARRAY['Monitoring dashboards', 'Capacity plans', 'Alert configuration']),

-- A.8.7 Protection against malware
('iso27001', 'A.8.7', 'Technological Controls', 'Protection against malware',
'Protection against malware shall be implemented and supported by appropriate user awareness.',
'Deploy antimalware solutions across all systems. Keep signatures current. Include user awareness training.',
ARRAY['AV deployment records', 'Update status', 'Scan reports', 'Training records']),

-- A.8.8 Management of technical vulnerabilities
('iso27001', 'A.8.8', 'Technological Controls', 'Management of technical vulnerabilities',
'Information about technical vulnerabilities of information systems in use shall be obtained, the organisation''s exposure to such vulnerabilities shall be evaluated and appropriate measures shall be taken.',
'Implement vulnerability scanning. Prioritize and remediate vulnerabilities. Track remediation progress.',
ARRAY['Vulnerability scan reports', 'Remediation records', 'Patch management records']),

-- A.8.9 Configuration management
('iso27001', 'A.8.9', 'Technological Controls', 'Configuration management',
'Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.',
'Define secure baseline configurations. Implement configuration management. Monitor for drift.',
ARRAY['Baseline configurations', 'Configuration management system', 'Compliance reports']),

-- A.8.10 Information deletion
('iso27001', 'A.8.10', 'Technological Controls', 'Information deletion',
'Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.',
'Implement data retention and deletion procedures. Verify secure deletion. Maintain deletion records.',
ARRAY['Retention schedule', 'Deletion procedures', 'Deletion records']),

-- A.8.11 Data masking
('iso27001', 'A.8.11', 'Technological Controls', 'Data masking',
'Data masking shall be used in accordance with the organisation''s topic-specific policy on access control and other related topic-specific policies, and business requirements, taking applicable legislation into consideration.',
'Implement data masking for sensitive data in non-production environments and reports.',
ARRAY['Data masking policy', 'Masking configuration', 'Environment inventory']),

-- A.8.12 Data leakage prevention
('iso27001', 'A.8.12', 'Technological Controls', 'Data leakage prevention',
'Data leakage prevention measures shall be applied to systems, networks and any other devices that process, store or transmit sensitive information.',
'Implement DLP controls for sensitive data. Monitor and block unauthorized transfers.',
ARRAY['DLP policy', 'DLP configuration', 'Alert/incident records']),

-- A.8.13 Information backup
('iso27001', 'A.8.13', 'Technological Controls', 'Information backup',
'Backup copies of information, software and systems shall be maintained and regularly tested in accordance with the agreed topic-specific policy on backup.',
'Implement backup procedures. Test restores regularly. Store backups securely.',
ARRAY['Backup policy', 'Backup logs', 'Restore test records', 'Offsite storage']),

-- A.8.14 Redundancy of information processing facilities
('iso27001', 'A.8.14', 'Technological Controls', 'Redundancy of information processing facilities',
'Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.',
'Implement redundancy for critical systems. Test failover capabilities. Document recovery procedures.',
ARRAY['Redundancy architecture', 'Failover test records', 'Availability reports']),

-- A.8.15 Logging
('iso27001', 'A.8.15', 'Technological Controls', 'Logging',
'Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.',
'Implement comprehensive logging. Protect log integrity. Retain logs appropriately.',
ARRAY['Logging policy', 'Log configuration', 'Log retention', 'Log analysis']),

-- A.8.16 Monitoring activities
('iso27001', 'A.8.16', 'Technological Controls', 'Monitoring activities',
'Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.',
'Implement security monitoring. Define alerting rules. Respond to anomalies.',
ARRAY['Monitoring tools', 'Alert rules', 'Response procedures', 'Incident records']),

-- A.8.17 Clock synchronisation
('iso27001', 'A.8.17', 'Technological Controls', 'Clock synchronisation',
'The clocks of information processing systems used by the organisation shall be synchronised to approved time sources.',
'Configure NTP across all systems. Use authoritative time sources. Monitor synchronization.',
ARRAY['NTP configuration', 'Time source documentation', 'Sync monitoring']),

-- A.8.18 Use of privileged utility programs
('iso27001', 'A.8.18', 'Technological Controls', 'Use of privileged utility programs',
'The use of utility programs that can be capable of overriding system and application controls shall be restricted and tightly controlled.',
'Restrict access to system utilities. Log and monitor usage. Remove unnecessary utilities.',
ARRAY['Utility program inventory', 'Access controls', 'Usage logs']),

-- A.8.19 Installation of software on operational systems
('iso27001', 'A.8.19', 'Technological Controls', 'Installation of software on operational systems',
'Procedures and measures shall be implemented to securely manage software installation on operational systems.',
'Implement software installation controls. Use approved software lists. Prevent unauthorized installations.',
ARRAY['Software installation policy', 'Approved software list', 'Installation logs']),

-- A.8.20 Networks security
('iso27001', 'A.8.20', 'Technological Controls', 'Networks security',
'Networks and network devices shall be secured, managed and controlled to protect information in systems and applications.',
'Implement network security controls including firewalls, segmentation, and access controls.',
ARRAY['Network architecture', 'Firewall rules', 'Network access controls']),

-- A.8.21 Security of network services
('iso27001', 'A.8.21', 'Technological Controls', 'Security of network services',
'Security mechanisms, service levels and service requirements of network services shall be identified, implemented and monitored.',
'Define security requirements for network services. Monitor service levels. Include in contracts.',
ARRAY['Service requirements', 'SLAs', 'Monitoring records']),

-- A.8.22 Segregation of networks
('iso27001', 'A.8.22', 'Technological Controls', 'Segregation of networks',
'Groups of information services, users and information systems shall be segregated in networks.',
'Implement network segmentation based on trust levels and data classification. Use VLANs, firewalls.',
ARRAY['Network segmentation design', 'VLAN configuration', 'Firewall rules']),

-- A.8.23 Web filtering
('iso27001', 'A.8.23', 'Technological Controls', 'Web filtering',
'Access to external websites shall be managed to reduce exposure to malicious content.',
'Implement web filtering. Block malicious and inappropriate categories. Log and monitor access.',
ARRAY['Web filtering policy', 'Filter configuration', 'Access logs']),

-- A.8.24 Use of cryptography
('iso27001', 'A.8.24', 'Technological Controls', 'Use of cryptography',
'Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.',
'Define cryptographic standards. Implement key management. Use approved algorithms.',
ARRAY['Cryptographic policy', 'Key management procedures', 'Encryption configuration']),

-- A.8.25 Secure development life cycle
('iso27001', 'A.8.25', 'Technological Controls', 'Secure development life cycle',
'Rules for the secure development of software and systems shall be established and applied.',
'Implement secure SDLC. Include security requirements, design review, code review, and testing.',
ARRAY['SDLC documentation', 'Security requirements', 'Review records', 'Test results']),

-- A.8.26 Application security requirements
('iso27001', 'A.8.26', 'Technological Controls', 'Application security requirements',
'Information security requirements shall be identified, specified and approved when developing or acquiring applications.',
'Define security requirements for applications. Include in specifications and acceptance criteria.',
ARRAY['Security requirements', 'Specifications', 'Acceptance criteria']),

-- A.8.27 Secure system architecture and engineering principles
('iso27001', 'A.8.27', 'Technological Controls', 'Secure system architecture and engineering principles',
'Principles for engineering secure systems shall be established, documented, maintained and applied to any information system development activities.',
'Define and apply secure design principles. Include defense in depth, least privilege, secure defaults.',
ARRAY['Design principles', 'Architecture reviews', 'Security patterns']),

-- A.8.28 Secure coding
('iso27001', 'A.8.28', 'Technological Controls', 'Secure coding',
'Secure coding principles shall be applied to software development.',
'Implement secure coding standards. Use static analysis. Train developers.',
ARRAY['Coding standards', 'SAST results', 'Training records']),

-- A.8.29 Security testing in development and acceptance
('iso27001', 'A.8.29', 'Technological Controls', 'Security testing in development and acceptance',
'Security testing processes shall be defined and implemented in the development life cycle.',
'Include security testing in SDLC. Perform penetration testing. Test before release.',
ARRAY['Testing procedures', 'Test results', 'Penetration test reports']),

-- A.8.30 Outsourced development
('iso27001', 'A.8.30', 'Technological Controls', 'Outsourced development',
'The organisation shall direct, monitor and review the activities related to outsourced system development.',
'Include security requirements in outsourced development contracts. Monitor and review deliverables.',
ARRAY['Development contracts', 'Security requirements', 'Review records']),

-- A.8.31 Separation of development, test and production environments
('iso27001', 'A.8.31', 'Technological Controls', 'Separation of development, test and production environments',
'Development, testing and production environments shall be separated and secured.',
'Maintain separate environments. Control access between environments. Protect production data in non-production.',
ARRAY['Environment inventory', 'Access controls', 'Data protection measures']),

-- A.8.32 Change management
('iso27001', 'A.8.32', 'Technological Controls', 'Change management',
'Changes to information processing facilities and information systems shall be subject to change management procedures.',
'Implement change management process. Include security review. Test before deployment.',
ARRAY['Change management procedure', 'Change records', 'CAB minutes']),

-- A.8.33 Test information
('iso27001', 'A.8.33', 'Technological Controls', 'Test information',
'Test information shall be appropriately selected, protected and managed.',
'Use masked or synthetic data for testing. Protect test data appropriately. Remove when no longer needed.',
ARRAY['Test data policy', 'Data masking records', 'Test data inventory']),

-- A.8.34 Protection of information systems during audit testing
('iso27001', 'A.8.34', 'Technological Controls', 'Protection of information systems during audit testing',
'Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management.',
'Plan and control audit testing. Minimize impact on production. Protect audit tools and results.',
ARRAY['Audit plans', 'Testing agreements', 'Test results protection']);

-- Verify control count
DO $$
DECLARE
  control_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO control_count FROM public.controls WHERE framework = 'iso27001';
  RAISE NOTICE 'ISO 27001:2022 controls seeded: % controls', control_count;
  
  IF control_count <> 93 THEN
    RAISE WARNING 'Expected 93 controls, got %', control_count;
  END IF;
END $$;

