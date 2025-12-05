import { Favorite } from "@/hooks/useFavorites";

export interface PromptHistory {
  id: string;
  originalPrompt: string;
  improvedPrompt: string;
  model: string;
  timestamp: number;
}

export interface AppSettings {
  selectedModel: string;
  selectedEnhancements: string[];
}

export interface BackupData {
  version: string;
  exportedAt: string;
  favorites: Favorite[];
  history: PromptHistory[];
  settings: AppSettings;
}

export const exportData = (
  favorites: Favorite[],
  history: PromptHistory[],
  settings: AppSettings
): void => {
  const backupData: BackupData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    favorites,
    history,
    settings,
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `prompt-improver-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const parseBackupFile = (file: File): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate structure
        if (!data.version || !data.exportedAt) {
          throw new Error("Invalid backup file format");
        }
        
        resolve({
          version: data.version,
          exportedAt: data.exportedAt,
          favorites: data.favorites || [],
          history: data.history || [],
          settings: data.settings || {
            selectedModel: "gpt-4",
            selectedEnhancements: [],
          },
        });
      } catch (error) {
        reject(new Error("Failed to parse backup file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};
