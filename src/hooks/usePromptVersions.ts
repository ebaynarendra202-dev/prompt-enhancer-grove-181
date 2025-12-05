import { useState, useEffect } from "react";

export interface PromptVersion {
  id: string;
  prompt: string;
  improvedPrompt: string;
  model: string;
  timestamp: number;
  versionNumber: number;
}

export interface PromptVersionGroup {
  id: string;
  basePrompt: string;
  versions: PromptVersion[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "promptVersionGroups";
const MAX_GROUPS = 20;
const SIMILARITY_THRESHOLD = 0.3;

// Simple similarity check based on common words
const calculateSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return intersection / union;
};

export const usePromptVersions = () => {
  const [versionGroups, setVersionGroups] = useState<PromptVersionGroup[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setVersionGroups(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load version groups:", error);
    }
  }, []);

  // Save to localStorage
  const saveGroups = (groups: PromptVersionGroup[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    } catch (error) {
      console.error("Failed to save version groups:", error);
    }
  };

  const addVersion = (originalPrompt: string, improvedPrompt: string, model: string) => {
    const now = Date.now();
    
    setVersionGroups(prev => {
      // Find existing group with similar base prompt
      let matchedGroupIndex = -1;
      let highestSimilarity = 0;
      
      prev.forEach((group, index) => {
        const similarity = calculateSimilarity(originalPrompt, group.basePrompt);
        if (similarity > SIMILARITY_THRESHOLD && similarity > highestSimilarity) {
          highestSimilarity = similarity;
          matchedGroupIndex = index;
        }
      });

      let updatedGroups: PromptVersionGroup[];

      if (matchedGroupIndex >= 0) {
        // Add to existing group
        updatedGroups = prev.map((group, index) => {
          if (index === matchedGroupIndex) {
            const newVersion: PromptVersion = {
              id: now.toString(),
              prompt: originalPrompt,
              improvedPrompt,
              model,
              timestamp: now,
              versionNumber: group.versions.length + 1,
            };
            return {
              ...group,
              versions: [...group.versions, newVersion],
              updatedAt: now,
            };
          }
          return group;
        });
      } else {
        // Create new group
        const newGroup: PromptVersionGroup = {
          id: now.toString(),
          basePrompt: originalPrompt,
          versions: [{
            id: now.toString(),
            prompt: originalPrompt,
            improvedPrompt,
            model,
            timestamp: now,
            versionNumber: 1,
          }],
          createdAt: now,
          updatedAt: now,
        };
        updatedGroups = [newGroup, ...prev].slice(0, MAX_GROUPS);
      }

      // Sort by most recently updated
      updatedGroups.sort((a, b) => b.updatedAt - a.updatedAt);
      
      saveGroups(updatedGroups);
      return updatedGroups;
    });
  };

  const deleteGroup = (groupId: string) => {
    setVersionGroups(prev => {
      const updated = prev.filter(g => g.id !== groupId);
      saveGroups(updated);
      return updated;
    });
  };

  const deleteVersion = (groupId: string, versionId: string) => {
    setVersionGroups(prev => {
      const updated = prev.map(group => {
        if (group.id === groupId) {
          const filteredVersions = group.versions.filter(v => v.id !== versionId);
          if (filteredVersions.length === 0) {
            return null;
          }
          return { ...group, versions: filteredVersions };
        }
        return group;
      }).filter(Boolean) as PromptVersionGroup[];
      
      saveGroups(updated);
      return updated;
    });
  };

  const clearAllVersions = () => {
    setVersionGroups([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    versionGroups,
    addVersion,
    deleteGroup,
    deleteVersion,
    clearAllVersions,
  };
};
