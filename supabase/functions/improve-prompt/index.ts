import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model, enhancements } = await req.json();
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    console.log('Improving prompt:', prompt.substring(0, 100) + '...');
    console.log('Selected model:', model);
    console.log('Enhancements:', enhancements);

    // Build enhancement instructions
    const enhancementDescriptions: Record<string, string> = {
      quality: "Ensure professional standards with accurate, reliable, and well-researched information",
      format: "Organize with clear structure, logical flow, and easy-to-scan formatting",
      style: "Use professional yet engaging tone with appropriate language",
      examples: "Include relevant real-world examples and contextual information",
      detail: "Ensure precision in facts and avoid generalizations",
      actionable: "Focus on practical steps and implementable solutions",
    };

    const selectedEnhancementText = enhancements
      .map((e: string) => enhancementDescriptions[e])
      .filter(Boolean)
      .join('\n- ');

    const systemPrompt = `You are an expert prompt engineer. Your task is to improve the given prompt to make it more effective for AI models.

Guidelines for improvement:
- Make the prompt clearer and more specific
- Add context where helpful
- Structure the request logically
- Remove ambiguity
- Keep the original intent intact
${selectedEnhancementText ? `\nThe user wants these enhancements applied:\n- ${selectedEnhancementText}` : ''}

Return ONLY the improved prompt text, nothing else. Do not include explanations or meta-commentary.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Improve this prompt:\n\n"${prompt}"` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI improvement failed');
    }

    const data = await response.json();
    const improvedPrompt = data.choices?.[0]?.message?.content?.trim();
    
    if (!improvedPrompt) {
      throw new Error('No response from AI');
    }

    console.log('Improved prompt generated successfully');

    return new Response(
      JSON.stringify({ improvedPrompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in improve-prompt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
