import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";

interface TipTypeStat {
  type: string;
  applied: number;
  ignored: number;
}

interface MostAppliedTipsLeaderboardProps {
  byType: TipTypeStat[];
}

const MostAppliedTipsLeaderboard = ({ byType }: MostAppliedTipsLeaderboardProps) => {
  const ranked = byType
    .map((t) => {
      const total = t.applied + t.ignored;
      const rate = total > 0 ? Math.round((t.applied / total) * 100) : 0;
      return { ...t, total, rate };
    })
    .sort((a, b) => b.applied - a.applied);

  const medalColors = [
    "text-yellow-500",
    "text-gray-400",
    "text-amber-600",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Most Applied Tip Types
        </CardTitle>
        <CardDescription>Ranked by number of times users applied tips</CardDescription>
      </CardHeader>
      <CardContent>
        {ranked.length > 0 ? (
          <div className="space-y-3">
            {ranked.map((tip, index) => (
              <div key={tip.type} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {index < 3 ? (
                    <Medal className={`h-5 w-5 shrink-0 ${medalColors[index]}`} />
                  ) : (
                    <span className="w-5 text-center text-sm text-muted-foreground shrink-0">{index + 1}</span>
                  )}
                  <span className="font-medium capitalize truncate">{tip.type}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary">{tip.applied} applied</Badge>
                  <Badge variant="outline">{tip.rate}%</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No coaching tip data yet
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MostAppliedTipsLeaderboard;
