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
    const { prompt } = await req.json();

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
            content: `You are a prompt safety and risk analyst. Analyze the given prompt for potential issues across these categories:
- bias: Could lead to biased or discriminatory outputs
- ambiguity: Unclear instructions that could be misinterpreted
- missing-guardrails: Lacks safety constraints or output boundaries
- harmful-output-risk: Could generate harmful, misleading, or inappropriate content
- data-leakage: Could inadvertently expose or request sensitive information

Be thorough but fair. If the prompt is well-crafted, return fewer or no issues. Rate the overall safety score from 0-100 (100 = perfectly safe).

Return your analysis by calling the provided function.`
          },
          { role: 'user', content: `Analyze this prompt for safety risks:\n\n"${prompt}"` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_safety_analysis',
              description: 'Return structured safety analysis',
              parameters: {
                type: 'object',
                properties: {
                  overallRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
                  safetyScore: { type: 'number', description: 'Score from 0-100' },
                  issues: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string', enum: ['bias', 'ambiguity', 'missing-guardrails', 'harmful-output-risk', 'data-leakage'] },
                        severity: { type: 'string', enum: ['low', 'medium', 'high'] },
                        description: { type: 'string', description: 'Brief description of the issue' },
                        suggestion: { type: 'string', description: 'How to fix this issue' },
                      },
                      required: ['type', 'severity', 'description', 'suggestion'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['overallRisk', 'safetyScore', 'issues'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_safety_analysis' } },
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
      throw new Error('AI safety analysis failed');
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
    console.error('Error in analyze-safety:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
