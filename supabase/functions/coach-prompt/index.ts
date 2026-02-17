import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getTipTypePreferences(): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('coaching_tip_interactions')
      .select('tip_type, action');

    if (error || !data || data.length === 0) return '';

    const stats: Record<string, { applied: number; ignored: number }> = {};
    for (const row of data) {
      if (!stats[row.tip_type]) stats[row.tip_type] = { applied: 0, ignored: 0 };
      if (row.action === 'applied' || row.action === 'applied_all') {
        stats[row.tip_type].applied++;
      } else if (row.action === 'ignored') {
        stats[row.tip_type].ignored++;
      }
    }

    const ranked = Object.entries(stats)
      .map(([type, s]) => {
        const total = s.applied + s.ignored;
        const rate = total > 0 ? Math.round((s.applied / total) * 100) : 50;
        return { type, rate, total };
      })
      .filter(t => t.total >= 3)
      .sort((a, b) => b.rate - a.rate);

    if (ranked.length === 0) return '';

    const lines = ranked.map(r => `- ${r.type}: ${r.rate}% apply rate (${r.total} interactions)`).join('\n');
    return `\n\nUser preference data (prioritize tip types with higher apply rates):\n${lines}`;
  } catch (e) {
    console.error('Failed to fetch tip preferences:', e);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
      return new Response(
        JSON.stringify({ tips: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    console.log('Coaching prompt:', prompt.substring(0, 100) + '...');

    const tipPreferences = await getTipTypePreferences();

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a prompt coaching assistant. Analyze the given prompt and provide 2-4 specific, actionable improvement tips.

Return a JSON object with this structure:
{
  "tips": [
    {
      "type": "clarity" | "specificity" | "context" | "structure" | "constraint" | "example",
      "issue": "<brief issue description, max 10 words>",
      "suggestion": "<specific actionable suggestion, max 25 words>",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Tip types:
- clarity: Grammar, ambiguity, unclear wording
- specificity: Vague terms, missing details
- context: Missing background, audience, or purpose
- structure: Poor organization, missing sections
- constraint: Missing constraints, limits, or requirements
- example: Would benefit from examples or samples

Guidelines:
- Focus on the most impactful improvements
- Be specific - reference actual parts of the prompt
- Prioritize high-impact issues
- If the prompt is already good, return fewer tips or empty array
- Return ONLY valid JSON, no markdown${tipPreferences}`
          },
          {
            role: 'user',
            content: `Analyze this prompt and provide coaching tips: "${prompt}"`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI coaching failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI coaching response:', content);

    let result;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      result = { tips: [] };
    }

    // Validate and sanitize tips
    const validTypes = ['clarity', 'specificity', 'context', 'structure', 'constraint', 'example'];
    const validPriorities = ['high', 'medium', 'low'];
    
    const tips = (result.tips || [])
      .filter((tip: any) => 
        tip && 
        typeof tip.issue === 'string' && 
        typeof tip.suggestion === 'string'
      )
      .map((tip: any) => ({
        type: validTypes.includes(tip.type) ? tip.type : 'clarity',
        issue: tip.issue.slice(0, 100),
        suggestion: tip.suggestion.slice(0, 200),
        priority: validPriorities.includes(tip.priority) ? tip.priority : 'medium',
      }))
      .slice(0, 4);

    console.log('Coaching tips:', tips);

    return new Response(
      JSON.stringify({ tips }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in coach-prompt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
