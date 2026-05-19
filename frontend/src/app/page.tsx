import Link from "next/link";
import { Shield, FileSearch, BarChart3, FileText, ArrowRight, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen animated-gradient">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Securar</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
            <span className="text-primary text-sm font-medium">
              ISO 27001 Pre-Audit Readiness
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Know Your Security Posture{" "}
            <span className="gradient-text">Before the Auditor Does</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            AI-powered security assessments that reduce weeks of manual work to hours.
            Get an honest, evidence-based view of your compliance readiness.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all hover:scale-105"
            >
              Start Free Assessment
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors py-4 px-8"
            >
              See How It Works
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>ISO 27001 Annex A Mapped</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>No certification claims</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>Explainable AI decisions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              From Chaos to Clarity in Four Steps
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We don&apos;t replace your auditor. We prepare you for them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "1. Tell Us About You",
                description:
                  "Quick setup: industry, size, cloud setup, compliance targets. We adapt to your context.",
              },
              {
                icon: FileSearch,
                title: "2. Answer & Upload",
                description:
                  "Adaptive questionnaire + policy uploads. AI reads your documents so you don't have to explain everything.",
              },
              {
                icon: BarChart3,
                title: "3. AI Analysis",
                description:
                  "We map your answers and evidence to 93 ISO 27001 controls. Every decision is explainable.",
              },
              {
                icon: FileText,
                title: "4. Get Your Report",
                description:
                  "Readiness score, gap analysis, and a 30/60/90-day roadmap. Auditor-ready output.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="glass border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="bg-primary/10 rounded-lg p-3 inline-block mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We're Not Section */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Honest About What We Are (And Aren&apos;t)
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">What Securar Is</h3>
              <ul className="space-y-3">
                {[
                  "A decision-support system for security teams",
                  "A control-mapping assistant for ISO 27001",
                  "A risk explanation engine for executives",
                  "A report generator that auditors can trust",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-rose-400">What Securar Is Not</h3>
              <ul className="space-y-3">
                {[
                  "Not a certifying authority",
                  "Not a penetration testing tool",
                  "Not a legal compliance guarantee",
                  "Not a replacement for human judgement",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400">✕</span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to See Where You Stand?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start with a free assessment. No credit card required.
            Get your first readiness score in under 2 hours.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            Start Your Assessment
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold">Securar</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-assisted security readiness. Not certification.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

