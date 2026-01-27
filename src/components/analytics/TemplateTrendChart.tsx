import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateTrendDataPoint } from "@/hooks/useAnalyticsTrends";
import { promptTemplates } from "@/types/templates";
import { Award } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { useMemo } from "react";

interface TemplateTrendChartProps {
  data: TemplateTrendDataPoint[];
  templates: string[];
  granularity: string;
}

const getTemplateColor = (index: number): string => {
  const colors = [
    "hsl(220, 70%, 50%)",
    "hsl(340, 70%, 50%)",
    "hsl(150, 60%, 45%)",
    "hsl(45, 80%, 50%)",
    "hsl(270, 60%, 55%)",
  ];
  return colors[index % colors.length];
};

const getTemplateName = (templateId: string): string => {
  const template = promptTemplates.find((t) => t.id === templateId);
  return template?.title || templateId;
};

const TemplateTrendChart = ({ data, templates, granularity }: TemplateTrendChartProps) => {
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

  // Get top 5 templates by total usage
  const topTemplates = useMemo(() => {
    const totals: Record<string, number> = {};
    templates.forEach((tid) => {
      totals[tid] = data.reduce((sum, d) => sum + ((d[tid] as number) || 0), 0);
    });
    return templates
      .filter((t) => totals[t] > 0)
      .sort((a, b) => totals[b] - totals[a])
      .slice(0, 5);
  }, [data, templates]);

  const hasData = topTemplates.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Top Templates Over Time
        </CardTitle>
        <CardDescription>
          Most used templates in this period (top 5)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {topTemplates.map((tid, index) => (
                  <linearGradient key={tid} id={`gradient-${tid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getTemplateColor(index)} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={getTemplateColor(index)} stopOpacity={0} />
                  </linearGradient>
                ))}
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
                formatter={(value, name) => [value, getTemplateName(name as string)]}
              />
              <Legend formatter={(value) => getTemplateName(value)} />
              {topTemplates.map((tid, index) => (
                <Area
                  key={tid}
                  type="monotone"
                  dataKey={tid}
                  stroke={getTemplateColor(index)}
                  strokeWidth={2}
                  fill={`url(#gradient-${tid})`}
                  name={tid}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">
            No template usage data for this period
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateTrendChart;
