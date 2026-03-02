import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SafetyIssue {
  type: string;
  severity: string;
  description: string;
  suggestion: string;
}

interface SafetyResult {
  overallRisk: string;
  safetyScore: number;
  issues: SafetyIssue[];
}

interface PromptSafetyAnalysisProps {
  prompt: string;
}

const riskIcon = {
  low: <ShieldCheck className="h-5 w-5 text-green-500" />,
  medium: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  high: <ShieldAlert className="h-5 w-5 text-red-500" />,
};

const severityColor: Record<string, string> = {
  low: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
  high: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
};

const typeLabels: Record<string, string> = {
  bias: "Bias",
  ambiguity: "Ambiguity",
  "missing-guardrails": "Missing Guardrails",
  "harmful-output-risk": "Harmful Output Risk",
  "data-leakage": "Data Leakage",
};

const PromptSafetyAnalysis = ({ prompt }: PromptSafetyAnalysisProps) => {
  const [result, setResult] = useState<SafetyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const analyze = async () => {
    if (!prompt.trim()) {
      toast({ title: "No prompt", description: "Enter a prompt first", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-safety", {
        body: { prompt: prompt.trim() },
      });
      if (error) throw error;
      setResult(data);
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message || "Try again later", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const scoreColor = result
    ? result.safetyScore >= 80 ? "text-green-600 dark:text-green-400"
    : result.safetyScore >= 50 ? "text-yellow-600 dark:text-yellow-400"
    : "text-red-600 dark:text-red-400"
    : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Safety Analysis
        </h3>
        <Button onClick={analyze} disabled={isLoading || !prompt.trim()} size="sm">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isLoading ? "Analyzing..." : "Analyze Safety"}
        </Button>
      </div>

      {result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {riskIcon[result.overallRisk as keyof typeof riskIcon]}
                <CardTitle className="text-base">
                  Risk: <span className="capitalize">{result.overallRisk}</span>
                </CardTitle>
              </div>
              <span className={`text-2xl font-bold ${scoreColor}`}>{result.safetyScore}/100</span>
            </div>
            <Progress value={result.safetyScore} className="h-2 mt-2" />
          </CardHeader>
          <CardContent>
            {result.issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No issues found — this prompt looks safe! ✅</p>
            ) : (
              <div className="space-y-3">
                {result.issues.map((issue, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={severityColor[issue.severity] || ""}>
                        {issue.severity}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">
                        {typeLabels[issue.type] || issue.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                    <p className="text-sm text-foreground">💡 {issue.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PromptSafetyAnalysis;
