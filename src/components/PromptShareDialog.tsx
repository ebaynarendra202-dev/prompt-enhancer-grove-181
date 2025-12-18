import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Share2, Link, FileText, Download, Copy, Check, Loader2 } from "lucide-react";

interface PromptShareDialogProps {
  originalPrompt: string;
  improvedPrompt: string;
  aiModel: string;
}

const PromptShareDialog = ({ originalPrompt, improvedPrompt, aiModel }: PromptShareDialogProps) => {
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const createShareLink = async () => {
    setIsCreatingLink(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('shared_prompts')
        .insert({
          original_prompt: originalPrompt,
          improved_prompt: improvedPrompt,
          ai_model: aiModel,
          created_by: user?.user?.id || null,
        })
        .select('share_id')
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/shared/${data.share_id}`;
      setShareLink(link);
      setShowLinkDialog(true);
    } catch (error) {
      console.error('Error creating share link:', error);
      toast({
        title: "Failed to create share link",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLink(false);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const copyAsFormattedText = async () => {
    const formattedText = `# Prompt Improvement

## Original Prompt
${originalPrompt}

## Improved Prompt
${improvedPrompt}

---
*Generated using AI (${aiModel})*`;

    try {
      await navigator.clipboard.writeText(formattedText);
      toast({
        title: "Copied as Markdown!",
        description: "Formatted text has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const downloadAsTextFile = () => {
    const formattedText = `PROMPT IMPROVEMENT
==================

ORIGINAL PROMPT:
${originalPrompt}

IMPROVED PROMPT:
${improvedPrompt}

---
Generated using AI (${aiModel})
Date: ${new Date().toLocaleDateString()}`;

    const blob = new Blob([formattedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prompt-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Prompt has been saved as a text file",
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8" disabled={isCreatingLink}>
            {isCreatingLink ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={createShareLink} disabled={isCreatingLink}>
            <Link className="h-4 w-4 mr-2" />
            Create Share Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyAsFormattedText}>
            <FileText className="h-4 w-4 mr-2" />
            Copy as Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadAsTextFile}>
            <Download className="h-4 w-4 mr-2" />
            Download as Text
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Link Created</DialogTitle>
            <DialogDescription>
              Anyone with this link can view your prompt improvement. Link expires in 30 days.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input
              value={shareLink}
              readOnly
              className="flex-1"
            />
            <Button size="sm" onClick={copyShareLink}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PromptShareDialog;
