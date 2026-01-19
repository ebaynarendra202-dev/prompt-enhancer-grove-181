import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CustomTemplate {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  prompt: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  title: string;
  description?: string;
  prompt: string;
  category: string;
  tags: string[];
}

export const useCustomTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["custom-templates"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("custom_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CustomTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("custom_templates")
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description || null,
          prompt: input.prompt,
          category: input.category,
          tags: input.tags,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-templates"] });
      toast({
        title: "Template saved!",
        description: "Your custom template has been created.",
      });
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...input }: CreateTemplateInput & { id: string }) => {
      const { data, error } = await supabase
        .from("custom_templates")
        .update({
          title: input.title,
          description: input.description || null,
          prompt: input.prompt,
          category: input.category,
          tags: input.tags,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-templates"] });
      toast({
        title: "Template updated!",
        description: "Your template has been updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-templates"] });
      toast({
        title: "Template deleted",
        description: "Your template has been removed.",
      });
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    isCreating: createTemplate.isPending,
    isUpdating: updateTemplate.isPending,
    isDeleting: deleteTemplate.isPending,
  };
};
