import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, tip } = await req.json();
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: 'Valid prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tip || !tip.type || !tip.issue || !tip.suggestion) {
      return new Response(
        JSON.stringify({ error: 'Valid tip is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    console.log('Applying coaching tip:', tip.type, '-', tip.issue);

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
            content: `You are a prompt improvement assistant. Your task is to rewrite a prompt to address a specific issue.

The user will provide:
1. Their original prompt
2. An issue identified in their prompt
3. A suggestion for how to improve it

Your job is to rewrite the prompt to address the issue while:
- Keeping the original intent and meaning
- Making minimal but effective changes
- Incorporating the suggestion naturally
- Maintaining a similar length (don't over-expand unless necessary)

Return ONLY the improved prompt text, nothing else. No explanations, no quotes, no prefixes.`
          },
          {
            role: 'user',
            content: `Original prompt: "${prompt}"

Issue: ${tip.issue}
Suggestion: ${tip.suggestion}
Issue type: ${tip.type}

Please rewrite the prompt to address this issue.`
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

    console.log('Improved prompt:', improvedPrompt.substring(0, 100) + '...');

    return new Response(
      JSON.stringify({ improvedPrompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in apply-coaching-tip:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
