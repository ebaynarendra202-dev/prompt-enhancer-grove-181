import { useState } from "react";
import { useAnalyticsTrends, DateRange, Granularity } from "@/hooks/useAnalyticsTrends";
import AnalyticsFilters from "./AnalyticsFilters";
import PromptTrendChart from "./PromptTrendChart";
import ModelTrendChart from "./ModelTrendChart";
import CategoryTrendChart from "./CategoryTrendChart";
import TemplateTrendChart from "./TemplateTrendChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const AnalyticsTrendsSection = () => {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [granularity, setGranularity] = useState<Granularity>("daily");

  const { data: trends, isLoading } = useAnalyticsTrends(dateRange, granularity);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <Skeleton className="h-10 w-[300px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[250px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!trends) return null;

  return (
    <div className="space-y-6">
      <AnalyticsFilters
        dateRange={dateRange}
        granularity={granularity}
        onDateRangeChange={setDateRange}
        onGranularityChange={setGranularity}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PromptTrendChart data={trends.promptTrends} granularity={granularity} />
        <ModelTrendChart 
          data={trends.modelTrends} 
          models={trends.allModels} 
          granularity={granularity} 
        />
        <CategoryTrendChart 
          data={trends.categoryTrends} 
          categories={trends.allCategories} 
          granularity={granularity} 
        />
        <TemplateTrendChart 
          data={trends.templateTrends} 
          templates={trends.allTemplates} 
          granularity={granularity} 
        />
      </div>
    </div>
  );
};

export default AnalyticsTrendsSection;
