import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Copy, Wand2, Info, History, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PromptImproverProps {
  initialPrompt?: string;
}

interface Enhancement {
  id: string;
  label: string;
  text: string;
  description: string;
}

interface PromptHistory {
  id: string;
  originalPrompt: string;
  improvedPrompt: string;
  model: string;
  timestamp: number;
}

const availableEnhancements: Enhancement[] = [
  { 
    id: "quality", 
    label: "High Quality Output", 
    text: "• High quality output with professional standards",
    description: "Ensures the response meets professional standards with accurate, reliable, and well-researched information suitable for professional use."
  },
  { 
    id: "format", 
    label: "Clear Structure", 
    text: "• Clear, well-structured format for easy understanding",
    description: "Organizes information in a logical, hierarchical way with clear headings, sections, and flow that makes content easy to scan and understand."
  },
  { 
    id: "style", 
    label: "Professional Style", 
    text: "• Professional and engaging writing style",
    description: "Uses appropriate tone and language that is both professional and engaging, avoiding jargon when possible while maintaining credibility."
  },
  { 
    id: "examples", 
    label: "Include Examples", 
    text: "• Relevant examples and context where appropriate",
    description: "Provides concrete, real-world examples and contextual information to illustrate concepts and make abstract ideas more tangible and relatable."
  },
  { 
    id: "detail", 
    label: "Attention to Detail", 
    text: "• Attention to detail and accuracy",
    description: "Ensures precision in facts, figures, and explanations, double-checking information and avoiding generalizations or oversimplifications."
  },
  { 
    id: "actionable", 
    label: "Actionable Information", 
    text: "• Actionable and practical information",
    description: "Focuses on providing practical steps, clear recommendations, and implementable solutions rather than just theoretical knowledge."
  },
];

const PromptImprover = ({ initialPrompt = "" }: PromptImproverProps) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [improvedPrompt, setImprovedPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>(
    availableEnhancements.map(e => e.id)
  );
  const [showComparison, setShowComparison] = useState(false);
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const { toast } = useToast();

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("promptHistory");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  }, []);

  // Update prompt when initialPrompt changes
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      setImprovedPrompt(""); // Clear previous improved prompt
    }
  }, [initialPrompt]);

  const toggleEnhancement = (enhancementId: string) => {
    setSelectedEnhancements(prev => 
      prev.includes(enhancementId)
        ? prev.filter(id => id !== enhancementId)
        : [...prev, enhancementId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEnhancements.length === availableEnhancements.length) {
      setSelectedEnhancements([]);
    } else {
      setSelectedEnhancements(availableEnhancements.map(e => e.id));
    }
  };

  const improvePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "The prompt field cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate AI improvement
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const originalPrompt = prompt.trim();
      
      // Build structured improvement with bullet points
      const modelPrefix = selectedModel.includes('claude') ? 'Using advanced reasoning' :
                         selectedModel.includes('gpt-4') ? 'With high-level analysis' :
                         selectedModel.includes('gemini') ? 'Through comprehensive understanding' :
                         'Using AI assistance';
      
      const baseTask = originalPrompt.charAt(0).toLowerCase() + originalPrompt.slice(1);
      
      // Get selected enhancement bullet points
      const selectedBullets = availableEnhancements
        .filter(e => selectedEnhancements.includes(e.id))
        .map(e => e.text);
      
      // Create a structured prompt with main instruction and selected bullet points
      const structuredPrompt = selectedBullets.length > 0
        ? [
            `${modelPrefix}, ${baseTask.replace(/\.$/, '')}, ensuring:`,
            '',
            ...selectedBullets
          ].join('\n')
        : `${modelPrefix}, ${baseTask.replace(/\.$/, '')}.`;
      
      setImprovedPrompt(structuredPrompt);
      
      // Add to history
      const newHistoryItem: PromptHistory = {
        id: Date.now().toString(),
        originalPrompt: originalPrompt,
        improvedPrompt: structuredPrompt,
        model: selectedModel,
        timestamp: Date.now(),
      };
      
      const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      
      // Save to localStorage
      try {
        localStorage.setItem("promptHistory", JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Failed to save history:", error);
      }
      
      // Track the improvement in analytics
      const { trackPromptImprovement } = await import("@/hooks/useAnalytics");
      await trackPromptImprovement(originalPrompt, structuredPrompt, selectedModel);
      
      toast({
        title: "Prompt improved!",
        description: `Enhanced with structured bullet points using ${selectedModel.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Error improving prompt",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (historyItem: PromptHistory) => {
    setPrompt(historyItem.originalPrompt);
    setImprovedPrompt(historyItem.improvedPrompt);
    setSelectedModel(historyItem.model);
    setShowComparison(false);
    
    toast({
      title: "History loaded",
      description: "Previous prompt has been restored",
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("promptHistory");
    
    toast({
      title: "History cleared",
      description: "All prompt history has been deleted",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(improvedPrompt);
      toast({
        title: "Copied to clipboard!",
        description: "You can now paste the improved prompt anywhere",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
            AI Prompt Improver
          </h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                History {history.length > 0 && `(${history.length})`}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Prompt History</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {history.length > 0 ? (
                  <>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearHistory}
                        className="text-destructive hover:text-destructive"
                      >
                        Clear All
                      </Button>
                    </div>
                    <ScrollArea className="h-[calc(100vh-200px)]">
                      <div className="space-y-4 pr-4">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className="border border-border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => loadFromHistory(item)}
                          >
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="font-medium uppercase">{item.model}</span>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  Original:
                                </div>
                                <p className="text-sm line-clamp-2">{item.originalPrompt}</p>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-brand-600 mb-1">
                                  Improved:
                                </div>
                                <p className="text-sm line-clamp-3 text-muted-foreground">
                                  {item.improvedPrompt}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No history yet</p>
                    <p className="text-sm">Improved prompts will appear here</p>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <p className="text-muted-foreground">
          Enter your prompt below and let AI help you make it better
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">AI Model</label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger>
              <SelectValue placeholder="Select an AI model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">GPT-4 (OpenAI)</SelectItem>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</SelectItem>
              <SelectItem value="claude-3-opus">Claude 3 Opus (Anthropic)</SelectItem>
              <SelectItem value="claude-3-sonnet">Claude 3 Sonnet (Anthropic)</SelectItem>
              <SelectItem value="claude-3-haiku">Claude 3 Haiku (Anthropic)</SelectItem>
              <SelectItem value="gemini-pro">Gemini Pro (Google)</SelectItem>
              <SelectItem value="llama-2">Llama 2 (Meta)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Your Prompt</label>
          <Textarea
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enhancement Options</label>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="h-8"
            >
              {selectedEnhancements.length === availableEnhancements.length 
                ? "Deselect All" 
                : "Select All"}
            </Button>
          </div>
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-lg border border-border bg-muted/30">
              {availableEnhancements.map((enhancement) => (
                <div key={enhancement.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={enhancement.id}
                    checked={selectedEnhancements.includes(enhancement.id)}
                    onCheckedChange={() => toggleEnhancement(enhancement.id)}
                  />
                  <Label
                    htmlFor={enhancement.id}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {enhancement.label}
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">{enhancement.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>

        <Button
          onClick={improvePrompt}
          className="w-full bg-brand-600 hover:bg-brand-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Improving...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Improve Prompt
            </>
          )}
        </Button>

        {improvedPrompt && (
          <div className="space-y-2 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {showComparison ? "Comparison View" : "Improved Version"}
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                  className="h-8"
                >
                  {showComparison ? "Hide Original" : "Compare"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-8"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
            
            {showComparison ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Original Prompt
                  </div>
                  <div className="relative rounded-lg border border-border bg-muted/30 p-4 h-full">
                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {prompt}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-brand-600 uppercase tracking-wide">
                    Improved Version
                  </div>
                  <div className="relative rounded-lg border border-brand-200 bg-gradient-to-r from-brand-50/50 to-brand-100/50 p-4 h-full">
                    <div className="text-sm text-foreground whitespace-pre-wrap font-medium leading-relaxed">
                      {improvedPrompt}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg border border-brand-200 bg-gradient-to-r from-brand-50/50 to-brand-100/50 p-4">
                <div className="text-sm text-foreground whitespace-pre-wrap font-medium leading-relaxed">
                  {improvedPrompt}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptImprover;