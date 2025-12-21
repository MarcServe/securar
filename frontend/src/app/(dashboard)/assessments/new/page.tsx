"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  Globe,
  Users,
  Target,
  Loader2,
} from "lucide-react";

const FRAMEWORKS = [
  {
    id: "iso27001",
    name: "ISO 27001",
    description: "International standard for information security management systems (ISMS)",
    controls: 93,
    recommended: true,
  },
];

const INDUSTRIES = [
  "Technology / SaaS",
  "Financial Services",
  "Healthcare",
  "E-commerce / Retail",
  "Manufacturing",
  "Professional Services",
  "Education",
  "Government / Public Sector",
  "Other",
];

const SIZE_BANDS = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501+", label: "500+ employees" },
];

export default function NewAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [sizeBand, setSizeBand] = useState("");
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(["iso27001"]);

  const handleCreateAssessment = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user already has an org
      const { data: existingMembership } = await supabase
        .from("memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .single();

      let orgId = existingMembership?.org_id;

      // Create organisation if none exists
      if (!orgId) {
        const { data: newOrg, error: orgError } = await supabase
          .from("organisations")
          .insert({
            name: orgName,
            industry,
            country,
            size_band: sizeBand,
          })
          .select()
          .single();

        if (orgError) throw orgError;
        orgId = newOrg.id;

        // Create membership
        const { error: memberError } = await supabase
          .from("memberships")
          .insert({
            org_id: orgId,
            user_id: user.id,
            role: "admin",
          });

        if (memberError) throw memberError;
      } else {
        // Update existing org details
        await supabase
          .from("organisations")
          .update({
            name: orgName || undefined,
            industry: industry || undefined,
            country: country || undefined,
            size_band: sizeBand || undefined,
          })
          .eq("id", orgId);
      }

      // Create assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from("assessments")
        .insert({
          org_id: orgId,
          target_frameworks: selectedFrameworks,
          status: "draft",
          created_by: user.id,
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Redirect to the assessment
      router.push(`/assessments/${assessment.id}`);
    } catch (err: any) {
      console.error("Error creating assessment:", err);
      setError(err.message || "Failed to create assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress indicator */}
        <div className="flex items-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
              <span
                className={`text-sm ${
                  s <= step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s === 1 ? "Organisation" : s === 2 ? "Framework" : "Confirm"}
              </span>
              {s < 3 && (
                <div
                  className={`flex-1 h-0.5 ${
                    s < step ? "bg-primary" : "bg-secondary"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Organisation Details */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl font-bold mb-2">Tell us about your organisation</h1>
              <p className="text-muted-foreground">
                This helps us tailor the assessment to your specific context and industry.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Building2 className="inline h-4 w-4 mr-2" />
                  Organisation Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Corporation"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Target className="inline h-4 w-4 mr-2" />
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select your industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Globe className="inline h-4 w-4 mr-2" />
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="United Kingdom"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Users className="inline h-4 w-4 mr-2" />
                  Organisation Size
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SIZE_BANDS.map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => setSizeBand(size.value)}
                      className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                        sizeBand === size.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={() => setStep(2)}
                disabled={!orgName}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Framework Selection */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl font-bold mb-2">Select compliance framework</h1>
              <p className="text-muted-foreground">
                Choose the framework you want to assess your organisation against.
              </p>
            </div>

            <div className="space-y-4">
              {FRAMEWORKS.map((framework) => (
                <button
                  key={framework.id}
                  type="button"
                  onClick={() => setSelectedFrameworks([framework.id])}
                  className={`w-full p-6 rounded-xl border text-left transition-all ${
                    selectedFrameworks.includes(framework.id)
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{framework.name}</h3>
                        {framework.recommended && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mb-3">
                        {framework.description}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">{framework.controls}</span> controls to assess
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedFrameworks.includes(framework.id)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selectedFrameworks.includes(framework.id) && (
                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Additional frameworks (Cyber Essentials, SOC 2, GDPR) will be available in future updates.
              </p>
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedFrameworks.length === 0}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl font-bold mb-2">Ready to start your assessment</h1>
              <p className="text-muted-foreground">
                Review your details and begin the security readiness assessment.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="font-semibold mb-4">Assessment Summary</h2>
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Organisation</dt>
                    <dd className="font-medium">{orgName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Industry</dt>
                    <dd className="font-medium">{industry || "Not specified"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Country</dt>
                    <dd className="font-medium">{country}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Size</dt>
                    <dd className="font-medium">
                      {SIZE_BANDS.find((s) => s.value === sizeBand)?.label || "Not specified"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Framework</dt>
                    <dd className="font-medium">
                      {FRAMEWORKS.find((f) => f.id === selectedFrameworks[0])?.name}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-6 bg-secondary/30">
                <h3 className="font-medium mb-2">What happens next?</h3>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/20 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                    Answer adaptive questionnaire (15-20 minutes)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/20 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                    Upload supporting evidence (policies, procedures)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/20 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                    AI analyzes and maps to controls
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/20 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                    Receive your readiness score and report
                  </li>
                </ol>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleCreateAssessment}
                disabled={loading}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Start Assessment
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

