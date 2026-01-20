import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TemplateFavorite {
  id: string;
  user_id: string;
  template_id: string;
  template_type: "builtin" | "custom";
  created_at: string;
}

export const useTemplateFavorites = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["template-favorites"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return [];

      const { data, error } = await supabase
        .from("template_favorites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TemplateFavorite[];
    },
  });

  const addFavoriteMutation = useMutation({
    mutationFn: async ({ templateId, templateType }: { templateId: string; templateType: "builtin" | "custom" }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("template_favorites")
        .insert({
          user_id: session.session.user.id,
          template_id: templateId,
          template_type: templateType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-favorites"] });
      toast({
        title: "Added to favorites",
        description: "Template has been added to your favorites.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async ({ templateId, templateType }: { templateId: string; templateType: "builtin" | "custom" }) => {
      const { error } = await supabase
        .from("template_favorites")
        .delete()
        .eq("template_id", templateId)
        .eq("template_type", templateType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-favorites"] });
      toast({
        title: "Removed from favorites",
        description: "Template has been removed from your favorites.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isFavorite = (templateId: string, templateType: "builtin" | "custom") => {
    return favorites.some(
      (fav) => fav.template_id === templateId && fav.template_type === templateType
    );
  };

  const toggleFavorite = (templateId: string, templateType: "builtin" | "custom") => {
    if (isFavorite(templateId, templateType)) {
      removeFavoriteMutation.mutate({ templateId, templateType });
    } else {
      addFavoriteMutation.mutate({ templateId, templateType });
    }
  };

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    isToggling: addFavoriteMutation.isPending || removeFavoriteMutation.isPending,
  };
};
