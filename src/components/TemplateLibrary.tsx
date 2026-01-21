import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { promptTemplates, TEMPLATE_CATEGORIES, TemplateCategory, PromptTemplate } from "@/types/templates";
import { Code, Image, FileText, Search, Briefcase, Sparkles, User, Trash2, Plus, Pencil, Copy, Star, Download, Upload, Filter } from "lucide-react";
import { exportTemplates, parseTemplateBackupFile } from "@/lib/templateBackup";
import { useToast } from "@/hooks/use-toast";
import { useCustomTemplates, CustomTemplate } from "@/hooks/useCustomTemplates";
import { useTemplateFavorites } from "@/hooks/useTemplateFavorites";
import CreateTemplateDialog from "./CreateTemplateDialog";
import EditTemplateDialog from "./EditTemplateDialog";
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

const categoryIcons: Record<TemplateCategory | "custom" | "favorites", React.ComponentType<any>> = {
  code: Code,
  image: Image,
  content: FileText,
  research: Search,
  business: Briefcase,
  custom: User,
  favorites: Star,
};

const TemplateLibrary = ({ onSelectTemplate }: TemplateLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all" | "custom" | "favorites">("all");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [duplicateTemplate, setDuplicateTemplate] = useState<{ prompt: string; title: string; description?: string; category: string; tags: string[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { templates: customTemplates, deleteTemplate, isDeleting, createTemplate, isCreating } = useCustomTemplates();
  const { favorites, isFavorite, toggleFavorite, isToggling } = useTemplateFavorites();

  const handleExportTemplates = () => {
    if (customTemplates.length === 0) {
      toast({
        title: "No templates to export",
        description: "Create some custom templates first.",
        variant: "destructive",
      });
      return;
    }
    exportTemplates(customTemplates);
    toast({
      title: "Templates exported!",
      description: `${customTemplates.length} template(s) saved to file.`,
    });
  };

  const handleImportTemplates = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const backupData = await parseTemplateBackupFile(file);
      
      // Import each template
      let importedCount = 0;
      for (const template of backupData.templates) {
        createTemplate({
          title: template.title,
          description: template.description || undefined,
          prompt: template.prompt,
          category: template.category,
          tags: template.tags,
        });
        importedCount++;
      }

      toast({
        title: "Templates imported!",
        description: `${importedCount} template(s) imported successfully.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import templates.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const filteredTemplates = promptTemplates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || selectedCategory === "custom" || template.category === selectedCategory;
    
    // Apply category filter when on "all" tab
    const matchesCategoryFilter = selectedCategory !== "all" || categoryFilter === "all" || template.category === categoryFilter;

    return matchesSearch && matchesCategory && matchesCategoryFilter;
  });

  const filteredCustomTemplates = customTemplates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || selectedCategory === "custom" || template.category === selectedCategory;
    
    // Apply category filter when on "all" tab
    const matchesCategoryFilter = selectedCategory !== "all" || categoryFilter === "all" || template.category === categoryFilter;

    return matchesSearch && matchesCategory && matchesCategoryFilter;
  });

  const getCategoryTemplates = (category: TemplateCategory) => {
    return filteredTemplates.filter((t) => t.category === category);
  };

  // Get favorite templates
  const favoriteBuiltinTemplates = promptTemplates.filter((t) => isFavorite(t.id, "builtin"));
  const favoriteCustomTemplates = customTemplates.filter((t) => isFavorite(t.id, "custom"));

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
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          {selectedCategory === "all" && (
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as TemplateCategory | "all")}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(TEMPLATE_CATEGORIES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <CreateTemplateDialog
          trigger={
            <Button className="bg-brand-600 hover:bg-brand-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          }
        />
        {/* Hidden dialog for duplicating templates */}
        <CreateTemplateDialog
          key={duplicateTemplate?.title}
          initialPrompt={duplicateTemplate?.prompt}
          initialTitle={duplicateTemplate ? `${duplicateTemplate.title} (Copy)` : undefined}
          initialDescription={duplicateTemplate?.description}
          initialCategory={duplicateTemplate?.category}
          initialTags={duplicateTemplate?.tags}
          open={!!duplicateTemplate}
          onOpenChange={(open) => !open && setDuplicateTemplate(null)}
          onSuccess={() => setDuplicateTemplate(null)}
        />
      </div>

      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as TemplateCategory | "all" | "custom" | "favorites")}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="favorites" className="text-xs sm:text-sm">
            <Star className="h-3 w-3 mr-1" />
            Favorites
          </TabsTrigger>
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
          {/* Favorites Section */}
          {(favoriteBuiltinTemplates.length > 0 || favoriteCustomTemplates.length > 0) && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                Favorites
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favoriteBuiltinTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => onSelectTemplate(template.prompt, template.id, template.category)}
                    onDuplicate={() => setDuplicateTemplate({
                      prompt: template.prompt,
                      title: template.title,
                      description: template.description,
                      category: template.category,
                      tags: template.tags,
                    })}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(template.id, "builtin")}
                    isToggling={isToggling}
                  />
                ))}
                {favoriteCustomTemplates.map((template) => (
                  <CustomTemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => onSelectTemplate(template.prompt, template.id, template.category)}
                    onDelete={() => deleteTemplate(template.id)}
                    isDeleting={isDeleting}
                    onDuplicate={() => setDuplicateTemplate({
                      prompt: template.prompt,
                      title: template.title,
                      description: template.description,
                      category: template.category,
                      tags: template.tags,
                    })}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(template.id, "custom")}
                    isToggling={isToggling}
                  />
                ))}
              </div>
            </div>
          )}

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
                    onDuplicate={() => setDuplicateTemplate({
                      prompt: template.prompt,
                      title: template.title,
                      description: template.description,
                      category: template.category,
                      tags: template.tags,
                    })}
                    isFavorite={isFavorite(template.id, "custom")}
                    onToggleFavorite={() => toggleFavorite(template.id, "custom")}
                    isToggling={isToggling}
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
                      onDuplicate={() => setDuplicateTemplate({
                        prompt: template.prompt,
                        title: template.title,
                        description: template.description,
                        category: template.category,
                        tags: template.tags,
                      })}
                      isFavorite={isFavorite(template.id, "builtin")}
                      onToggleFavorite={() => toggleFavorite(template.id, "builtin")}
                      isToggling={isToggling}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Favorite Templates
            </h3>
            {favoriteBuiltinTemplates.length > 0 || favoriteCustomTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favoriteBuiltinTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => onSelectTemplate(template.prompt, template.id, template.category)}
                    onDuplicate={() => setDuplicateTemplate({
                      prompt: template.prompt,
                      title: template.title,
                      description: template.description,
                      category: template.category,
                      tags: template.tags,
                    })}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(template.id, "builtin")}
                    isToggling={isToggling}
                  />
                ))}
                {favoriteCustomTemplates.map((template) => (
                  <CustomTemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => onSelectTemplate(template.prompt, template.id, template.category)}
                    onDelete={() => deleteTemplate(template.id)}
                    isDeleting={isDeleting}
                    onDuplicate={() => setDuplicateTemplate({
                      prompt: template.prompt,
                      title: template.title,
                      description: template.description,
                      category: template.category,
                      tags: template.tags,
                    })}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(template.id, "custom")}
                    isToggling={isToggling}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg border-dashed">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No favorite templates yet.</p>
                <p className="text-sm text-muted-foreground">Click the star icon on any template to add it to your favorites.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Custom Templates Tab */}
        <TabsContent value="custom" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-brand-600" />
                My Templates
              </h3>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportTemplates}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting || isCreating}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTemplates}
                  disabled={customTemplates.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            {filteredCustomTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCustomTemplates.map((template) => (
                  <CustomTemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => onSelectTemplate(template.prompt, template.id, template.category)}
                    onDelete={() => deleteTemplate(template.id)}
                    isDeleting={isDeleting}
                    onDuplicate={() => setDuplicateTemplate({
                      prompt: template.prompt,
                      title: template.title,
                      description: template.description,
                      category: template.category,
                      tags: template.tags,
                    })}
                    isFavorite={isFavorite(template.id, "custom")}
                    onToggleFavorite={() => toggleFavorite(template.id, "custom")}
                    isToggling={isToggling}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg border-dashed">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">You haven't created any templates yet.</p>
                <div className="flex flex-col items-center gap-2">
                  <CreateTemplateDialog />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Or import from file
                  </Button>
                </div>
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
                      onDuplicate={() => setDuplicateTemplate({
                        prompt: template.prompt,
                        title: template.title,
                        description: template.description,
                        category: template.category,
                        tags: template.tags,
                      })}
                      isFavorite={isFavorite(template.id, "builtin")}
                      onToggleFavorite={() => toggleFavorite(template.id, "builtin")}
                      isToggling={isToggling}
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
  onDuplicate: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isToggling: boolean;
}

const TemplateCard = ({ template, onSelect, onDuplicate, isFavorite, onToggleFavorite, isToggling }: TemplateCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg group-hover:text-brand-600 transition-colors">
            {template.title}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              disabled={isToggling}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={`h-4 w-4 ${isFavorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
            </Button>
            <Badge variant="outline" className="ml-1">
              {TEMPLATE_CATEGORIES[template.category].label}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              title="Duplicate as custom template"
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
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
  onDuplicate: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isToggling: boolean;
}

const CustomTemplateCard = ({ template, onSelect, onDelete, isDeleting, onDuplicate, isFavorite, onToggleFavorite, isToggling }: CustomTemplateCardProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const categoryLabel = template.category === "custom" 
    ? "Custom" 
    : TEMPLATE_CATEGORIES[template.category as TemplateCategory]?.label || template.category;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onSelect}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg group-hover:text-brand-600 transition-colors">
              {template.title}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                disabled={isToggling}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className={`h-4 w-4 ${isFavorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
              </Button>
              <Badge variant="outline" className="ml-1">
                {categoryLabel}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                title="Duplicate template"
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditDialogOpen(true);
                }}
                title="Edit template"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
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
      
      <EditTemplateDialog
        template={template}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </>
  );
};

export default TemplateLibrary;
