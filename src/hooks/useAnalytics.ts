import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsSummary {
  totalPrompts: number;
  totalTemplateUses: number;
  modelUsage: { model: string; count: number }[];
  categoryUsage: { category: string; count: number }[];
  popularTemplates: { template_id: string; count: number }[];
  recentActivity: { date: string; count: number }[];
  coachingTipStats: {
    totalApplied: number;
    totalIgnored: number;
    byType: { type: string; applied: number; ignored: number }[];
    byPriority: { priority: string; applied: number; ignored: number }[];
  };
}

export const useAnalytics = () => {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async (): Promise<AnalyticsSummary> => {
      // Get total prompts improved
      const { count: totalPrompts } = await supabase
        .from("prompt_improvements")
        .select("*", { count: "exact", head: true });

      // Get total template uses
      const { count: totalTemplateUses } = await supabase
        .from("template_usage")
        .select("*", { count: "exact", head: true });

      // Get model usage distribution
      const { data: modelData } = await supabase
        .from("prompt_improvements")
        .select("ai_model");

      const modelUsage = Object.entries(
        (modelData || []).reduce((acc, { ai_model }) => {
          acc[ai_model] = (acc[ai_model] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => b.count - a.count);

      // Get category usage distribution
      const { data: categoryData } = await supabase
        .from("template_usage")
        .select("template_category");

      const categoryUsage = Object.entries(
        (categoryData || []).reduce((acc, { template_category }) => {
          acc[template_category] = (acc[template_category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // Get popular templates
      const { data: templateData } = await supabase
        .from("template_usage")
        .select("template_id");

      const popularTemplates = Object.entries(
        (templateData || []).reduce((acc, { template_id }) => {
          acc[template_id] = (acc[template_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
        .map(([template_id, count]) => ({ template_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentData } = await supabase
        .from("prompt_improvements")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString());

      const recentActivity = Object.entries(
        (recentData || []).reduce((acc, { created_at }) => {
          const date = new Date(created_at).toLocaleDateString();
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Get coaching tip interaction stats
      const { data: tipData } = await supabase
        .from("coaching_tip_interactions")
        .select("tip_type, tip_priority, action");

      const tipInteractions = tipData || [];
      
      const appliedActions = ['applied', 'applied_all'];
      const totalApplied = tipInteractions.filter(t => appliedActions.includes(t.action)).length;
      const totalIgnored = tipInteractions.filter(t => t.action === 'ignored').length;

      // Group by type
      const typeStats = tipInteractions.reduce((acc, { tip_type, action }) => {
        if (!acc[tip_type]) acc[tip_type] = { applied: 0, ignored: 0 };
        if (appliedActions.includes(action)) {
          acc[tip_type].applied++;
        } else if (action === 'ignored') {
          acc[tip_type].ignored++;
        }
        return acc;
      }, {} as Record<string, { applied: number; ignored: number }>);

      const byType = Object.entries(typeStats)
        .map(([type, stats]) => ({ type, ...stats }))
        .sort((a, b) => (b.applied + b.ignored) - (a.applied + a.ignored));

      // Group by priority
      const priorityStats = tipInteractions.reduce((acc, { tip_priority, action }) => {
        if (!acc[tip_priority]) acc[tip_priority] = { applied: 0, ignored: 0 };
        if (appliedActions.includes(action)) {
          acc[tip_priority].applied++;
        } else if (action === 'ignored') {
          acc[tip_priority].ignored++;
        }
        return acc;
      }, {} as Record<string, { applied: number; ignored: number }>);

      const byPriority = Object.entries(priorityStats)
        .map(([priority, stats]) => ({ priority, ...stats }))
        .sort((a, b) => {
          const order = { high: 0, medium: 1, low: 2 };
          return (order[a.priority as keyof typeof order] || 3) - (order[b.priority as keyof typeof order] || 3);
        });

      return {
        totalPrompts: totalPrompts || 0,
        totalTemplateUses: totalTemplateUses || 0,
        modelUsage,
        categoryUsage,
        popularTemplates,
        recentActivity,
        coachingTipStats: {
          totalApplied,
          totalIgnored,
          byType,
          byPriority,
        },
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const trackTemplateUsage = async (templateId: string, category: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from("template_usage").insert({
    template_id: templateId,
    template_category: category,
    user_id: user?.id || null,
  });
};

export const trackPromptImprovement = async (
  originalPrompt: string,
  improvedPrompt: string,
  aiModel: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from("prompt_improvements").insert({
    original_prompt: originalPrompt,
    improved_prompt: improvedPrompt,
    ai_model: aiModel,
    user_id: user?.id || null,
  });
};
