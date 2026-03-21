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

const testimonials = [
  {
    name: "Sarah Chen",
    role: "AI Product Manager",
    quote:
      "Prompt Improver cut my prompt iteration time by 80%. The quality scoring alone is worth it — I catch vague instructions before they waste expensive API calls.",
    initials: "SC",
  },
  {
    name: "Marcus Rivera",
    role: "Senior Developer",
    quote:
      "The A/B comparison feature is a game-changer. I can see three optimization strategies side-by-side and pick the best one in seconds instead of guessing.",
    initials: "MR",
  },
  {
    name: "Dr. Aisha Patel",
    role: "Research Scientist",
    quote:
      "The safety analysis flagged bias issues in my research prompts that I completely missed. Essential tool for anyone doing serious AI work.",
    initials: "AP",
  },
];

const benefits = [
  "Save hours crafting effective prompts",
  "Get consistent, high-quality AI outputs",
  "Learn prompt engineering best practices",
  "Track your progress with detailed analytics",
];

const demoExamples = [
  {
    label: "Content Writing",
    before: "Write a blog post about AI",
    after: `You are an experienced tech journalist. Write a 1,200-word blog post titled "How AI Is Reshaping Creative Work in 2026." Structure it with an engaging hook, three concrete use-case sections (visual design, copywriting, music production), and a balanced conclusion addressing both opportunities and ethical considerations. Use a conversational yet authoritative tone. Include at least one real-world example per section.`,
  },
  {
    label: "Code Review",
    before: "Review my code",
    after: `Act as a senior software engineer conducting a thorough code review. Analyze the provided code for: (1) correctness and potential bugs, (2) performance bottlenecks, (3) security vulnerabilities, (4) adherence to SOLID principles, and (5) readability and naming conventions. For each issue found, explain why it matters and provide a concrete fix. Prioritize findings by severity (critical → minor). End with a summary of strengths and a ranked list of improvements.`,
  },
  {
    label: "Data Analysis",
    before: "Analyze this data for me",
    after: `You are a data analyst with expertise in business intelligence. Analyze the provided dataset and deliver: (1) a statistical summary of key metrics with mean, median, and standard deviation, (2) identification of the top 3 trends or patterns with supporting evidence, (3) any anomalies or outliers worth investigating, and (4) three actionable recommendations based on your findings. Present results in clearly labeled sections with bullet points. Use plain language suitable for a non-technical executive audience.`,
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const [activeDemoIndex, setActiveDemoIndex] = useState(0);
  const activeDemo = demoExamples[activeDemoIndex];

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

      {/* Demo / Preview */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              See it in action
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Watch how a vague prompt becomes a precise, effective instruction.
            </p>
          </div>

          {/* Example tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {demoExamples.map((ex, i) => (
              <button
                key={ex.label}
                onClick={() => setActiveDemoIndex(i)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  i === activeDemoIndex
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Before / After cards */}
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-destructive">Before</span>
                </div>
                <p className="text-foreground text-base leading-relaxed font-mono bg-background/60 rounded-lg p-4 border border-border">
                  {activeDemo.before}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">After</span>
                </div>
                <p className="text-foreground text-sm leading-relaxed font-mono bg-background/60 rounded-lg p-4 border border-border">
                  {activeDemo.after}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-10">
            <Button onClick={() => navigate("/auth")} variant="outline" className="text-base">
              Try it yourself
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
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

      {/* Testimonials */}
      <section className="py-24 px-6 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Trusted by prompt engineers
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See how teams and individuals are getting better AI results.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="border border-border bg-card">
                <CardContent className="p-6 flex flex-col gap-4">
                  <p className="text-foreground text-sm leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
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
