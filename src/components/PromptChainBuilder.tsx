import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Link2, Lightbulb, Save, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ChainStep {
  id: string;
  prompt_text: string;
  output_text: string | null;
  step_order: number;
}

interface Chain {
  id: string;
  title: string;
  steps: ChainStep[];
}

interface Suggestion {
  title: string;
  promptTemplate: string;
  explanation: string;
}

const PromptChainBuilder = () => {
  const [chains, setChains] = useState<Chain[]>([]);
  const [activeChainId, setActiveChainId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showChainList, setShowChainList] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const activeChain = chains.find((c) => c.id === activeChainId);

  useEffect(() => {
    if (user) loadChains();
  }, [user]);

  const loadChains = async () => {
    const { data: chainsData } = await supabase
      .from("prompt_chains")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!chainsData) return;

    const chainIds = chainsData.map((c) => c.id);
    const { data: stepsData } = await supabase
      .from("prompt_chain_steps")
      .select("*")
      .in("chain_id", chainIds)
      .order("step_order", { ascending: true });

    const mapped = chainsData.map((c) => ({
      id: c.id,
      title: c.title,
      steps: (stepsData || []).filter((s) => s.chain_id === c.id),
    }));

    setChains(mapped);
    if (!activeChainId && mapped.length > 0) setActiveChainId(mapped[0].id);
  };

  const createChain = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("prompt_chains")
      .insert({ user_id: user.id, title: "New Chain" })
      .select()
      .single();

    if (error || !data) {
      toast({ title: "Error", description: "Failed to create chain", variant: "destructive" });
      return;
    }

    const newChain: Chain = { id: data.id, title: data.title, steps: [] };
    setChains((prev) => [newChain, ...prev]);
    setActiveChainId(data.id);
    setSuggestions([]);
  };

  const addStep = async (promptText = "") => {
    if (!activeChain) return;
    const order = activeChain.steps.length + 1;
    const { data, error } = await supabase
      .from("prompt_chain_steps")
      .insert({ chain_id: activeChain.id, prompt_text: promptText, step_order: order })
      .select()
      .single();

    if (error || !data) return;
    setChains((prev) =>
      prev.map((c) => (c.id === activeChain.id ? { ...c, steps: [...c.steps, data] } : c))
    );
  };

  const updateStep = async (stepId: string, text: string) => {
    await supabase.from("prompt_chain_steps").update({ prompt_text: text }).eq("id", stepId);
    setChains((prev) =>
      prev.map((c) => ({
        ...c,
        steps: c.steps.map((s) => (s.id === stepId ? { ...s, prompt_text: text } : s)),
      }))
    );
  };

  const deleteStep = async (stepId: string) => {
    await supabase.from("prompt_chain_steps").delete().eq("id", stepId);
    setChains((prev) =>
      prev.map((c) => ({
        ...c,
        steps: c.steps.filter((s) => s.id !== stepId),
      }))
    );
  };

  const updateTitle = async (title: string) => {
    if (!activeChain) return;
    await supabase.from("prompt_chains").update({ title }).eq("id", activeChain.id);
    setChains((prev) => prev.map((c) => (c.id === activeChain.id ? { ...c, title } : c)));
  };

  const deleteChain = async (chainId: string) => {
    await supabase.from("prompt_chain_steps").delete().eq("chain_id", chainId);
    await supabase.from("prompt_chains").delete().eq("id", chainId);
    setChains((prev) => prev.filter((c) => c.id !== chainId));
    if (activeChainId === chainId) setActiveChainId(chains.find((c) => c.id !== chainId)?.id || null);
  };

  const suggestNextSteps = async () => {
    if (!activeChain || activeChain.steps.length === 0) {
      toast({ title: "Add a step first", variant: "destructive" });
      return;
    }
    setIsSuggesting(true);
    try {
      const lastStep = activeChain.steps[activeChain.steps.length - 1];
      const { data, error } = await supabase.functions.invoke("suggest-chain", {
        body: { prompt: lastStep.prompt_text, existingSteps: activeChain.steps },
      });
      if (error) throw error;
      setSuggestions(data.suggestedNextSteps ?? []);
    } catch (e: any) {
      toast({ title: "Suggestion failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const applySuggestion = (s: Suggestion) => {
    addStep(s.promptTemplate);
    setSuggestions((prev) => prev.filter((x) => x !== s));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Prompt Chain Builder
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowChainList(!showChainList)}>
              <ChevronDown className="h-4 w-4 mr-1" />
              Chains ({chains.length})
            </Button>
            <Button size="sm" onClick={createChain}>
              <Plus className="h-4 w-4 mr-1" />
              New Chain
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showChainList && chains.length > 0 && (
          <div className="border border-border rounded-lg p-2 space-y-1">
            {chains.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted/50 ${c.id === activeChainId ? "bg-muted" : ""}`}
                onClick={() => { setActiveChainId(c.id); setShowChainList(false); setSuggestions([]); }}
              >
                <span className="text-sm text-foreground">{c.title} <span className="text-muted-foreground">({c.steps.length} steps)</span></span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); deleteChain(c.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeChain ? (
          <>
            <Input
              value={activeChain.title}
              onChange={(e) => updateTitle(e.target.value)}
              className="font-medium"
              placeholder="Chain title"
            />

            <div className="space-y-3">
              {activeChain.steps.map((step, i) => (
                <div key={step.id} className="relative">
                  {i > 0 && (
                    <div className="flex justify-center -mt-1 -mb-1">
                      <div className="w-px h-4 bg-border" />
                    </div>
                  )}
                  <div className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Step {i + 1}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteStep(step.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      value={step.prompt_text}
                      onChange={(e) => updateStep(step.id, e.target.value)}
                      placeholder={i === 0 ? "Enter your initial prompt..." : "Use {{previous_output}} to reference the previous step's output"}
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => addStep()}>
                <Plus className="h-4 w-4 mr-1" />
                Add Step
              </Button>
              <Button variant="outline" size="sm" onClick={suggestNextSteps} disabled={isSuggesting || activeChain.steps.length === 0}>
                {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Lightbulb className="h-4 w-4 mr-1" />}
                Suggest Next
              </Button>
            </div>

            {suggestions.length > 0 && (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-sm font-medium text-muted-foreground">Suggested next steps:</p>
                {suggestions.map((s, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 space-y-1 hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{s.title}</span>
                      <Button size="sm" variant="outline" onClick={() => applySuggestion(s)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.explanation}</p>
                    <p className="text-xs text-foreground font-mono bg-muted rounded p-1">{s.promptTemplate}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Create a new chain to get started with multi-step prompt workflows.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PromptChainBuilder;
