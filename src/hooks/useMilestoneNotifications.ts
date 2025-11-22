import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { AnalyticsSummary } from "./useAnalytics";

const MILESTONE_THRESHOLDS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
const STORAGE_KEY = "analytics-milestones-shown";

interface MilestoneState {
  totalPrompts: number;
  totalTemplateUses: number;
  uniqueModels: number;
  uniqueCategories: number;
}

const formatBulletPoints = (achievements: string[]): string => {
  return achievements.map(achievement => `• ${achievement}`).join('\n');
};

const getMilestoneDescription = (
  threshold: number,
  analytics: AnalyticsSummary,
  type: 'prompts' | 'templates'
): string => {
  const achievements: string[] = [];
  
  if (type === 'prompts') {
    achievements.push(`${threshold} prompts improved`);
    
    if (analytics.modelUsage.length > 0) {
      const topModel = analytics.modelUsage[0];
      achievements.push(`Most used model: ${topModel.model.toUpperCase()} (${topModel.count} times)`);
    }
    
    if (analytics.recentActivity.length > 0) {
      const recentCount = analytics.recentActivity.reduce((sum, day) => sum + day.count, 0);
      achievements.push(`${recentCount} prompts in the last 7 days`);
    }
  } else {
    achievements.push(`${threshold} templates used`);
    
    if (analytics.categoryUsage.length > 0) {
      const topCategory = analytics.categoryUsage[0];
      achievements.push(`Top category: ${topCategory.category} (${topCategory.count} uses)`);
    }
    
    if (analytics.popularTemplates.length > 0) {
      achievements.push(`${analytics.popularTemplates.length} different templates explored`);
    }
  }
  
  return formatBulletPoints(achievements);
};

export const useMilestoneNotifications = (analytics: AnalyticsSummary | undefined) => {
  const { toast } = useToast();
  const previousStateRef = useRef<MilestoneState>({
    totalPrompts: 0,
    totalTemplateUses: 0,
    uniqueModels: 0,
    uniqueCategories: 0,
  });

  useEffect(() => {
    if (!analytics) return;

    const { totalPrompts, totalTemplateUses, modelUsage, categoryUsage } = analytics;
    const previousState = previousStateRef.current;
    
    // Get or initialize shown milestones
    let shownMilestones: Record<string, boolean>;
    try {
      shownMilestones = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      shownMilestones = {};
    }

    // Check prompt milestones
    MILESTONE_THRESHOLDS.forEach((threshold) => {
      const milestoneKey = `prompts-${threshold}`;
      if (
        totalPrompts >= threshold &&
        !shownMilestones[milestoneKey] &&
        previousState.totalPrompts < threshold
      ) {
        const description = getMilestoneDescription(threshold, analytics, 'prompts');
        
        toast({
          title: "🎉 Prompt Milestone Achieved!",
          description: description,
          duration: 7000,
        });
        
        shownMilestones[milestoneKey] = true;
      }
    });

    // Check template usage milestones
    MILESTONE_THRESHOLDS.forEach((threshold) => {
      const milestoneKey = `templates-${threshold}`;
      if (
        totalTemplateUses >= threshold &&
        !shownMilestones[milestoneKey] &&
        previousState.totalTemplateUses < threshold
      ) {
        const description = getMilestoneDescription(threshold, analytics, 'templates');
        
        toast({
          title: "🎯 Template Milestone Achieved!",
          description: description,
          duration: 7000,
        });
        
        shownMilestones[milestoneKey] = true;
      }
    });

    // Check for first model diversity milestone (used 3+ different models)
    if (modelUsage.length >= 3 && previousState.uniqueModels < 3 && !shownMilestones['model-diversity']) {
      toast({
        title: "🌟 Model Explorer!",
        description: formatBulletPoints([
          `Tried ${modelUsage.length} different AI models`,
          'Exploring different models helps find the best fit',
          'Keep experimenting!'
        ]),
        duration: 7000,
      });
      shownMilestones['model-diversity'] = true;
    }

    // Check for category explorer milestone (used 5+ different categories)
    if (categoryUsage.length >= 5 && previousState.uniqueCategories < 5 && !shownMilestones['category-explorer']) {
      toast({
        title: "🗂️ Category Master!",
        description: formatBulletPoints([
          `Explored ${categoryUsage.length} different template categories`,
          'Broad exploration leads to better prompt engineering',
          'You\'re becoming a prompt expert!'
        ]),
        duration: 7000,
      });
      shownMilestones['category-explorer'] = true;
    }

    // Save updated milestones
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shownMilestones));
    } catch (error) {
      console.error('Failed to save milestone state:', error);
    }

    // Update previous state
    previousStateRef.current = {
      totalPrompts,
      totalTemplateUses,
      uniqueModels: modelUsage.length,
      uniqueCategories: categoryUsage.length,
    };
  }, [analytics, toast]);
};
