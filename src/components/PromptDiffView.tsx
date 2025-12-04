import { useMemo } from "react";

interface PromptDiffViewProps {
  original: string;
  improved: string;
}

interface DiffSegment {
  type: "unchanged" | "added" | "removed";
  text: string;
}

// Simple word-based diff algorithm
function computeDiff(original: string, improved: string): DiffSegment[] {
  const originalWords = original.split(/(\s+)/);
  const improvedWords = improved.split(/(\s+)/);
  
  const diff: DiffSegment[] = [];
  
  // Create a map of original words for quick lookup
  const originalSet = new Set(originalWords.filter(w => w.trim()));
  const improvedSet = new Set(improvedWords.filter(w => w.trim()));
  
  // LCS-based approach for better diff quality
  const lcs = getLCS(originalWords, improvedWords);
  const lcsSet = new Set(lcs);
  
  let origIdx = 0;
  let impIdx = 0;
  let lcsIdx = 0;
  
  while (origIdx < originalWords.length || impIdx < improvedWords.length) {
    // Handle removed words from original
    while (origIdx < originalWords.length && 
           (lcsIdx >= lcs.length || originalWords[origIdx] !== lcs[lcsIdx])) {
      const word = originalWords[origIdx];
      if (word.trim()) {
        diff.push({ type: "removed", text: word });
      } else {
        // Whitespace - check if we should include it
        if (diff.length > 0 && diff[diff.length - 1].type === "removed") {
          diff.push({ type: "removed", text: word });
        }
      }
      origIdx++;
    }
    
    // Handle added words in improved
    while (impIdx < improvedWords.length && 
           (lcsIdx >= lcs.length || improvedWords[impIdx] !== lcs[lcsIdx])) {
      const word = improvedWords[impIdx];
      if (word.trim()) {
        diff.push({ type: "added", text: word });
      } else {
        // Whitespace
        if (diff.length > 0 && diff[diff.length - 1].type === "added") {
          diff.push({ type: "added", text: word });
        } else {
          diff.push({ type: "unchanged", text: word });
        }
      }
      impIdx++;
    }
    
    // Handle matched words
    if (lcsIdx < lcs.length && 
        origIdx < originalWords.length && 
        impIdx < improvedWords.length &&
        originalWords[origIdx] === lcs[lcsIdx] && 
        improvedWords[impIdx] === lcs[lcsIdx]) {
      diff.push({ type: "unchanged", text: lcs[lcsIdx] });
      origIdx++;
      impIdx++;
      lcsIdx++;
    }
  }
  
  // Merge consecutive segments of the same type
  const merged: DiffSegment[] = [];
  for (const segment of diff) {
    if (merged.length > 0 && merged[merged.length - 1].type === segment.type) {
      merged[merged.length - 1].text += segment.text;
    } else {
      merged.push({ ...segment });
    }
  }
  
  return merged;
}

// Get Longest Common Subsequence
function getLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  
  // For very long texts, use a simplified approach
  if (m * n > 100000) {
    return getSimpleLCS(a, b);
  }
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
}

// Simplified LCS for long texts
function getSimpleLCS(a: string[], b: string[]): string[] {
  const bSet = new Set(b);
  return a.filter(word => bSet.has(word) && word.trim());
}

const PromptDiffView = ({ original, improved }: PromptDiffViewProps) => {
  const diffSegments = useMemo(() => computeDiff(original, improved), [original, improved]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded bg-destructive/20 border border-destructive/40" />
          <span>Removed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded bg-green-500/20 border border-green-500/40" />
          <span>Added</span>
        </div>
      </div>
      
      <div className="relative rounded-lg border border-border bg-card p-4">
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {diffSegments.map((segment, index) => {
            if (segment.type === "removed") {
              return (
                <span
                  key={index}
                  className="bg-destructive/20 text-destructive-foreground line-through decoration-destructive/60"
                >
                  {segment.text}
                </span>
              );
            }
            if (segment.type === "added") {
              return (
                <span
                  key={index}
                  className="bg-green-500/20 text-green-700 dark:text-green-400 font-medium"
                >
                  {segment.text}
                </span>
              );
            }
            return <span key={index}>{segment.text}</span>;
          })}
        </div>
      </div>
    </div>
  );
};

export default PromptDiffView;
