"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Building2, Users, Globe, Cloud, Target, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Step = "industry" | "size" | "infrastructure" | "compliance";

interface OnboardingData {
  industry: string;
  country: string;
  size_band: string;
  infrastructure: string;
  compliance_targets: string[];
}

const INDUSTRIES = [
  { id: "technology", label: "Technology & Software", icon: "💻" },
  { id: "finance", label: "Financial Services", icon: "🏦" },
  { id: "healthcare", label: "Healthcare", icon: "🏥" },
  { id: "retail", label: "Retail & E-commerce", icon: "🛒" },
  { id: "manufacturing", label: "Manufacturing", icon: "🏭" },
  { id: "professional", label: "Professional Services", icon: "💼" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "government", label: "Government & Public Sector", icon: "🏛️" },
  { id: "media", label: "Media & Entertainment", icon: "🎬" },
  { id: "other", label: "Other", icon: "📋" },
];

const SIZE_BANDS = [
  { id: "1-10", label: "1-10 employees", description: "Micro business" },
  { id: "11-50", label: "11-50 employees", description: "Small business" },
  { id: "51-250", label: "51-250 employees", description: "Medium business" },
  { id: "251-1000", label: "251-1000 employees", description: "Large business" },
  { id: "1000+", label: "1000+ employees", description: "Enterprise" },
];

const COUNTRIES = [
  { id: "GB", label: "United Kingdom" },
  { id: "US", label: "United States" },
  { id: "DE", label: "Germany" },
  { id: "FR", label: "France" },
  { id: "NL", label: "Netherlands" },
  { id: "IE", label: "Ireland" },
  { id: "AU", label: "Australia" },
  { id: "CA", label: "Canada" },
  { id: "OTHER", label: "Other" },
];

const INFRASTRUCTURE = [
  { id: "cloud", label: "Cloud-only", description: "All systems hosted in cloud (AWS, Azure, GCP, etc.)", icon: Cloud },
  { id: "hybrid", label: "Hybrid", description: "Mix of cloud and on-premises systems", icon: Globe },
  { id: "on-prem", label: "On-premises", description: "All systems hosted in own data centres", icon: Building2 },
];

const COMPLIANCE_TARGETS = [
  { id: "iso27001", label: "ISO 27001", description: "International standard for information security management", recommended: true },
  { id: "cyber_essentials", label: "Cyber Essentials", description: "UK government-backed scheme (coming soon)", disabled: true },
  { id: "soc2", label: "SOC 2", description: "Service organization controls (coming soon)", disabled: true },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("industry");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    industry: "",
    country: "GB",
    size_band: "",
    infrastructure: "",
    compliance_targets: ["iso27001"],
  });

  const steps: Step[] = ["industry", "size", "infrastructure", "compliance"];
  const currentIndex = steps.indexOf(step);

  const updateData = (key: keyof OnboardingData, value: string | string[]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case "industry":
        return data.industry !== "";
      case "size":
        return data.size_band !== "";
      case "infrastructure":
        return data.infrastructure !== "";
      case "compliance":
        return data.compliance_targets.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user's org membership
      const { data: membershipData, error: memError } = await supabase
        .from("memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .single();

      if (memError) throw new Error("Organisation not found");
      const membership = membershipData as { org_id: string };

      // Update organisation profile
      const { error: updateError } = await (supabase.from("organisations") as any)
        .update({
          industry: data.industry,
          country: data.country,
          size_band: data.size_band,
        })
        .eq("id", membership.org_id);

      if (updateError) throw updateError;

      // Create initial assessment
      const { data: assessment, error: assessError } = await (supabase.from("assessments") as any)
        .insert({
          org_id: membership.org_id,
          target_frameworks: data.compliance_targets,
          status: "draft",
          created_by: user.id,
        })
        .select()
        .single();

      if (assessError) throw assessError;

      // Redirect to the new assessment
      router.push(`/assessments/${assessment.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Progress */}
      <div className="hidden lg:flex lg:w-80 bg-card border-r border-border flex-col p-8">
        <div className="flex items-center gap-2 mb-12">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Securar</span>
        </div>

        <div className="space-y-4 flex-1">
          {[
            { step: "industry", label: "Industry", icon: Building2 },
            { step: "size", label: "Organisation Size", icon: Users },
            { step: "infrastructure", label: "Infrastructure", icon: Cloud },
            { step: "compliance", label: "Compliance Target", icon: Target },
          ].map((item, index) => {
            const isActive = step === item.step;
            const isComplete = steps.indexOf(step) > index;

            return (
              <div
                key={item.step}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  isActive && "bg-primary/10 text-primary",
                  isComplete && "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    isActive && "bg-primary text-primary-foreground",
                    isComplete && "bg-primary/20 text-primary",
                    !isActive && !isComplete && "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? "✓" : index + 1}
                </div>
                <span className={cn("font-medium", isActive && "text-primary")}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground">
          This helps us tailor the assessment to your organisation.
        </p>
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            {/* Mobile Progress */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    "w-3 h-3 rounded-full",
                    i <= currentIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6">
                {error}
              </div>
            )}

            {/* Step: Industry */}
            {step === "industry" && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold mb-2">What industry are you in?</h1>
                <p className="text-muted-foreground mb-8">
                  This helps us understand your regulatory environment and typical security requirements.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {INDUSTRIES.map((industry) => (
                    <button
                      key={industry.id}
                      onClick={() => updateData("industry", industry.id)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                        data.industry === industry.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-2xl">{industry.icon}</span>
                      <span className="font-medium">{industry.label}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Primary country of operation</label>
                  <select
                    value={data.country}
                    onChange={(e) => updateData("country", e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step: Size */}
            {step === "size" && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold mb-2">How large is your organisation?</h1>
                <p className="text-muted-foreground mb-8">
                  We&apos;ll adjust the assessment depth and complexity based on your size.
                </p>

                <div className="space-y-3">
                  {SIZE_BANDS.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => updateData("size_band", size.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                        data.size_band === size.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div>
                        <p className="font-medium">{size.label}</p>
                        <p className="text-sm text-muted-foreground">{size.description}</p>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          data.size_band === size.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        )}
                      >
                        {data.size_band === size.id && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step: Infrastructure */}
            {step === "infrastructure" && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold mb-2">Where do you host your systems?</h1>
                <p className="text-muted-foreground mb-8">
                  Your infrastructure setup affects which controls are most relevant.
                </p>

                <div className="space-y-3">
                  {INFRASTRUCTURE.map((infra) => (
                    <button
                      key={infra.id}
                      onClick={() => updateData("infrastructure", infra.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                        data.infrastructure === infra.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div
                        className={cn(
                          "p-3 rounded-lg",
                          data.infrastructure === infra.id
                            ? "bg-primary/20"
                            : "bg-muted"
                        )}
                      >
                        <infra.icon className={cn(
                          "h-6 w-6",
                          data.infrastructure === infra.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{infra.label}</p>
                        <p className="text-sm text-muted-foreground">{infra.description}</p>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          data.infrastructure === infra.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        )}
                      >
                        {data.infrastructure === infra.id && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step: Compliance */}
            {step === "compliance" && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold mb-2">What are you preparing for?</h1>
                <p className="text-muted-foreground mb-8">
                  Select the compliance framework(s) you want to assess against.
                </p>

                <div className="space-y-3">
                  {COMPLIANCE_TARGETS.map((target) => (
                    <button
                      key={target.id}
                      onClick={() => {
                        if (target.disabled) return;
                        const current = data.compliance_targets;
                        if (current.includes(target.id)) {
                          updateData("compliance_targets", current.filter((t) => t !== target.id));
                        } else {
                          updateData("compliance_targets", [...current, target.id]);
                        }
                      }}
                      disabled={target.disabled}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                        data.compliance_targets.includes(target.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50",
                        target.disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded border-2 flex items-center justify-center",
                          data.compliance_targets.includes(target.id)
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        )}
                      >
                        {data.compliance_targets.includes(target.id) && (
                          <span className="text-primary-foreground text-sm">✓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{target.label}</p>
                          {target.recommended && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          )}
                          {target.disabled && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              Coming soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{target.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-border p-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentIndex === 0}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                currentIndex === 0
                  ? "text-muted-foreground cursor-not-allowed"
                  : "hover:bg-secondary"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {currentIndex < steps.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={cn(
                  "flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors",
                  !canProceed() && "opacity-50 cursor-not-allowed"
                )}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed() || loading}
                className={cn(
                  "flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors",
                  (!canProceed() || loading) && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating assessment...
                  </>
                ) : (
                  <>
                    Start Assessment
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

