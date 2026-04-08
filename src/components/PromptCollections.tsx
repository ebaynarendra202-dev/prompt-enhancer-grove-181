import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FolderPlus,
  Folder,
  FolderOpen,
  MoreVertical,
  Trash2,
  Edit,
  Star,
  Clock,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { useCollections, Collection } from "@/hooks/useCollections";
import { useFavorites, Favorite } from "@/hooks/useFavorites";
import { formatDistanceToNow } from "date-fns";

const COLLECTION_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4",
];

interface PromptCollectionsProps {
  onLoadPrompt?: (fav: Favorite) => void;
}

const PromptCollections = ({ onLoadPrompt }: PromptCollectionsProps) => {
  const { collections, createCollection, updateCollection, deleteCollection, moveToCollection, isCreating } = useCollections();
  const { favorites } = useFavorites();

  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState(COLLECTION_COLORS[0]);
  const [editCollection, setEditCollection] = useState<Collection | null>(null);
  const [dragOverCollectionId, setDragOverCollectionId] = useState<string | null>(null);

  const uncategorizedFavorites = favorites.filter((f) => !f.collection_id);
  const activeCollection = activeCollectionId ? collections.find((c) => c.id === activeCollectionId) : null;
  const displayedFavorites = activeCollectionId
    ? favorites.filter((f) => f.collection_id === activeCollectionId)
    : uncategorizedFavorites;

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCollection({ name: newName.trim(), description: newDescription.trim() || undefined, color: newColor });
    setNewName("");
    setNewDescription("");
    setNewColor(COLLECTION_COLORS[0]);
    setCreateOpen(false);
  };

  const handleEdit = () => {
    if (!editCollection || !newName.trim()) return;
    updateCollection({ id: editCollection.id, name: newName.trim(), description: newDescription.trim(), color: newColor });
    setEditOpen(false);
    setEditCollection(null);
  };

  const openEdit = (collection: Collection) => {
    setEditCollection(collection);
    setNewName(collection.name);
    setNewDescription(collection.description || "");
    setNewColor(collection.color);
    setEditOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, favoriteId: string) => {
    e.dataTransfer.setData("favoriteId", favoriteId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, collectionId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCollectionId(collectionId);
  };

  const handleDragLeave = () => {
    setDragOverCollectionId(null);
  };

  const handleDrop = (e: React.DragEvent, collectionId: string | null) => {
    e.preventDefault();
    const favoriteId = e.dataTransfer.getData("favoriteId");
    if (favoriteId) {
      moveToCollection({ favoriteId, collectionId });
    }
    setDragOverCollectionId(null);
  };

  const getCollectionCount = (collectionId: string) =>
    favorites.filter((f) => f.collection_id === collectionId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Collections</h2>
          <p className="text-sm text-muted-foreground">Organize your saved prompts into folders</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <FolderPlus className="h-4 w-4" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Collection name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
              />
              <div>
                <p className="text-sm font-medium mb-2">Color</p>
                <div className="flex gap-2 flex-wrap">
                  {COLLECTION_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newColor === color ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!newName.trim() || isCreating}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collections grid + content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar: collection list */}
        <div className="space-y-2">
          {/* Uncategorized */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
              activeCollectionId === null
                ? "bg-primary/10 border-primary/30"
                : dragOverCollectionId === "uncategorized"
                ? "bg-accent border-accent"
                : "border-transparent hover:bg-muted"
            }`}
            onClick={() => setActiveCollectionId(null)}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            data-collection-id="uncategorized"
          >
            <Inbox className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Uncategorized</p>
            </div>
            <Badge variant="secondary" className="text-xs">{uncategorizedFavorites.length}</Badge>
          </div>

          {collections.map((collection) => (
            <div
              key={collection.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                activeCollectionId === collection.id
                  ? "bg-primary/10 border-primary/30"
                  : dragOverCollectionId === collection.id
                  ? "bg-accent border-accent"
                  : "border-transparent hover:bg-muted"
              }`}
              onClick={() => setActiveCollectionId(collection.id)}
              onDragOver={(e) => handleDragOver(e, collection.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, collection.id)}
            >
              {activeCollectionId === collection.id ? (
                <FolderOpen className="h-5 w-5 shrink-0" style={{ color: collection.color }} />
              ) : (
                <Folder className="h-5 w-5 shrink-0" style={{ color: collection.color }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{collection.name}</p>
              </div>
              <Badge variant="secondary" className="text-xs">{getCollectionCount(collection.id)}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(collection)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteConfirmId(collection.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>

        {/* Content area */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            {activeCollection ? (
              <>
                <Folder className="h-5 w-5" style={{ color: activeCollection.color }} />
                <h3 className="text-lg font-semibold">{activeCollection.name}</h3>
                {activeCollection.description && (
                  <span className="text-sm text-muted-foreground ml-2">— {activeCollection.description}</span>
                )}
              </>
            ) : (
              <>
                <Inbox className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Uncategorized Prompts</h3>
              </>
            )}
          </div>

          {displayedFavorites.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {displayedFavorites.map((fav) => (
                  <Card
                    key={fav.id}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={(e) => handleDragStart(e, fav.id)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="uppercase font-medium">{fav.ai_model}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(fav.created_at), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Move to collection dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => moveToCollection({ favoriteId: fav.id, collectionId: null })}>
                                <Inbox className="h-4 w-4 mr-2" /> Uncategorized
                              </DropdownMenuItem>
                              {collections.map((col) => (
                                <DropdownMenuItem
                                  key={col.id}
                                  onClick={() => moveToCollection({ favoriteId: fav.id, collectionId: col.id })}
                                >
                                  <Folder className="h-4 w-4 mr-2" style={{ color: col.color }} />
                                  {col.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {onLoadPrompt && (
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => onLoadPrompt(fav)}>
                              Load
                            </Button>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Original:</p>
                        <p className="text-sm line-clamp-2">{fav.original_prompt}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-primary mb-1">Improved:</p>
                        <p className="text-sm line-clamp-2 text-muted-foreground">{fav.improved_prompt}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No prompts here yet</p>
              <p className="text-sm mt-1">Drag favorites into this collection or use the arrow button</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Collection name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
            />
            <div>
              <p className="text-sm font-medium mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {COLLECTION_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newColor === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={!newName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the collection. Prompts inside will be moved to Uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) {
                  deleteCollection(deleteConfirmId);
                  if (activeCollectionId === deleteConfirmId) setActiveCollectionId(null);
                }
                setDeleteConfirmId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PromptCollections;
