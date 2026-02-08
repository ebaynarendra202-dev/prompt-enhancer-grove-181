import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CoachingTip {
  type: string;
  issue: string;
  suggestion: string;
  priority: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, tips } = await req.json();
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: 'Valid prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tips || !Array.isArray(tips) || tips.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one tip is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    console.log('Applying all coaching tips:', tips.length, 'tips');

    // Format all tips into a single request
    const tipsDescription = tips.map((tip: CoachingTip, index: number) => 
      `${index + 1}. [${tip.type.toUpperCase()}] Issue: ${tip.issue} | Suggestion: ${tip.suggestion}`
    ).join('\n');

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
            content: `You are a prompt improvement assistant. Your task is to rewrite a prompt to address ALL the identified issues at once.

The user will provide:
1. Their original prompt
2. A list of issues and suggestions for improvement

Your job is to rewrite the prompt to address ALL issues while:
- Keeping the original intent and meaning
- Making effective changes that incorporate all suggestions
- Maintaining a natural flow (don't make it sound like a checklist)
- Balancing brevity with completeness

Return ONLY the improved prompt text, nothing else. No explanations, no quotes, no prefixes.`
          },
          {
            role: 'user',
            content: `Original prompt: "${prompt}"

Issues to address:
${tipsDescription}

Please rewrite the prompt to address ALL these issues at once.`
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
      
      throw new Error('AI rewrite failed');
    }

    const data = await response.json();
    const improvedPrompt = data.choices?.[0]?.message?.content?.trim();
    
    if (!improvedPrompt) {
      throw new Error('No response from AI');
    }

    console.log('Improved prompt with all tips:', improvedPrompt.substring(0, 100) + '...');

    return new Response(
      JSON.stringify({ improvedPrompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in apply-all-coaching-tips:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
