import { useState, useRef } from "react";
import PromptImprover from "@/components/PromptImprover";
import TemplateLibrary from "@/components/TemplateLibrary";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, BarChart3 } from "lucide-react";
import { trackTemplateUsage, useAnalytics } from "@/hooks/useAnalytics";
import { useMilestoneNotifications } from "@/hooks/useMilestoneNotifications";

const Index = () => {
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("improver");
  const improverRef = useRef<HTMLDivElement>(null);
  const { data: analytics } = useAnalytics();
  useMilestoneNotifications(analytics);

  const handleSelectTemplate = async (prompt: string, templateId: string, category: string) => {
    setSelectedPrompt(prompt);
    
    // Track template usage
    await trackTemplateUsage(templateId, category);
    
    // Switch to improver tab and scroll
    setActiveTab("improver");
    setTimeout(() => {
      improverRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-brand-50/50 py-12">
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="improver" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Prompt Improver
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="improver" className="mt-8">
            <TemplateLibrary onSelectTemplate={handleSelectTemplate} />
            
            <div className="max-w-6xl mx-auto px-6 my-12">
              <Separator />
            </div>
            
            <div ref={improverRef}>
              <PromptImprover initialPrompt={selectedPrompt} />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-8">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;