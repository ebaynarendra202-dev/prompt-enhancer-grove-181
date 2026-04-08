import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useCollections = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_collections")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Collection[];
    },
  });

  const createCollection = useMutation({
    mutationFn: async ({ name, description, color }: { name: string; description?: string; color?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("prompt_collections")
        .insert({ user_id: user.id, name, description: description || null, color: color || "#6366f1" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast({ title: "Collection created" });
    },
    onError: () => {
      toast({ title: "Failed to create collection", variant: "destructive" });
    },
  });

  const updateCollection = useMutation({
    mutationFn: async ({ id, name, description, color }: { id: string; name?: string; description?: string; color?: string }) => {
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (color !== undefined) updates.color = color;
      const { error } = await supabase.from("prompt_collections").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
    onError: () => {
      toast({ title: "Failed to update collection", variant: "destructive" });
    },
  });

  const deleteCollection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prompt_collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({ title: "Collection deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete collection", variant: "destructive" });
    },
  });

  const moveToCollection = useMutation({
    mutationFn: async ({ favoriteId, collectionId }: { favoriteId: string; collectionId: string | null }) => {
      const { error } = await supabase
        .from("favorites")
        .update({ collection_id: collectionId })
        .eq("id", favoriteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({ title: "Prompt moved" });
    },
    onError: () => {
      toast({ title: "Failed to move prompt", variant: "destructive" });
    },
  });

  return {
    collections,
    isLoading,
    createCollection: createCollection.mutate,
    updateCollection: updateCollection.mutate,
    deleteCollection: deleteCollection.mutate,
    moveToCollection: moveToCollection.mutate,
    isCreating: createCollection.isPending,
  };
};
