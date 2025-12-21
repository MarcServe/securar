# Securar - AI-Powered Security Readiness Platform

An AI-driven security readiness engine that automates 70–80% of pre-audit security assessments for SMEs, startups, and growing organisations.

![Securar](https://img.shields.io/badge/Status-MVP-blue)
![Framework](https://img.shields.io/badge/Framework-ISO%2027001-green)
![AI](https://img.shields.io/badge/AI-Claude%20Powered-purple)

## 🚀 Features

### Core Capabilities

- **Adaptive Security Questionnaire** - Context-aware, risk-based assessment that dynamically adjusts based on organisation size, industry, and compliance target
- **AI Document Intelligence** - Semantic extraction from policies, procedures, and evidence documents (PDF, DOCX, images)
- **ISO 27001 Control Mapping** - Automated mapping of responses and evidence to 93 Annex A controls
- **Explainable Scoring** - Defensible readiness scores with clear reasoning and confidence levels
- **Professional Reports** - Auditor-ready PDF reports with 30/60/90-day remediation roadmaps
- **Human-in-the-Loop** - Review and override AI assessments with full audit trail

### AI Guardrails

The AI is designed as a **decision-support system**, not a certifying authority:

- Never claims certification or compliance
- Always references evidence
- Expresses uncertainty appropriately
- Supports human review and override

## 📁 Project Structure

```
securar/
├── frontend/                 # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Supabase clients, utilities
│   │   └── types/           # TypeScript definitions
│   └── package.json
│
├── backend/                  # Node.js AI Brain Service
│   ├── src/
│   │   ├── ai/              # AI prompts, guardrails, context
│   │   ├── parsers/         # PDF, DOCX, OCR parsers
│   │   ├── reports/         # PDF generation
│   │   ├── server.js        # Express server
│   │   ├── scoring.js       # Readiness scoring
│   │   └── riskEngine.js    # Risk derivation
│   └── package.json
│
├── supabase/                 # Supabase Configuration
│   ├── migrations/          # Database schema
│   │   ├── 0001_init.sql
│   │   ├── 0002_seed_iso27001_controls.sql
│   │   └── 0003_seed_questions.sql
│   └── functions/           # Edge functions
│       └── run-assessment/
│
└── README.md
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI | Anthropic Claude |
| Document Parsing | pdf-parse, mammoth, tesseract.js |

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Anthropic API key (optional for AI features)

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/securar.git
cd securar
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database migrations in order:
   - Go to SQL Editor in Supabase Dashboard
   - Run `supabase/migrations/0001_init.sql`
   - Run `supabase/migrations/0002_seed_iso27001_controls.sql`
   - Run `supabase/migrations/0003_seed_questions.sql`

3. Create a Storage bucket:
   - Go to Storage in Supabase Dashboard
   - Create a new bucket called `evidence` (Private)

4. Get your credentials:
   - Project URL (Settings → API → Project URL)
   - Anon Key (Settings → API → anon public)
   - Service Role Key (Settings → API → service_role secret)

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=8080
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key  # Optional
```

Install and run:
```bash
npm install
npm run dev
```

### 4. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

Install and run:
```bash
npm install
npm run dev
```

### 5. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 User Journey

1. **Sign Up / Login** - Create account or sign in
2. **Create Organisation** - Set up company profile (industry, size, compliance target)
3. **Start Assessment** - Begin ISO 27001 readiness assessment
4. **Answer Questionnaire** - Complete adaptive security questionnaire
5. **Upload Evidence** - Add policies, procedures, and documentation
6. **Run Analysis** - AI analyzes responses and evidence
7. **Review Results** - Review control mappings and risks
8. **Human Review** - Override or accept AI decisions
9. **Generate Report** - Download professional PDF report

## 🔐 Security Features

### Row Level Security (RLS)

All data is protected by PostgreSQL RLS policies:
- Users can only access their organisation's data
- Role-based permissions (Admin, Contributor, Viewer, Consultant)
- Audit logs for all actions

### AI Safety

- Forbidden language detection and replacement
- Mandatory confidence indicators
- Source citation requirements
- Human override capability

## 📈 Scoring Model

The readiness score is calculated based on:

| Status | Weight |
|--------|--------|
| Compliant | 1.0 |
| Partial | 0.5 |
| Gap | 0 |
| Unknown | 0 |

Confidence modifiers are applied:
- High: 100%
- Medium: 90%
- Low: 70%

## 🗺️ Roadmap

### Phase 1: MVP ✅
- [x] Supabase schema with RLS
- [x] ISO 27001 control database
- [x] Adaptive questionnaire
- [x] Evidence upload
- [x] AI document analysis
- [x] Control mapping
- [x] Scoring engine
- [x] PDF reports
- [x] Human review workflow

### Phase 2: Post-MVP
- [ ] Cyber Essentials framework
- [ ] NCSC 10 Steps alignment
- [ ] Continuous monitoring
- [ ] Dashboard analytics
- [ ] Team collaboration features

### Phase 3: Enterprise
- [ ] Directory integrations (AD, Entra)
- [ ] Cloud provider connections
- [ ] White-label support
- [ ] API access
- [ ] SSO/SAML

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is proprietary. All rights reserved.

## ⚠️ Disclaimer

This platform provides **decision-support** for security assessments and does not constitute:
- Official certification
- Legal advice
- Guaranteed compliance
- Penetration testing

All AI assessments should be reviewed by qualified personnel. Consult with accredited certification bodies for formal audits.

---

Built with ❤️ for security teams everywhere.
