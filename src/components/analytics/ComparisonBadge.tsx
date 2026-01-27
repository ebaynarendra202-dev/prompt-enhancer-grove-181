import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonBadgeProps {
  percentageChange: number;
  current: number;
  previous: number;
  label?: string;
  showValues?: boolean;
}

const ComparisonBadge = ({ 
  percentageChange, 
  current, 
  previous, 
  label,
  showValues = false 
}: ComparisonBadgeProps) => {
  const isPositive = percentageChange > 0;
  const isNegative = percentageChange < 0;
  const isNeutral = percentageChange === 0;

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          isPositive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          isNegative && "bg-red-500/10 text-red-600 dark:text-red-400",
          isNeutral && "bg-muted text-muted-foreground"
        )}
      >
        {isPositive && <TrendingUp className="h-3 w-3" />}
        {isNegative && <TrendingDown className="h-3 w-3" />}
        {isNeutral && <Minus className="h-3 w-3" />}
        <span>
          {isPositive && "+"}
          {percentageChange}%
        </span>
      </div>
      {showValues && (
        <span className="text-xs text-muted-foreground">
          ({current} vs {previous})
        </span>
      )}
    </div>
  );
};

export default ComparisonBadge;
