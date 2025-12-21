import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { QuestionnaireWizard } from "./QuestionnaireWizard";

export default async function QuestionnairePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load assessment
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("*, organisations(*)")
    .eq("id", params.id)
    .single();

  if (assessmentError || !assessment) {
    notFound();
  }

  // Load questions for this framework
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("framework_tag", assessment.target_frameworks?.[0] || "iso27001")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  // Load existing responses
  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .eq("assessment_id", params.id);

  // Get org size to filter questions
  const org = assessment.organisations as { size_band: string | null } | null;
  const orgSize = org?.size_band || "small";

  // Filter questions based on org size relevance
  const filteredQuestions = questions?.filter((q) => {
    if (!q.org_size_relevance || q.org_size_relevance.length === 0) return true;
    const sizeMap: Record<string, string> = {
      "1-10": "micro",
      "11-50": "small",
      "51-250": "medium",
      "251-1000": "large",
      "1000+": "large",
    };
    const mappedSize = sizeMap[orgSize] || "small";
    return q.org_size_relevance.includes(mappedSize);
  }) || [];

  // Group questions by domain
  const domains = [...new Set(filteredQuestions.map((q) => q.domain))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href={`/assessments/${params.id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessment
          </Link>
          <h1 className="text-xl font-bold">Security Questionnaire</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <QuestionnaireWizard
          assessmentId={params.id}
          questions={filteredQuestions}
          existingResponses={responses || []}
          domains={domains}
        />
      </main>
    </div>
  );
}

