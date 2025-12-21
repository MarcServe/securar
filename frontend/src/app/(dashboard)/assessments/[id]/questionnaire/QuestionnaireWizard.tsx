"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Loader2, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Question, Response } from "@/types/database";

interface QuestionnaireWizardProps {
  assessmentId: string;
  questions: Question[];
  existingResponses: Response[];
  domains: string[];
}

export function QuestionnaireWizard({
  assessmentId,
  questions,
  existingResponses,
  domains,
}: QuestionnaireWizardProps) {
  const router = useRouter();
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize responses from existing data
  useEffect(() => {
    const initialResponses: Record<string, string> = {};
    existingResponses.forEach((r) => {
      const answer = r.answer as { value?: string } | string;
      initialResponses[r.question_id] = 
        typeof answer === "string" ? answer : answer?.value || "";
    });
    setResponses(initialResponses);
  }, [existingResponses]);

  const currentDomain = domains[currentDomainIndex];
  const domainQuestions = questions.filter((q) => q.domain === currentDomain);
  const currentQuestion = domainQuestions[currentQuestionIndex];

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(responses).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Get questions answered in current domain
  const domainAnswered = domainQuestions.filter(
    (q) => responses[q.id]
  ).length;

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion) return;

    setSaving(true);
    const newResponses = { ...responses, [currentQuestion.id]: answer };
    setResponses(newResponses);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Upsert response
    await (supabase.from("responses") as any).upsert({
      assessment_id: assessmentId,
      question_id: currentQuestion.id,
      answer: { value: answer },
      answered_by: user?.id,
    }, {
      onConflict: "assessment_id,question_id",
    });

    // Update assessment status if first response
    if (Object.keys(responses).length === 0) {
      await (supabase.from("assessments") as any)
        .update({ status: "collecting" })
        .eq("id", assessmentId);
    }

    setSaving(false);

    // Auto-advance to next question
    if (currentQuestionIndex < domainQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentDomainIndex < domains.length - 1) {
      setCurrentDomainIndex(currentDomainIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < domainQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentDomainIndex < domains.length - 1) {
      setCurrentDomainIndex(currentDomainIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentDomainIndex > 0) {
      setCurrentDomainIndex(currentDomainIndex - 1);
      const prevDomainQuestions = questions.filter(
        (q) => q.domain === domains[currentDomainIndex - 1]
      );
      setCurrentQuestionIndex(prevDomainQuestions.length - 1);
    }
  };

  const handleComplete = () => {
    router.push(`/assessments/${assessmentId}`);
    router.refresh();
  };

  const isLastQuestion =
    currentDomainIndex === domains.length - 1 &&
    currentQuestionIndex === domainQuestions.length - 1;

  const currentAnswer = currentQuestion ? responses[currentQuestion.id] : undefined;
  const choices = currentQuestion?.choices as string[] || [];

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">
            {answeredCount} of {totalQuestions} questions
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Domain Navigation */}
      <div className="flex flex-wrap gap-2">
        {domains.map((domain, index) => {
          const dQuestions = questions.filter((q) => q.domain === domain);
          const dAnswered = dQuestions.filter((q) => responses[q.id]).length;
          const isComplete = dAnswered === dQuestions.length;
          const isCurrent = index === currentDomainIndex;

          return (
            <button
              key={domain}
              onClick={() => {
                setCurrentDomainIndex(index);
                setCurrentQuestionIndex(0);
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isComplete
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              )}
            >
              {isComplete && <CheckCircle2 className="h-4 w-4" />}
              {domain}
              {!isComplete && (
                <span className="text-xs opacity-70">
                  {dAnswered}/{dQuestions.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="text-sm text-primary font-medium">
                {currentDomain}
              </span>
              <h2 className="text-xl font-semibold mt-1">
                {currentQuestion.question_text}
              </h2>
            </div>
            {currentQuestion.help_text && (
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            )}
          </div>

          {showHelp && currentQuestion.help_text && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-sm text-muted-foreground">
              {currentQuestion.help_text}
            </div>
          )}

          {/* Answer Choices */}
          <div className="space-y-3">
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(choice)}
                disabled={saving}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                  currentAnswer === choice
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    currentAnswer === choice
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {currentAnswer === choice && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <span>{choice}</span>
                {saving && currentAnswer === choice && (
                  <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                )}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              onClick={handlePrevious}
              disabled={currentDomainIndex === 0 && currentQuestionIndex === 0}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                currentDomainIndex === 0 && currentQuestionIndex === 0
                  ? "text-muted-foreground cursor-not-allowed"
                  : "hover:bg-secondary"
              )}
            >
              Previous
            </button>

            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {domainQuestions.length}
            </span>

            {isLastQuestion ? (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Complete
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                Skip
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-bold text-emerald-400">{answeredCount}</p>
          <p className="text-sm text-muted-foreground">Answered</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-bold text-amber-400">
            {totalQuestions - answeredCount}
          </p>
          <p className="text-sm text-muted-foreground">Remaining</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-bold">{progressPercent}%</p>
          <p className="text-sm text-muted-foreground">Complete</p>
        </div>
      </div>
    </div>
  );
}

