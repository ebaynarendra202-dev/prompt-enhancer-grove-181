import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StructuredPrompt {
  role: string;
  task: string;
  context: string;
  format: string;
  constraints: string;
  fullPrompt: string;
}

interface NaturalLanguageInputProps {
  onUsePrompt?: (prompt: string) => void;
}

const NaturalLanguageInput = ({ onUsePrompt }: NaturalLanguageInputProps) => {
  const [input, setInput] = useState("");
  const [structured, setStructured] = useState<StructuredPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const structurePrompt = async () => {
    if (!input.trim()) {
      toast({ title: "Enter a description", description: "Tell us what you want in plain language", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("structure-prompt", {
        body: { description: input.trim() },
      });
      if (error) throw error;
      
      // The edge function returns { structuredPrompt: string } with labeled sections
      const text = data.structuredPrompt || "";
      const parseSection = (label: string) => {
        const regex = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+?)(?=\\n\\*\\*|$)`, 's');
        const match = text.match(regex);
        return match ? match[1].trim() : "";
      };
      
      setStructured({
        role: parseSection("Role"),
        task: parseSection("Task"),
        context: parseSection("Context"),
        format: parseSection("Format"),
        constraints: parseSection("Constraints"),
        fullPrompt: text,
      });
    } catch (e: any) {
      toast({ title: "Structuring failed", description: e.message || "Try again later", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPrompt = async () => {
    if (!structured) return;
    await navigator.clipboard.writeText(structured.fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Structured prompt copied" });
  };

  const sections = structured
    ? [
        { label: "Role", value: structured.role, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
        { label: "Task", value: structured.task, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
        { label: "Context", value: structured.context, color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300" },
        { label: "Format", value: structured.format, color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
        { label: "Constraints", value: structured.constraints, color: "bg-red-500/10 text-red-700 dark:text-red-300" },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wand2 className="h-5 w-5" />
          Natural Language → Structured Prompt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Describe what you want in plain language, e.g. 'I need help writing a blog post about sustainable energy for a tech audience'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[80px]"
        />
        <Button onClick={structurePrompt} disabled={isLoading || !input.trim()} className="w-full">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
          {isLoading ? "Structuring..." : "Convert to Structured Prompt"}
        </Button>

        {structured && (
          <div className="space-y-3 pt-2">
            {sections.map((s) => (
              <div key={s.label} className="space-y-1">
                <Badge variant="outline" className={s.color}>{s.label}</Badge>
                <p className="text-sm text-foreground pl-1">{s.value}</p>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={copyPrompt}>
                {copied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy
              </Button>
              {onUsePrompt && (
                <Button size="sm" onClick={() => onUsePrompt(structured.fullPrompt)}>
                  Use This Prompt
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NaturalLanguageInput;
