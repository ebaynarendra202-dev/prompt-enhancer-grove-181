import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, CheckCircle2, XCircle, Target, AlertCircle, FileText, Settings2, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CoachingTipStats {
  totalApplied: number;
  totalIgnored: number;
  byType: { type: string; applied: number; ignored: number }[];
  byPriority: { priority: string; applied: number; ignored: number }[];
}

interface CoachingTipAnalyticsProps {
  stats: CoachingTipStats;
}

const typeConfig: Record<string, { icon: typeof Lightbulb; label: string; color: string }> = {
  clarity: { icon: AlertCircle, label: "Clarity", color: "text-yellow-600" },
  specificity: { icon: Target, label: "Specificity", color: "text-blue-600" },
  context: { icon: FileText, label: "Context", color: "text-purple-600" },
  structure: { icon: Settings2, label: "Structure", color: "text-green-600" },
  constraint: { icon: Settings2, label: "Constraint", color: "text-orange-600" },
  example: { icon: BookOpen, label: "Example", color: "text-teal-600" },
};

const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  high: { label: "High Priority", color: "text-destructive", bgColor: "bg-destructive/10" },
  medium: { label: "Medium Priority", color: "text-yellow-600", bgColor: "bg-yellow-500/10" },
  low: { label: "Low Priority", color: "text-muted-foreground", bgColor: "bg-muted" },
};

const CoachingTipAnalytics = ({ stats }: CoachingTipAnalyticsProps) => {
  const total = stats.totalApplied + stats.totalIgnored;
  const applyRate = total > 0 ? Math.round((stats.totalApplied / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tips Applied</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.totalApplied}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {applyRate}% apply rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tips Ignored</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">{stats.totalIgnored}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {total > 0 ? 100 - applyRate : 0}% ignore rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Lightbulb className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Coaching tips shown
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Tips by Type
            </CardTitle>
            <CardDescription>Apply vs ignore rates for each tip category</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.byType.length > 0 ? (
              <div className="space-y-4">
                {stats.byType.map((item) => {
                  const config = typeConfig[item.type] || { icon: Lightbulb, label: item.type, color: "text-muted-foreground" };
                  const Icon = config.icon;
                  const itemTotal = item.applied + item.ignored;
                  const itemApplyRate = itemTotal > 0 ? Math.round((item.applied / itemTotal) * 100) : 0;

                  return (
                    <div key={item.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span className="font-medium text-sm">{config.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            {item.applied} applied
                          </Badge>
                          <Badge variant="outline" className="text-muted-foreground">
                            {item.ignored} ignored
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={itemApplyRate} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {itemApplyRate}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No coaching tip data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* By Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Tips by Priority
            </CardTitle>
            <CardDescription>How users respond to different priority levels</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.byPriority.length > 0 ? (
              <div className="space-y-4">
                {stats.byPriority.map((item) => {
                  const config = priorityConfig[item.priority] || { label: item.priority, color: "text-muted-foreground", bgColor: "bg-muted" };
                  const itemTotal = item.applied + item.ignored;
                  const itemApplyRate = itemTotal > 0 ? Math.round((item.applied / itemTotal) * 100) : 0;

                  return (
                    <div key={item.priority} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`${config.bgColor} ${config.color} border-0`}>
                          {config.label}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            <span className="text-green-600 font-medium">{item.applied}</span>
                            <span className="text-muted-foreground"> / {itemTotal}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${itemApplyRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-12 text-right">
                          {itemApplyRate}% applied
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No priority data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoachingTipAnalytics;
