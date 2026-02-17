import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalytics } from "@/hooks/useAnalytics";
import { promptTemplates, TEMPLATE_CATEGORIES } from "@/types/templates";
import { BarChart3, TrendingUp, Sparkles, Award, Calendar, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import AnalyticsTrendsSection from "./analytics/AnalyticsTrendsSection";
import CoachingTipAnalytics from "./analytics/CoachingTipAnalytics";
import MostAppliedTipsLeaderboard from "./analytics/MostAppliedTipsLeaderboard";

const AnalyticsDashboard = () => {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const getTemplateName = (templateId: string) => {
    const template = promptTemplates.find((t) => t.id === templateId);
    return template?.title || templateId;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <BarChart3 className="h-8 w-8 text-brand-600" />
          Analytics Dashboard
        </h2>
        <p className="text-muted-foreground">
          Track usage statistics and popular templates
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-brand-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prompts Improved</CardTitle>
            <Sparkles className="h-4 w-4 text-brand-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand-600">{analytics.totalPrompts}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime total</p>
          </CardContent>
        </Card>

        <Card className="border-brand-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Template Uses</CardTitle>
            <Award className="h-4 w-4 text-brand-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand-600">{analytics.totalTemplateUses}</div>
            <p className="text-xs text-muted-foreground mt-1">Total selections</p>
          </CardContent>
        </Card>

        <Card className="border-brand-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-brand-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand-600">
              {analytics.recentActivity.reduce((sum, day) => sum + day.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Popular Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-600" />
              Most Popular Templates
            </CardTitle>
            <CardDescription>Top 10 frequently used templates</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.popularTemplates.length > 0 ? (
              <div className="space-y-3">
                {analytics.popularTemplates.map((template, index) => (
                  <div key={template.template_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{getTemplateName(template.template_id)}</span>
                    </div>
                    <Badge variant="secondary">{template.count} uses</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No template usage data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI Model Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-600" />
              AI Model Usage
            </CardTitle>
            <CardDescription>Distribution of model selections</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.modelUsage.length > 0 ? (
              <div className="space-y-3">
                {analytics.modelUsage.map((model) => (
                  <div key={model.model} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{model.model.toUpperCase()}</span>
                      <span className="text-muted-foreground">{model.count} uses</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 transition-all"
                        style={{
                          width: `${(model.count / analytics.totalPrompts) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No model usage data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Category Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-600" />
              Category Usage
            </CardTitle>
            <CardDescription>Templates by category</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.categoryUsage.length > 0 ? (
              <div className="space-y-3">
                {analytics.categoryUsage.map((category) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {TEMPLATE_CATEGORIES[category.category as keyof typeof TEMPLATE_CATEGORIES]?.label || category.category}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{category.count} uses</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No category usage data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Prompt improvements over last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentActivity.map((day) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{day.date}</span>
                    <Badge variant="secondary">{day.count} prompts</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coaching Tips Section */}
      <Separator className="my-8" />
      
      <div className="text-center space-y-2 mb-6">
        <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Lightbulb className="h-6 w-6 text-amber-500" />
          Coaching Insights
        </h3>
        <p className="text-muted-foreground">
          See which coaching tips are most helpful
        </p>
      </div>

      <CoachingTipAnalytics stats={analytics.coachingTipStats} />

      <MostAppliedTipsLeaderboard byType={analytics.coachingTipStats.byType} />

      {/* Trends Section */}
      <Separator className="my-8" />
      
      <div className="text-center space-y-2 mb-6">
        <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Usage Trends
        </h3>
        <p className="text-muted-foreground">
          Explore your activity patterns over time
        </p>
      </div>

      <AnalyticsTrendsSection />
    </div>
  );
};

export default AnalyticsDashboard;
