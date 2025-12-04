import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, BarChart3, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface QualityAnalysis {
  score: number;
  clarity: number;
  specificity: number;
  effectiveness: number;
  feedback: string;
}

interface PromptQualityScoreProps {
  prompt: string;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
};

const ScoreBar = ({ label, score }: { label: string; score: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${getScoreColor(score)}`}>{score}%</span>
    </div>
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-500 ${getProgressColor(score)}`}
        style={{ width: `${score}%` }}
      />
    </div>
  </div>
);

const PromptQualityScore = ({ prompt }: PromptQualityScoreProps) => {
  const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const analyzePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Enter a prompt first",
        description: "Please enter a prompt to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-prompt', {
        body: { prompt: prompt.trim() }
      });

      if (error) {
        console.error('Analysis error:', error);
        throw new Error(error.message || 'Analysis failed');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing prompt:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-medium">Quality Score</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={analyzePrompt}
                disabled={isLoading || !prompt.trim()}
                className="h-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>AI-powered analysis of prompt quality</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {analysis && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4 animate-in fade-in-50 slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
              {analysis.score}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </span>
          </div>
          
          <div className="space-y-3">
            <ScoreBar label="Clarity" score={analysis.clarity} />
            <ScoreBar label="Specificity" score={analysis.specificity} />
            <ScoreBar label="Effectiveness" score={analysis.effectiveness} />
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{analysis.feedback}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptQualityScore;
