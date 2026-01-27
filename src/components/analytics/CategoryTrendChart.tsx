import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryTrendDataPoint, PeriodComparison } from "@/hooks/useAnalyticsTrends";
import { TEMPLATE_CATEGORIES } from "@/types/templates";
import { Layers } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import ComparisonBadge from "./ComparisonBadge";

interface CategoryTrendChartProps {
  data: CategoryTrendDataPoint[];
  categories: string[];
  granularity: string;
  compareMode?: boolean;
  categoryComparisons?: Record<string, PeriodComparison>;
}

const CATEGORY_COLORS: Record<string, string> = {
  code: "hsl(210, 70%, 50%)",
  image: "hsl(340, 70%, 50%)",
  content: "hsl(150, 60%, 45%)",
  research: "hsl(45, 80%, 50%)",
  business: "hsl(270, 60%, 55%)",
  custom: "hsl(200, 50%, 50%)",
};

const getCategoryColor = (category: string, index: number): string => {
  return CATEGORY_COLORS[category] || `hsl(${(index * 60) % 360}, 60%, 50%)`;
};

const getCategoryLabel = (category: string): string => {
  return TEMPLATE_CATEGORIES[category as keyof typeof TEMPLATE_CATEGORIES]?.label || category;
};

const CategoryTrendChart = ({ 
  data, 
  categories, 
  granularity,
  compareMode = false,
  categoryComparisons 
}: CategoryTrendChartProps) => {
  const formatXAxis = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (granularity === "monthly") return format(date, "MMM yy");
      if (granularity === "weekly") return format(date, "MMM d");
      return format(date, "MMM d");
    } catch {
      return dateStr;
    }
  };

  const hasData = categories.length > 0 && data.some(d => categories.some(c => (d[c] as number) > 0));

  // Calculate overall change
  const overallChange = compareMode && categoryComparisons ? (() => {
    let totalCurrent = 0;
    let totalPrevious = 0;
    categories.forEach(c => {
      totalCurrent += categoryComparisons[c]?.current || 0;
      totalPrevious += categoryComparisons[c]?.previous || 0;
    });
    const pct = totalPrevious === 0 ? (totalCurrent > 0 ? 100 : 0) : Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 100);
    return { current: totalCurrent, previous: totalPrevious, percentageChange: pct };
  })() : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Category Usage Trends
          </CardTitle>
          {compareMode && overallChange && (
            <ComparisonBadge 
              percentageChange={overallChange.percentageChange}
              current={overallChange.current}
              previous={overallChange.previous}
            />
          )}
        </div>
        <CardDescription>
          Template categories used over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxis} 
                  fontSize={12}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  fontSize={12}
                  className="fill-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip 
                  labelFormatter={formatXAxis}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value, name) => [value, getCategoryLabel(name as string)]}
                />
                <Legend formatter={(value) => getCategoryLabel(value)} />
                {categories.map((category, index) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    fill={getCategoryColor(category, index)}
                    name={category}
                    stackId="stack"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            {compareMode && categoryComparisons && categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {categories.map((cat, index) => {
                  const comp = categoryComparisons[cat];
                  if (!comp || (comp.current === 0 && comp.previous === 0)) return null;
                  return (
                    <div key={cat} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getCategoryColor(cat, index) }}
                      />
                      <span className="text-xs font-medium">{getCategoryLabel(cat)}</span>
                      <ComparisonBadge 
                        percentageChange={comp.percentageChange}
                        current={comp.current}
                        previous={comp.previous}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">
            No category usage data for this period
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryTrendChart;
