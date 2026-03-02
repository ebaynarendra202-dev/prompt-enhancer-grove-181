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
    const { prompt, enhancements } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI service not configured');
    }

    const enhancementList = Array.isArray(enhancements) ? enhancements.join(', ') : '';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert prompt engineer. Given a prompt, produce exactly 3 improved variants, each optimized with a different strategy:
1. **Clarity** – maximize readability, remove ambiguity
2. **Detail** – add specificity, context, and depth
3. **Creativity** – make it more engaging, novel, or thought-provoking

${enhancementList ? `Also apply these enhancements: ${enhancementList}` : ''}

Return the result by calling the provided function.`
          },
          { role: 'user', content: `Improve this prompt with 3 variants:\n\n"${prompt}"` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_variants',
              description: 'Return 3 improved prompt variants',
              parameters: {
                type: 'object',
                properties: {
                  variants: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string', description: 'Clarity, Detail, or Creativity' },
                        improvedPrompt: { type: 'string', description: 'The improved prompt text' },
                        tradeoffs: { type: 'string', description: 'Brief explanation of tradeoffs (1-2 sentences)' },
                      },
                      required: ['label', 'improvedPrompt', 'tradeoffs'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['variants'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_variants' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error('AI comparison failed');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No response from AI');

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ variants: result.variants }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ab-compare-prompt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
