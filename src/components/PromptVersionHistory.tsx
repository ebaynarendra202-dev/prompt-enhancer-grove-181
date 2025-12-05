import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Layers, ChevronDown, Trash2, Clock, GitCompare, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PromptVersionGroup, PromptVersion } from "@/hooks/usePromptVersions";
import PromptDiffView from "./PromptDiffView";

interface PromptVersionHistoryProps {
  versionGroups: PromptVersionGroup[];
  onLoadVersion: (version: PromptVersion) => void;
  onDeleteGroup: (groupId: string) => void;
  onDeleteVersion: (groupId: string, versionId: string) => void;
  onClearAll: () => void;
}

const PromptVersionHistory = ({
  versionGroups,
  onLoadVersion,
  onDeleteGroup,
  onDeleteVersion,
  onClearAll,
}: PromptVersionHistoryProps) => {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [compareDialog, setCompareDialog] = useState<{
    open: boolean;
    groupId: string | null;
    version1: PromptVersion | null;
    version2: PromptVersion | null;
  }>({ open: false, groupId: null, version1: null, version2: null });
  const [selectedForCompare, setSelectedForCompare] = useState<{
    groupId: string;
    version: PromptVersion;
  } | null>(null);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleSelectForCompare = (groupId: string, version: PromptVersion) => {
    if (selectedForCompare && selectedForCompare.groupId === groupId) {
      // Second selection - open compare dialog
      setCompareDialog({
        open: true,
        groupId,
        version1: selectedForCompare.version,
        version2: version,
      });
      setSelectedForCompare(null);
    } else {
      // First selection
      setSelectedForCompare({ groupId, version });
    }
  };

  const totalVersions = versionGroups.reduce((acc, g) => acc + g.versions.length, 0);

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Layers className="h-4 w-4" />
            Versions {totalVersions > 0 && `(${totalVersions})`}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Prompt Version History</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {versionGroups.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {versionGroups.length} prompt{versionGroups.length !== 1 ? "s" : ""} with {totalVersions} version{totalVersions !== 1 ? "s" : ""}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="text-destructive hover:text-destructive"
                  >
                    Clear All
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-3 pr-4">
                    {versionGroups.map((group) => (
                      <Collapsible
                        key={group.id}
                        open={openGroups.has(group.id)}
                        onOpenChange={() => toggleGroup(group.id)}
                      >
                        <div className="border border-border rounded-lg overflow-hidden">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {group.basePrompt.slice(0, 50)}
                                  {group.basePrompt.length > 50 ? "..." : ""}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <span>{group.versions.length} version{group.versions.length !== 1 ? "s" : ""}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(group.updatedAt, { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteGroup(group.id);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    openGroups.has(group.id) ? "rotate-180" : ""
                                  }`}
                                />
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border-t border-border bg-muted/20 p-2 space-y-2">
                              {selectedForCompare?.groupId === group.id && (
                                <div className="text-xs text-brand-600 bg-brand-50 dark:bg-brand-950/30 p-2 rounded flex items-center justify-between">
                                  <span>Select another version to compare</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => setSelectedForCompare(null)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              {group.versions.map((version) => (
                                <div
                                  key={version.id}
                                  className={`p-2 rounded-md border transition-colors ${
                                    selectedForCompare?.version.id === version.id
                                      ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30"
                                      : "border-transparent hover:bg-muted/50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium">
                                      v{version.versionNumber} • {version.model}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {group.versions.length > 1 && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => handleSelectForCompare(group.id, version)}
                                          title="Compare versions"
                                        >
                                          <GitCompare className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive hover:text-destructive"
                                        onClick={() => onDeleteVersion(group.id, version.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div
                                    className="text-xs text-muted-foreground line-clamp-2 cursor-pointer"
                                    onClick={() => onLoadVersion(version)}
                                  >
                                    {version.improvedPrompt.slice(0, 100)}...
                                  </div>
                                  <div className="text-xs text-muted-foreground/70 mt-1">
                                    {formatDistanceToNow(version.timestamp, { addSuffix: true })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No version history yet</p>
                <p className="text-sm">Versions will be tracked as you improve prompts</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={compareDialog.open} onOpenChange={(open) => setCompareDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
          </DialogHeader>
          {compareDialog.version1 && compareDialog.version2 && (
            <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-100px)]">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>v{compareDialog.version1.versionNumber} ({compareDialog.version1.model})</span>
                <span>vs</span>
                <span>v{compareDialog.version2.versionNumber} ({compareDialog.version2.model})</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Original Prompts Diff</h4>
                  <PromptDiffView
                    original={compareDialog.version1.prompt}
                    improved={compareDialog.version2.prompt}
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Improved Prompts Diff</h4>
                  <PromptDiffView
                    original={compareDialog.version1.improvedPrompt}
                    improved={compareDialog.version2.improvedPrompt}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PromptVersionHistory;
