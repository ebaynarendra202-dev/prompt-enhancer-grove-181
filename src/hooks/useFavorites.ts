import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Favorite {
  id: string;
  user_id: string;
  original_prompt: string;
  improved_prompt: string;
  ai_model: string;
  title: string | null;
  created_at: string;
}

export const useFavorites = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Favorite[];
    },
  });

  const addFavorite = useMutation({
    mutationFn: async ({
      originalPrompt,
      improvedPrompt,
      aiModel,
      title,
    }: {
      originalPrompt: string;
      improvedPrompt: string;
      aiModel: string;
      title?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          original_prompt: originalPrompt,
          improved_prompt: improvedPrompt,
          ai_model: aiModel,
          title: title || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({
        title: "Added to favorites",
        description: "Prompt saved to your favorites",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add to favorites",
        variant: "destructive",
      });
      console.error("Add favorite error:", error);
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({
        title: "Removed from favorites",
        description: "Prompt removed from your favorites",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
      console.error("Remove favorite error:", error);
    },
  });

  return {
    favorites,
    isLoading,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
    isAdding: addFavorite.isPending,
    isRemoving: removeFavorite.isPending,
  };
};
