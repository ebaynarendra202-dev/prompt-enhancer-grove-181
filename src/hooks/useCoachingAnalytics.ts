import { supabase } from "@/integrations/supabase/client";

interface CoachingTip {
  type: string;
  issue: string;
  suggestion: string;
  priority: string;
}

export const trackTipApplied = async (tip: CoachingTip, promptLength: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from("coaching_tip_interactions").insert({
    user_id: user?.id || null,
    tip_type: tip.type,
    tip_priority: tip.priority,
    action: "applied",
    prompt_length: promptLength,
    tip_issue: tip.issue.slice(0, 200),
    tip_suggestion: tip.suggestion.slice(0, 500),
  });
};

export const trackAllTipsApplied = async (tips: CoachingTip[], promptLength: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const inserts = tips.map(tip => ({
    user_id: user?.id || null,
    tip_type: tip.type,
    tip_priority: tip.priority,
    action: "applied_all" as const,
    prompt_length: promptLength,
    tip_issue: tip.issue.slice(0, 200),
    tip_suggestion: tip.suggestion.slice(0, 500),
  }));
  
  await supabase.from("coaching_tip_interactions").insert(inserts);
};

export const trackTipsIgnored = async (tips: CoachingTip[], promptLength: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const inserts = tips.map(tip => ({
    user_id: user?.id || null,
    tip_type: tip.type,
    tip_priority: tip.priority,
    action: "ignored" as const,
    prompt_length: promptLength,
    tip_issue: tip.issue.slice(0, 200),
    tip_suggestion: tip.suggestion.slice(0, 500),
  }));
  
  await supabase.from("coaching_tip_interactions").insert(inserts);
};
