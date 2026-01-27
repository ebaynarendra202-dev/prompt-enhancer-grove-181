import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryTrendDataPoint } from "@/hooks/useAnalyticsTrends";
import { TEMPLATE_CATEGORIES } from "@/types/templates";
import { Layers } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { format, parseISO } from "date-fns";

interface CategoryTrendChartProps {
  data: CategoryTrendDataPoint[];
  categories: string[];
  granularity: string;
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

const CategoryTrendChart = ({ data, categories, granularity }: CategoryTrendChartProps) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Category Usage Trends
        </CardTitle>
        <CardDescription>
          Template categories used over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
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
