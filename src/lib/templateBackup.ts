import { CustomTemplate } from "@/hooks/useCustomTemplates";

export interface TemplateBackupData {
  version: string;
  exportedAt: string;
  templates: Array<{
    title: string;
    description: string | null;
    prompt: string;
    category: string;
    tags: string[];
  }>;
}

export const exportTemplates = (templates: CustomTemplate[]): void => {
  const backupData: TemplateBackupData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    templates: templates.map((t) => ({
      title: t.title,
      description: t.description,
      prompt: t.prompt,
      category: t.category,
      tags: t.tags,
    })),
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `custom-templates-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const parseTemplateBackupFile = (
  file: File
): Promise<TemplateBackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Validate structure
        if (!data.version || !data.exportedAt || !Array.isArray(data.templates)) {
          throw new Error("Invalid template backup file format");
        }

        // Validate each template has required fields
        for (const template of data.templates) {
          if (!template.title || !template.prompt) {
            throw new Error("Invalid template: missing title or prompt");
          }
        }

        resolve({
          version: data.version,
          exportedAt: data.exportedAt,
          templates: data.templates.map((t: any) => ({
            title: t.title,
            description: t.description || null,
            prompt: t.prompt,
            category: t.category || "custom",
            tags: t.tags || [],
          })),
        });
      } catch (error) {
        reject(new Error("Failed to parse template backup file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};
