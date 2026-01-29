import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Lightbulb, 
  AlertCircle, 
  Target, 
  FileText, 
  Settings2, 
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface CoachingTip {
  type: "clarity" | "specificity" | "context" | "structure" | "constraint" | "example";
  issue: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

interface PromptCoachProps {
  prompt: string;
}

const typeConfig = {
  clarity: {
    icon: AlertCircle,
    label: "Clarity",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  specificity: {
    icon: Target,
    label: "Specificity",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  context: {
    icon: FileText,
    label: "Context",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  structure: {
    icon: Settings2,
    label: "Structure",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  constraint: {
    icon: Settings2,
    label: "Constraint",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  example: {
    icon: BookOpen,
    label: "Example",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
  },
};

const priorityColors = {
  high: "border-destructive/50 bg-destructive/5",
  medium: "border-yellow-500/50 bg-yellow-500/5",
  low: "border-muted-foreground/30 bg-muted/30",
};

const PromptCoach = ({ prompt }: PromptCoachProps) => {
  const [tips, setTips] = useState<CoachingTip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [lastAnalyzedPrompt, setLastAnalyzedPrompt] = useState("");

  const analyzePrompt = useCallback(async (text: string) => {
    if (text.trim().length < 15) {
      setTips([]);
      return;
    }

    // Don't re-analyze if prompt hasn't changed significantly
    if (text.trim() === lastAnalyzedPrompt.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('coach-prompt', {
        body: { prompt: text.trim() }
      });

      if (error) {
        console.error('Coaching error:', error);
        return;
      }

      if (data?.tips) {
        setTips(data.tips);
        setLastAnalyzedPrompt(text);
      }
    } catch (error) {
      console.error('Error getting coaching tips:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lastAnalyzedPrompt]);

  // Debounced analysis
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      analyzePrompt(prompt);
    }, 1500); // 1.5s debounce for real-time feel

    return () => clearTimeout(timeoutId);
  }, [prompt, analyzePrompt]);

  // Don't render if prompt is too short
  if (prompt.trim().length < 15 && tips.length === 0) {
    return null;
  }

  const highPriorityCount = tips.filter(t => t.priority === 'high').length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Prompt Coach</span>
              {isLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
              {!isLoading && tips.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {tips.length} tip{tips.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {highPriorityCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {highPriorityCount} important
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {tips.length === 0 && !isLoading && prompt.trim().length >= 15 && (
              <p className="text-sm text-muted-foreground py-2">
                Your prompt looks good! Keep typing for more suggestions.
              </p>
            )}
            
            {tips.map((tip, index) => {
              const config = typeConfig[tip.type];
              const Icon = config.icon;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-md border p-3 transition-all animate-in fade-in-50 slide-in-from-top-2",
                    priorityColors[tip.priority]
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-1.5 rounded-md", config.bgColor)}>
                      <Icon className={cn("h-3.5 w-3.5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs font-medium", config.color)}>
                          {config.label}
                        </span>
                        {tip.priority === 'high' && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Important
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground mb-0.5">
                        {tip.issue}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tip.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default PromptCoach;
