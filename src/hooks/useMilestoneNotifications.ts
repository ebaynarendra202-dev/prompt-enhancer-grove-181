import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { AnalyticsSummary } from "./useAnalytics";
import { Sparkles, Award, TrendingUp } from "lucide-react";

const MILESTONE_THRESHOLDS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
const STORAGE_KEY = "analytics-milestones-shown";

export const useMilestoneNotifications = (analytics: AnalyticsSummary | undefined) => {
  const { toast } = useToast();
  const previousCountRef = useRef<number>(0);

  useEffect(() => {
    if (!analytics) return;

    const { totalPrompts, totalTemplateUses } = analytics;
    const shownMilestones = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    // Check prompt milestones
    MILESTONE_THRESHOLDS.forEach((threshold) => {
      const milestoneKey = `prompts-${threshold}`;
      if (
        totalPrompts >= threshold &&
        !shownMilestones[milestoneKey] &&
        previousCountRef.current < threshold
      ) {
        toast({
          title: "🎉 Milestone Reached!",
          description: `You've improved ${threshold} prompts! Keep up the great work!`,
          duration: 5000,
        });
        shownMilestones[milestoneKey] = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shownMilestones));
      }
    });

    // Check template usage milestones
    MILESTONE_THRESHOLDS.forEach((threshold) => {
      const milestoneKey = `templates-${threshold}`;
      if (
        totalTemplateUses >= threshold &&
        !shownMilestones[milestoneKey]
      ) {
        toast({
          title: "🎯 Template Milestone!",
          description: `${threshold} templates used! You're mastering the library!`,
          duration: 5000,
        });
        shownMilestones[milestoneKey] = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shownMilestones));
      }
    });

    previousCountRef.current = totalPrompts;
  }, [analytics, toast]);
};
