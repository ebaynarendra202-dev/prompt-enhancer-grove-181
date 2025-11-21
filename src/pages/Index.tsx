import { useState, useRef } from "react";
import PromptImprover from "@/components/PromptImprover";
import TemplateLibrary from "@/components/TemplateLibrary";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const improverRef = useRef<HTMLDivElement>(null);

  const handleSelectTemplate = (prompt: string) => {
    setSelectedPrompt(prompt);
    // Scroll to the improver section
    setTimeout(() => {
      improverRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-brand-50/50 py-12">
      <TemplateLibrary onSelectTemplate={handleSelectTemplate} />
      
      <div className="max-w-6xl mx-auto px-6 my-12">
        <Separator />
      </div>
      
      <div ref={improverRef}>
        <PromptImprover initialPrompt={selectedPrompt} />
      </div>
    </div>
  );
};

export default Index;