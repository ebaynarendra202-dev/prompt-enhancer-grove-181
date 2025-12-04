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
    const { prompt } = await req.json();
    
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

    console.log('Analyzing prompt:', prompt.substring(0, 100) + '...');

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
            content: `You are a prompt quality analyzer. Analyze the given prompt and return a JSON object with the following structure:
{
  "score": <number 1-100>,
  "clarity": <number 1-100>,
  "specificity": <number 1-100>,
  "effectiveness": <number 1-100>,
  "feedback": "<brief 1-2 sentence feedback on how to improve the prompt>"
}

Scoring guidelines:
- Clarity (1-100): How clear and understandable is the prompt? Consider grammar, structure, and coherent expression.
- Specificity (1-100): How specific and detailed is the prompt? Vague requests score low, precise instructions score high.
- Effectiveness (1-100): How likely is this prompt to produce the desired result? Consider context, constraints, and expected output format.
- Score: Overall quality score (weighted average with slight emphasis on effectiveness).
- Feedback: Concise, actionable improvement suggestions.

Return ONLY valid JSON, no markdown formatting or extra text.`
          },
          {
            role: 'user',
            content: `Analyze this prompt: "${prompt}"`
          }
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
      
      throw new Error('AI analysis failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response:', content);

    // Parse the JSON response
    let analysis;
    try {
      // Remove any potential markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a fallback response
      analysis = {
        score: 50,
        clarity: 50,
        specificity: 50,
        effectiveness: 50,
        feedback: 'Unable to analyze prompt. Please try again.'
      };
    }

    // Validate and clamp scores
    const clamp = (val: number) => Math.min(100, Math.max(1, Math.round(val || 50)));
    
    const result = {
      score: clamp(analysis.score),
      clarity: clamp(analysis.clarity),
      specificity: clamp(analysis.specificity),
      effectiveness: clamp(analysis.effectiveness),
      feedback: analysis.feedback || 'No specific feedback available.',
    };

    console.log('Analysis result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-prompt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
