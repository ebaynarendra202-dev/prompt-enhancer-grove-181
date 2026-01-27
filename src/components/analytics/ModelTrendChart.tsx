import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelTrendDataPoint, PeriodComparison } from "@/hooks/useAnalyticsTrends";
import { Sparkles } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import ComparisonBadge from "./ComparisonBadge";

interface ModelTrendChartProps {
  data: ModelTrendDataPoint[];
  models: string[];
  granularity: string;
  compareMode?: boolean;
  modelComparisons?: Record<string, PeriodComparison>;
}

const MODEL_COLORS: Record<string, string> = {
  gpt: "hsl(220, 70%, 50%)",
  claude: "hsl(25, 85%, 55%)",
  gemini: "hsl(280, 60%, 55%)",
  mistral: "hsl(160, 60%, 45%)",
};

const getModelColor = (model: string, index: number): string => {
  const lowerModel = model.toLowerCase();
  for (const [key, color] of Object.entries(MODEL_COLORS)) {
    if (lowerModel.includes(key)) return color;
  }
  const hue = (index * 60) % 360;
  return `hsl(${hue}, 60%, 50%)`;
};

const ModelTrendChart = ({ 
  data, 
  models, 
  granularity, 
  compareMode = false,
  modelComparisons 
}: ModelTrendChartProps) => {
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

  const hasData = models.length > 0 && data.some(d => models.some(m => (d[m] as number) > 0));

  // Calculate overall change across all models
  const overallChange = compareMode && modelComparisons ? (() => {
    let totalCurrent = 0;
    let totalPrevious = 0;
    models.forEach(m => {
      totalCurrent += modelComparisons[m]?.current || 0;
      totalPrevious += modelComparisons[m]?.previous || 0;
    });
    const pct = totalPrevious === 0 ? (totalCurrent > 0 ? 100 : 0) : Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 100);
    return { current: totalCurrent, previous: totalPrevious, percentageChange: pct };
  })() : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Model Usage Trends
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
          Usage distribution across models over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                {models.map((model, index) => (
                  <Line
                    key={model}
                    type="monotone"
                    dataKey={model}
                    stroke={getModelColor(model, index)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={model.toUpperCase()}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            {compareMode && modelComparisons && models.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {models.map((model, index) => {
                  const comp = modelComparisons[model];
                  if (!comp || (comp.current === 0 && comp.previous === 0)) return null;
                  return (
                    <div key={model} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getModelColor(model, index) }}
                      />
                      <span className="text-xs font-medium">{model.toUpperCase()}</span>
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
            No model usage data for this period
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelTrendChart;
