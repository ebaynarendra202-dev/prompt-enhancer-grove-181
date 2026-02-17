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

export interface PeriodComparison {
  current: number;
  previous: number;
  percentageChange: number;
}

export interface CoachingTrendDataPoint {
  date: string;
  applied: number;
  ignored: number;
  [tipType: string]: string | number;
}

export interface AnalyticsTrends {
  promptTrends: TrendDataPoint[];
  modelTrends: ModelTrendDataPoint[];
  categoryTrends: CategoryTrendDataPoint[];
  templateTrends: TemplateTrendDataPoint[];
  coachingTrends: TrendDataPoint[];
  coachingByTypeTrends: CoachingTrendDataPoint[];
  allModels: string[];
  allCategories: string[];
  allTemplates: string[];
  allTipTypes: string[];
  // Comparison data
  previousPromptTrends: TrendDataPoint[];
  previousModelTrends: ModelTrendDataPoint[];
  previousCategoryTrends: CategoryTrendDataPoint[];
  previousTemplateTrends: TemplateTrendDataPoint[];
  // Summary comparisons
  totalPromptsComparison: PeriodComparison;
  modelComparisons: Record<string, PeriodComparison>;
  categoryComparisons: Record<string, PeriodComparison>;
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

const getPreviousPeriodStart = (range: DateRange): { start: Date; end: Date } => {
  const currentStart = getDateRangeStart(range);
  const now = new Date();
  const periodLength = now.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - periodLength);
  return { start: previousStart, end: previousEnd };
};

const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export const useAnalyticsTrends = (dateRange: DateRange, granularity: Granularity) => {
  return useQuery({
    queryKey: ["analytics-trends", dateRange, granularity],
    queryFn: async (): Promise<AnalyticsTrends> => {
      const startDate = getDateRangeStart(dateRange);
      const endDate = new Date();
      const dateBuckets = generateDateBuckets(startDate, endDate, granularity);
      
      // Get previous period dates
      const { start: prevStartDate, end: prevEndDate } = getPreviousPeriodStart(dateRange);
      const prevDateBuckets = generateDateBuckets(prevStartDate, prevEndDate, granularity);

      // Fetch current period prompt improvements
      const { data: promptData } = await supabase
        .from("prompt_improvements")
        .select("created_at, ai_model")
        .gte("created_at", startDate.toISOString());

      // Fetch previous period prompt improvements
      const { data: prevPromptData } = await supabase
        .from("prompt_improvements")
        .select("created_at, ai_model")
        .gte("created_at", prevStartDate.toISOString())
        .lte("created_at", prevEndDate.toISOString());

      // Fetch current period template usage
      const { data: templateData } = await supabase
        .from("template_usage")
        .select("created_at, template_id, template_category")
        .gte("created_at", startDate.toISOString());

      // Fetch previous period template usage
      const { data: prevTemplateData } = await supabase
        .from("template_usage")
        .select("created_at, template_id, template_category")
        .gte("created_at", prevStartDate.toISOString())
        .lte("created_at", prevEndDate.toISOString());

      // Fetch coaching tip interactions
      const { data: coachingData } = await supabase
        .from("coaching_tip_interactions")
        .select("created_at, tip_type, action")
        .gte("created_at", startDate.toISOString());

      // Process current period prompt trends
      const promptCounts: Record<string, number> = {};
      const modelCounts: Record<string, Record<string, number>> = {};
      const allModelsSet = new Set<string>();
      const modelTotals: Record<string, number> = {};

      (promptData || []).forEach(({ created_at, ai_model }) => {
        const bucket = formatDateByGranularity(new Date(created_at), granularity);
        promptCounts[bucket] = (promptCounts[bucket] || 0) + 1;
        
        if (!modelCounts[bucket]) modelCounts[bucket] = {};
        modelCounts[bucket][ai_model] = (modelCounts[bucket][ai_model] || 0) + 1;
        allModelsSet.add(ai_model);
        modelTotals[ai_model] = (modelTotals[ai_model] || 0) + 1;
      });

      // Process previous period prompt trends
      const prevPromptCounts: Record<string, number> = {};
      const prevModelCounts: Record<string, Record<string, number>> = {};
      const prevModelTotals: Record<string, number> = {};

      (prevPromptData || []).forEach(({ created_at, ai_model }) => {
        const bucket = formatDateByGranularity(new Date(created_at), granularity);
        prevPromptCounts[bucket] = (prevPromptCounts[bucket] || 0) + 1;
        
        if (!prevModelCounts[bucket]) prevModelCounts[bucket] = {};
        prevModelCounts[bucket][ai_model] = (prevModelCounts[bucket][ai_model] || 0) + 1;
        allModelsSet.add(ai_model);
        prevModelTotals[ai_model] = (prevModelTotals[ai_model] || 0) + 1;
      });

      // Process current period template and category trends
      const categoryCounts: Record<string, Record<string, number>> = {};
      const templateCounts: Record<string, Record<string, number>> = {};
      const allCategoriesSet = new Set<string>();
      const allTemplatesSet = new Set<string>();
      const categoryTotals: Record<string, number> = {};

      (templateData || []).forEach(({ created_at, template_id, template_category }) => {
        const bucket = formatDateByGranularity(new Date(created_at), granularity);
        
        if (!categoryCounts[bucket]) categoryCounts[bucket] = {};
        categoryCounts[bucket][template_category] = (categoryCounts[bucket][template_category] || 0) + 1;
        allCategoriesSet.add(template_category);
        categoryTotals[template_category] = (categoryTotals[template_category] || 0) + 1;

        if (!templateCounts[bucket]) templateCounts[bucket] = {};
        templateCounts[bucket][template_id] = (templateCounts[bucket][template_id] || 0) + 1;
        allTemplatesSet.add(template_id);
      });

      // Process previous period template and category trends
      const prevCategoryCounts: Record<string, Record<string, number>> = {};
      const prevTemplateCounts: Record<string, Record<string, number>> = {};
      const prevCategoryTotals: Record<string, number> = {};

      (prevTemplateData || []).forEach(({ created_at, template_id, template_category }) => {
        const bucket = formatDateByGranularity(new Date(created_at), granularity);
        
        if (!prevCategoryCounts[bucket]) prevCategoryCounts[bucket] = {};
        prevCategoryCounts[bucket][template_category] = (prevCategoryCounts[bucket][template_category] || 0) + 1;
        allCategoriesSet.add(template_category);
        prevCategoryTotals[template_category] = (prevCategoryTotals[template_category] || 0) + 1;

        if (!prevTemplateCounts[bucket]) prevTemplateCounts[bucket] = {};
        prevTemplateCounts[bucket][template_id] = (prevTemplateCounts[bucket][template_id] || 0) + 1;
        allTemplatesSet.add(template_id);
      });

      // Process coaching tip interactions
      const coachingCounts: Record<string, number> = {};
      const coachingByType: Record<string, Record<string, number>> = {};
      const allTipTypesSet = new Set<string>();

      const appliedActions = ['applied', 'applied_all'];
      (coachingData || []).forEach(({ created_at, tip_type, action }) => {
        if (!appliedActions.includes(action) && action !== 'ignored') return;
        const bucket = formatDateByGranularity(new Date(created_at), granularity);
        coachingCounts[bucket] = (coachingCounts[bucket] || 0) + 1;
        if (!coachingByType[bucket]) coachingByType[bucket] = {};
        coachingByType[bucket][tip_type] = (coachingByType[bucket][tip_type] || 0) + 1;
        allTipTypesSet.add(tip_type);
      });

      const allModels = Array.from(allModelsSet);
      const allCategories = Array.from(allCategoriesSet);
      const allTemplates = Array.from(allTemplatesSet);
      const allTipTypes = Array.from(allTipTypesSet);

      // Build current trend arrays
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

      // Build previous period trend arrays
      const previousPromptTrends: TrendDataPoint[] = prevDateBuckets.map(date => ({
        date,
        count: prevPromptCounts[date] || 0,
      }));

      const previousModelTrends: ModelTrendDataPoint[] = prevDateBuckets.map(date => {
        const point: ModelTrendDataPoint = { date };
        allModels.forEach(model => {
          point[model] = prevModelCounts[date]?.[model] || 0;
        });
        return point;
      });

      const previousCategoryTrends: CategoryTrendDataPoint[] = prevDateBuckets.map(date => {
        const point: CategoryTrendDataPoint = { date };
        allCategories.forEach(cat => {
          point[cat] = prevCategoryCounts[date]?.[cat] || 0;
        });
        return point;
      });

      const previousTemplateTrends: TemplateTrendDataPoint[] = prevDateBuckets.map(date => {
        const point: TemplateTrendDataPoint = { date };
        allTemplates.forEach(tid => {
          point[tid] = prevTemplateCounts[date]?.[tid] || 0;
        });
        return point;
      });

      // Calculate comparison summaries
      const totalCurrent = promptTrends.reduce((sum, d) => sum + d.count, 0);
      const totalPrevious = previousPromptTrends.reduce((sum, d) => sum + d.count, 0);

      const totalPromptsComparison: PeriodComparison = {
        current: totalCurrent,
        previous: totalPrevious,
        percentageChange: calculatePercentageChange(totalCurrent, totalPrevious),
      };

      const modelComparisons: Record<string, PeriodComparison> = {};
      allModels.forEach(model => {
        const current = modelTotals[model] || 0;
        const previous = prevModelTotals[model] || 0;
        modelComparisons[model] = {
          current,
          previous,
          percentageChange: calculatePercentageChange(current, previous),
        };
      });

      const categoryComparisons: Record<string, PeriodComparison> = {};
      allCategories.forEach(cat => {
        const current = categoryTotals[cat] || 0;
        const previous = prevCategoryTotals[cat] || 0;
        categoryComparisons[cat] = {
          current,
          previous,
          percentageChange: calculatePercentageChange(current, previous),
        };
      });

      // Build coaching trend arrays
      const coachingTrends: TrendDataPoint[] = dateBuckets.map(date => ({
        date,
        count: coachingCounts[date] || 0,
      }));

      const coachingByTypeTrends: CoachingTrendDataPoint[] = dateBuckets.map(date => {
        const point: CoachingTrendDataPoint = { date, applied: 0, ignored: 0 };
        allTipTypes.forEach(type => {
          point[type] = coachingByType[date]?.[type] || 0;
        });
        return point;
      });

      return {
        promptTrends,
        modelTrends,
        categoryTrends,
        templateTrends,
        coachingTrends,
        coachingByTypeTrends,
        allModels,
        allCategories,
        allTemplates,
        allTipTypes,
        previousPromptTrends,
        previousModelTrends,
        previousCategoryTrends,
        previousTemplateTrends,
        totalPromptsComparison,
        modelComparisons,
        categoryComparisons,
      };
    },
    refetchInterval: 60000,
  });
};
