import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, ArrowLeft, Calendar, Eye, Cpu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDistanceToNow } from "date-fns";

interface SharedPrompt {
  id: string;
  share_id: string;
  original_prompt: string;
  improved_prompt: string;
  ai_model: string;
  created_at: string;
  view_count: number;
}

const SharedPrompt = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [prompt, setPrompt] = useState<SharedPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSharedPrompt = async () => {
      if (!shareId) {
        setError("Invalid share link");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the shared prompt
        const { data, error: fetchError } = await supabase
          .from('shared_prompts')
          .select('*')
          .eq('share_id', shareId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError("Shared prompt not found or has expired");
          setIsLoading(false);
          return;
        }

        setPrompt(data);

        // Increment view count (fire and forget)
        supabase
          .from('shared_prompts')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', data.id)
          .then();

      } catch (err) {
        console.error('Error fetching shared prompt:', err);
        setError("Failed to load shared prompt");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedPrompt();
  }, [shareId]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} has been copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Not Found</CardTitle>
            <CardDescription>{error || "This shared prompt could not be found"}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
            Shared Prompt
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Cpu className="h-4 w-4" />
              <span className="font-medium uppercase">{prompt.ai_model}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{prompt.view_count} views</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Original Prompt</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(prompt.original_prompt, "Original prompt")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {prompt.original_prompt}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-brand-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-brand-700">Improved Prompt</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(prompt.improved_prompt, "Improved prompt")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-brand-200 bg-gradient-to-r from-brand-50/50 to-brand-100/50 p-4">
              <p className="text-sm whitespace-pre-wrap font-medium leading-relaxed">
                {prompt.improved_prompt}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pt-4">
          <Link to="/">
            <Button className="bg-brand-600 hover:bg-brand-700">
              Try the AI Prompt Improver
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default SharedPrompt;
