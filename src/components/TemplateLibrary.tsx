import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { promptTemplates, TEMPLATE_CATEGORIES, TemplateCategory, PromptTemplate } from "@/types/templates";
import { Code, Image, FileText, Search, Briefcase, Sparkles, User, Trash2, Plus } from "lucide-react";
import { useCustomTemplates, CustomTemplate } from "@/hooks/useCustomTemplates";
import CreateTemplateDialog from "./CreateTemplateDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TemplateLibraryProps {
  onSelectTemplate: (prompt: string, templateId: string, category: string) => void;
}

const categoryIcons: Record<TemplateCategory | "custom", React.ComponentType<any>> = {
  code: Code,
  image: Image,
  content: FileText,
  research: Search,
  business: Briefcase,
  custom: User,
};

const TemplateLibrary = ({ onSelectTemplate }: TemplateLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all" | "custom">("all");
  const { templates: customTemplates, deleteTemplate, isDeleting } = useCustomTemplates();

  const filteredTemplates = promptTemplates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || selectedCategory === "custom" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredCustomTemplates = customTemplates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || selectedCategory === "custom" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryTemplates = (category: TemplateCategory) => {
    return filteredTemplates.filter((t) => t.category === category);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-brand-600" />
          Prompt Template Library
        </h2>
        <p className="text-muted-foreground">
          Choose from pre-made templates or create your own
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <CreateTemplateDialog
          trigger={
            <Button className="bg-brand-600 hover:bg-brand-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          }
        />
      </div>

      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as TemplateCategory | "all" | "custom")}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="custom" className="text-xs sm:text-sm">
            My Templates
          </TabsTrigger>
          {Object.entries(TEMPLATE_CATEGORIES).map(([key, { label }]) => (
            <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
              {label.split(" ")[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          {/* Custom Templates Section */}
          {filteredCustomTemplates.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-brand-600" />
                My Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCustomTemplates.map((template) => (
                  <CustomTemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => onSelectTemplate(template.prompt, template.id, template.category)}
                    onDelete={() => deleteTemplate(template.id)}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Built-in Templates */}
          {Object.entries(TEMPLATE_CATEGORIES).map(([category, { label }]) => {
            const templates = getCategoryTemplates(category as TemplateCategory);
            if (templates.length === 0) return null;

            const Icon = categoryIcons[category as TemplateCategory];

            return (
              <div key={category} className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Icon className="h-5 w-5 text-brand-600" />
                  {label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => onSelectTemplate(template.prompt, template.id, template.category)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* Custom Templates Tab */}
        <TabsContent value="custom" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-brand-600" />
              My Templates
            </h3>
            {filteredCustomTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCustomTemplates.map((template) => (
                  <CustomTemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => onSelectTemplate(template.prompt, template.id, template.category)}
                    onDelete={() => deleteTemplate(template.id)}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg border-dashed">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">You haven't created any templates yet.</p>
                <CreateTemplateDialog />
              </div>
            )}
          </div>
        </TabsContent>

        {Object.entries(TEMPLATE_CATEGORIES).map(([category, { label }]) => {
          const Icon = categoryIcons[category as TemplateCategory];
          return (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Icon className="h-5 w-5 text-brand-600" />
                  {label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getCategoryTemplates(category as TemplateCategory).map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => onSelectTemplate(template.prompt, template.id, template.category)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {filteredTemplates.length === 0 && filteredCustomTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found matching your search.</p>
        </div>
      )}
    </div>
  );
};

interface TemplateCardProps {
  template: PromptTemplate;
  onSelect: () => void;
}

const TemplateCard = ({ template, onSelect }: TemplateCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg group-hover:text-brand-600 transition-colors">
            {template.title}
          </CardTitle>
          <Badge variant="outline" className="ml-2">
            {TEMPLATE_CATEGORIES[template.category].label}
          </Badge>
        </div>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2 italic">
          "{template.prompt}"
        </p>
        <div className="flex flex-wrap gap-1">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <Button
          size="sm"
          className="w-full bg-brand-600 hover:bg-brand-700"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Use Template
        </Button>
      </CardContent>
    </Card>
  );
};

interface CustomTemplateCardProps {
  template: CustomTemplate;
  onSelect: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const CustomTemplateCard = ({ template, onSelect, onDelete, isDeleting }: CustomTemplateCardProps) => {
  const categoryLabel = template.category === "custom" 
    ? "Custom" 
    : TEMPLATE_CATEGORIES[template.category as TemplateCategory]?.label || template.category;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg group-hover:text-brand-600 transition-colors">
            {template.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="ml-2">
              {categoryLabel}
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{template.title}". This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <CardDescription>{template.description || "No description"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2 italic">
          "{template.prompt}"
        </p>
        <div className="flex flex-wrap gap-1">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <Button
          size="sm"
          className="w-full bg-brand-600 hover:bg-brand-700"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Use Template
        </Button>
      </CardContent>
    </Card>
  );
};

export default TemplateLibrary;
