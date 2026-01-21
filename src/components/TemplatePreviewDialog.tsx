import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Star } from "lucide-react";
import { TEMPLATE_CATEGORIES, TemplateCategory } from "@/types/templates";
import { useToast } from "@/hooks/use-toast";

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    title: string;
    description?: string | null;
    prompt: string;
    category: string;
    tags: string[];
  } | null;
  onUseTemplate: () => void;
  onDuplicate?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const TemplatePreviewDialog = ({
  open,
  onOpenChange,
  template,
  onUseTemplate,
  onDuplicate,
  isFavorite,
  onToggleFavorite,
}: TemplatePreviewDialogProps) => {
  const { toast } = useToast();

  if (!template) return null;

  const categoryLabel =
    template.category === "custom"
      ? "Custom"
      : TEMPLATE_CATEGORIES[template.category as TemplateCategory]?.label ||
        template.category;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(template.prompt);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard.",
    });
  };

  const handleUseTemplate = () => {
    onUseTemplate();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl">{template.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {template.description || "No description"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleFavorite}
                  title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star
                    className={`h-5 w-5 ${
                      isFavorite
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </Button>
              )}
              <Badge variant="outline">{categoryLabel}</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Prompt Template
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopyPrompt}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <ScrollArea className="h-[300px] rounded-md border bg-muted/30 p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {template.prompt}
            </pre>
          </ScrollArea>
        </div>

        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {onDuplicate && (
            <Button
              variant="outline"
              onClick={() => {
                onDuplicate();
                onOpenChange(false);
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
          )}
          <Button
            className="bg-brand-600 hover:bg-brand-700"
            onClick={handleUseTemplate}
          >
            Use Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreviewDialog;
