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
    const { prompt, existingSteps } = await req.json();

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

    const stepsContext = Array.isArray(existingSteps) && existingSteps.length > 0
      ? `\n\nExisting chain steps:\n${existingSteps.map((s: any, i: number) => `Step ${i + 1}: ${s.prompt_text}`).join('\n')}`
      : '';

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
            content: `You are a prompt chaining expert. Given an initial prompt (and optionally existing chain steps), suggest 2-3 logical next steps that would build on the output.

Each step should use {{previous_output}} as a placeholder for the output of the previous step.

Return your suggestions by calling the provided function.`
          },
          { role: 'user', content: `Suggest next chain steps for this prompt:\n\n"${prompt}"${stepsContext}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_suggestions',
              description: 'Return suggested next chain steps',
              parameters: {
                type: 'object',
                properties: {
                  suggestedNextSteps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Short title for this step' },
                        promptTemplate: { type: 'string', description: 'The prompt template with {{previous_output}} placeholder' },
                        explanation: { type: 'string', description: 'Why this step is useful (1 sentence)' },
                      },
                      required: ['title', 'promptTemplate', 'explanation'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['suggestedNextSteps'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_suggestions' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error('AI chain suggestion failed');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No response from AI');

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in suggest-chain:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
