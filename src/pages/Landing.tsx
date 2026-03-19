import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Wand2,
  Zap,
  BarChart3,
  Shield,
  Link2,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "AI Prompt Improvement",
    description:
      "Transform vague prompts into precise, effective instructions with multi-model AI support.",
  },
  {
    icon: Sparkles,
    title: "Quality Scoring",
    description:
      "Get instant clarity, specificity, and effectiveness scores with actionable coaching tips.",
  },
  {
    icon: MessageSquare,
    title: "Natural Language Input",
    description:
      "Describe what you need in plain English and get a structured, optimized prompt back.",
  },
  {
    icon: Link2,
    title: "Prompt Chains",
    description:
      "Build multi-step prompt workflows that feed outputs into the next step automatically.",
  },
  {
    icon: Shield,
    title: "Safety Analysis",
    description:
      "Detect bias, toxicity, and ethical concerns before your prompts reach production.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track improvement trends, model usage, and coaching tip effectiveness over time.",
  },
];

const benefits = [
  "Save hours crafting effective prompts",
  "Get consistent, high-quality AI outputs",
  "Learn prompt engineering best practices",
  "Track your progress with detailed analytics",
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Wand2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">Prompt Improver</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-muted text-muted-foreground text-sm mb-8">
            <Zap className="h-4 w-4" />
            AI-powered prompt engineering
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight mb-6">
            Write better prompts.
            <br />
            <span className="text-primary">Get better results.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop guessing. Prompt Improver analyzes, scores, and enhances your
            AI prompts so you get consistent, high-quality outputs every time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-8" onClick={() => navigate("/auth")}>
              Start Improving Prompts
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}>
              See Features
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="border-y border-border bg-muted/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-4">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              {b}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to master prompts
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete toolkit for writing, analyzing, and optimizing AI prompts.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card
                key={f.title}
                className="border border-border bg-card hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="p-2.5 bg-primary/10 rounded-lg w-fit mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to level up your prompts?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join now and start getting better AI results in minutes.
          </p>
          <Button size="lg" className="text-base px-10" onClick={() => navigate("/auth")}>
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Prompt Improver
          </div>
          <p>© {new Date().getFullYear()} Prompt Improver. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
