import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, startOfMonth, format, subDays, subWeeks, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";

export type Granularity = "daily" | "weekly" | "monthly";
export type DateRange = "7d" | "30d" | "90d" | "6m" | "1y";

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface ModelTrendDataPoint {
  date: string;
  [model: string]: string | number;
}

export interface CategoryTrendDataPoint {
  date: string;
  [category: string]: string | number;
}

export interface TemplateTrendDataPoint {
  date: string;
  [templateId: string]: string | number;
}

export interface AnalyticsTrends {
  promptTrends: TrendDataPoint[];
  modelTrends: ModelTrendDataPoint[];
  categoryTrends: CategoryTrendDataPoint[];
  templateTrends: TemplateTrendDataPoint[];
  allModels: string[];
  allCategories: string[];
  allTemplates: string[];
}

const getDateRangeStart = (range: DateRange): Date => {
  const now = new Date();
  switch (range) {
    case "7d": return subDays(now, 7);
    case "30d": return subDays(now, 30);
    case "90d": return subDays(now, 90);
    case "6m": return subMonths(now, 6);
    case "1y": return subMonths(now, 12);
    default: return subDays(now, 30);
  }
};

const formatDateByGranularity = (date: Date, granularity: Granularity): string => {
  switch (granularity) {
    case "daily": return format(date, "yyyy-MM-dd");
    case "weekly": return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
    case "monthly": return format(startOfMonth(date), "yyyy-MM");
    default: return format(date, "yyyy-MM-dd");
  }
};

const generateDateBuckets = (startDate: Date, endDate: Date, granularity: Granularity): string[] => {
  switch (granularity) {
    case "daily":
      return eachDayOfInterval({ start: startDate, end: endDate }).map(d => format(d, "yyyy-MM-dd"));
    case "weekly":
      return eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 }).map(d => format(d, "yyyy-MM-dd"));
    case "monthly":
      return eachMonthOfInterval({ start: startDate, end: endDate }).map(d => format(d, "yyyy-MM"));
    default:
      return [];
  }
};

export const useAnalyticsTrends = (dateRange: DateRange, granularity: Granularity) => {
  return useQuery({
    queryKey: ["analytics-trends", dateRange, granularity],
    queryFn: async (): Promise<AnalyticsTrends> => {
      const startDate = getDateRangeStart(dateRange);
      const endDate = new Date();
      const dateBuckets = generateDateBuckets(startDate, endDate, granularity);

      // Fetch prompt improvements with timestamps
      const { data: promptData } = await supabase
        .from("prompt_improvements")
        .select("created_at, ai_model")
        .gte("created_at", startDate.toISOString());

      // Fetch template usage with timestamps
      const { data: templateData } = await supabase
        .from("template_usage")
        .select("created_at, template_id, template_category")
        .gte("created_at", startDate.toISOString());

      // Process prompt trends
      const promptCounts: Record<string, number> = {};
      const modelCounts: Record<string, Record<string, number>> = {};
      const allModelsSet = new Set<string>();

      (promptData || []).forEach(({ created_at, ai_model }) => {
        const bucket = formatDateByGranularity(new Date(created_at), granularity);
        promptCounts[bucket] = (promptCounts[bucket] || 0) + 1;
        
        if (!modelCounts[bucket]) modelCounts[bucket] = {};
        modelCounts[bucket][ai_model] = (modelCounts[bucket][ai_model] || 0) + 1;
        allModelsSet.add(ai_model);
      });

      // Process template and category trends
      const categoryCounts: Record<string, Record<string, number>> = {};
      const templateCounts: Record<string, Record<string, number>> = {};
      const allCategoriesSet = new Set<string>();
      const allTemplatesSet = new Set<string>();

      (templateData || []).forEach(({ created_at, template_id, template_category }) => {
        const bucket = formatDateByGranularity(new Date(created_at), granularity);
        
        if (!categoryCounts[bucket]) categoryCounts[bucket] = {};
        categoryCounts[bucket][template_category] = (categoryCounts[bucket][template_category] || 0) + 1;
        allCategoriesSet.add(template_category);

        if (!templateCounts[bucket]) templateCounts[bucket] = {};
        templateCounts[bucket][template_id] = (templateCounts[bucket][template_id] || 0) + 1;
        allTemplatesSet.add(template_id);
      });

      const allModels = Array.from(allModelsSet);
      const allCategories = Array.from(allCategoriesSet);
      const allTemplates = Array.from(allTemplatesSet);

      // Build trend arrays with all date buckets (including zeros)
      const promptTrends: TrendDataPoint[] = dateBuckets.map(date => ({
        date,
        count: promptCounts[date] || 0,
      }));

      const modelTrends: ModelTrendDataPoint[] = dateBuckets.map(date => {
        const point: ModelTrendDataPoint = { date };
        allModels.forEach(model => {
          point[model] = modelCounts[date]?.[model] || 0;
        });
        return point;
      });

      const categoryTrends: CategoryTrendDataPoint[] = dateBuckets.map(date => {
        const point: CategoryTrendDataPoint = { date };
        allCategories.forEach(cat => {
          point[cat] = categoryCounts[date]?.[cat] || 0;
        });
        return point;
      });

      const templateTrends: TemplateTrendDataPoint[] = dateBuckets.map(date => {
        const point: TemplateTrendDataPoint = { date };
        allTemplates.forEach(tid => {
          point[tid] = templateCounts[date]?.[tid] || 0;
        });
        return point;
      });

      return {
        promptTrends,
        modelTrends,
        categoryTrends,
        templateTrends,
        allModels,
        allCategories,
        allTemplates,
      };
    },
    refetchInterval: 60000,
  });
};
