import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, GitCompare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Variant {
  label: string;
  improvedPrompt: string;
  tradeoffs: string;
}

interface PromptABComparisonProps {
  prompt: string;
  enhancements?: string[];
}

const PromptABComparison = ({ prompt, enhancements }: PromptABComparisonProps) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const generateVariants = async () => {
    if (!prompt.trim()) {
      toast({ title: "No prompt", description: "Enter a prompt first", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ab-compare-prompt", {
        body: { prompt: prompt.trim(), enhancements },
      });
      if (error) throw error;
      setVariants(data.variants ?? []);
    } catch (e: any) {
      toast({ title: "Comparison failed", description: e.message || "Try again later", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyVariant = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: "Copied!", description: "Variant copied to clipboard" });
  };

  const labelColors: Record<string, string> = {
    Clarity: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    Detail: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
    Creativity: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          A/B Comparison
        </h3>
        <Button onClick={generateVariants} disabled={isLoading || !prompt.trim()} size="sm">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isLoading ? "Generating..." : "Compare Variants"}
        </Button>
      </div>

      {variants.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {variants.map((v, i) => (
            <Card key={i} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={labelColors[v.label] || ""}>
                    {v.label}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyVariant(v.improvedPrompt, i)}>
                    {copiedIndex === i ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{v.improvedPrompt}</p>
                <p className="text-xs text-muted-foreground italic border-t border-border pt-2">{v.tradeoffs}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromptABComparison;
