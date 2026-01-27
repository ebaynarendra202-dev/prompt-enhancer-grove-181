import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendDataPoint } from "@/hooks/useAnalyticsTrends";
import { TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";

interface PromptTrendChartProps {
  data: TrendDataPoint[];
  granularity: string;
}

const PromptTrendChart = ({ data, granularity }: PromptTrendChartProps) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Prompts Improved Over Time
        </CardTitle>
        <CardDescription>
          {totalCount} prompts improved in this period
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 && totalCount > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
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
