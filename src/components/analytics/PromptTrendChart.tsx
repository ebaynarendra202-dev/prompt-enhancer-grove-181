import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendDataPoint, PeriodComparison } from "@/hooks/useAnalyticsTrends";
import { TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import ComparisonBadge from "./ComparisonBadge";

interface PromptTrendChartProps {
  data: TrendDataPoint[];
  previousData?: TrendDataPoint[];
  comparison?: PeriodComparison;
  granularity: string;
  compareMode?: boolean;
}

const PromptTrendChart = ({ 
  data, 
  previousData, 
  comparison, 
  granularity, 
  compareMode = false 
}: PromptTrendChartProps) => {
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

  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  // Merge data for comparison view - align by index
  const mergedData = compareMode && previousData 
    ? data.map((d, i) => ({
        date: d.date,
        current: d.count,
        previous: previousData[i]?.count || 0,
      }))
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Prompts Improved Over Time
          </CardTitle>
          {compareMode && comparison && (
            <ComparisonBadge 
              percentageChange={comparison.percentageChange}
              current={comparison.current}
              previous={comparison.previous}
            />
          )}
        </div>
        <CardDescription>
          {totalCount} prompts improved in this period
          {compareMode && comparison && ` (vs ${comparison.previous} previously)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 && totalCount > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            {compareMode && mergedData ? (
              <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="previous"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  fill="url(#previousGradient)"
                  name="Previous Period"
                />
                <Area
                  type="monotone"
                  dataKey="current"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#currentGradient)"
                  name="Current Period"
                />
              </AreaChart>
            ) : (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="promptGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#promptGradient)"
                  name="Prompts"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">
            No prompt data for this period
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PromptTrendChart;
