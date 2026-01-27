import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DateRange, Granularity } from "@/hooks/useAnalyticsTrends";
import { Calendar, BarChart3, GitCompare } from "lucide-react";

interface AnalyticsFiltersProps {
  dateRange: DateRange;
  granularity: Granularity;
  onDateRangeChange: (value: DateRange) => void;
  onGranularityChange: (value: Granularity) => void;
  compareMode?: boolean;
  onCompareModeChange?: (enabled: boolean) => void;
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last year" },
];

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const AnalyticsFilters = ({
  dateRange,
  granularity,
  onDateRangeChange,
  onGranularityChange,
  compareMode = false,
  onCompareModeChange,
}: AnalyticsFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-center">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <Select value={granularity} onValueChange={onGranularityChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Granularity" />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {onCompareModeChange && (
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <GitCompare className="h-4 w-4 text-muted-foreground" />
          <Switch
            id="compare-mode"
            checked={compareMode}
            onCheckedChange={onCompareModeChange}
          />
          <Label htmlFor="compare-mode" className="text-sm cursor-pointer">
            Compare periods
          </Label>
        </div>
      )}
    </div>
  );
};

export default AnalyticsFilters;
