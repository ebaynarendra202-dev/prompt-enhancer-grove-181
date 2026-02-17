import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendDataPoint, CoachingTrendDataPoint } from "@/hooks/useAnalyticsTrends";
import { Lightbulb } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from "recharts";
import { format, parseISO } from "date-fns";

interface CoachingTipTrendChartProps {
  overviewData: TrendDataPoint[];
  byTypeData: CoachingTrendDataPoint[];
  tipTypes: string[];
  granularity: string;
}

const TIP_TYPE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent-foreground))",
  "hsl(45, 93%, 47%)",
  "hsl(142, 71%, 45%)",
  "hsl(280, 65%, 60%)",
  "hsl(10, 78%, 54%)",
  "hsl(199, 89%, 48%)",
  "hsl(330, 65%, 55%)",
];

const CoachingTipTrendChart = ({ overviewData, byTypeData, tipTypes, granularity }: CoachingTipTrendChartProps) => {
  const formatXAxis = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (granularity === "monthly") return format(date, "MMM yy");
      return format(date, "MMM d");
    } catch {
      return dateStr;
    }
  };

  const totalInteractions = overviewData.reduce((sum, d) => sum + d.count, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Coaching Tips Over Time
          </CardTitle>
          <CardDescription>
            {totalInteractions} tip interactions in this period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalInteractions > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={overviewData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="coachingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={formatXAxis} fontSize={12} className="fill-muted-foreground" />
                <YAxis fontSize={12} className="fill-muted-foreground" allowDecimals={false} />
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
                  stroke="hsl(45, 93%, 47%)"
                  strokeWidth={2}
                  fill="url(#coachingGradient)"
                  name="Interactions"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No coaching data for this period</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Tips by Type Over Time
          </CardTitle>
          <CardDescription>Breakdown of coaching tip interactions by category</CardDescription>
        </CardHeader>
        <CardContent>
          {tipTypes.length > 0 && totalInteractions > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byTypeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={formatXAxis} fontSize={12} className="fill-muted-foreground" />
                <YAxis fontSize={12} className="fill-muted-foreground" allowDecimals={false} />
                <Tooltip
                  labelFormatter={formatXAxis}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {tipTypes.map((type, i) => (
                  <Bar
                    key={type}
                    dataKey={type}
                    stackId="a"
                    fill={TIP_TYPE_COLORS[i % TIP_TYPE_COLORS.length]}
                    name={type.charAt(0).toUpperCase() + type.slice(1)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No coaching data for this period</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default CoachingTipTrendChart;
