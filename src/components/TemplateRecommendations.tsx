import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TemplateSuggestion = {
  templateId: string;
  reason: string;
};

export type TemplateSuggestionTemplate = {
  id: string;
  title: string;
  description?: string | null;
  prompt: string;
  category: string;
  tags: string[];
  source: "built_in" | "custom";
};

interface TemplateRecommendationsProps {
  isLoading: boolean;
  suggestions: Array<TemplateSuggestion & { template?: TemplateSuggestionTemplate }>;
  onUseTemplate: (template: TemplateSuggestionTemplate) => void;
  className?: string;
}

const TemplateRecommendations = ({
  isLoading,
  suggestions,
  onUseTemplate,
  className,
}: TemplateRecommendationsProps) => {
  const visible = isLoading || suggestions.length > 0;
  if (!visible) return null;

  return (
    <section className={cn("rounded-lg border border-border bg-muted/20 p-4", className)} aria-label="Template recommendations">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-medium text-foreground">Template suggestions</h2>
          <p className="text-xs text-muted-foreground">Top matches based on what you’re typing</p>
        </div>
        {isLoading && (
          <div className="text-xs text-muted-foreground">Finding matches…</div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {suggestions.map((s) => {
          const t = s.template;
          return (
            <div
              key={s.templateId}
              className="rounded-md border border-border bg-background/60 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium text-foreground truncate">{t?.title ?? "Template"}</div>
                    {t?.source && (
                      <Badge variant="secondary" className="text-[10px]">
                        {t.source === "custom" ? "My template" : "Built-in"}
                      </Badge>
                    )}
                    {t?.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {t.category}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.reason}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!t}
                  onClick={() => t && onUseTemplate(t)}
                >
                  Use template
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TemplateRecommendations;
