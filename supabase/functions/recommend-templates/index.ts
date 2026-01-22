import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type IncomingTemplate = {
  id: string;
  title: string;
  description?: string | null;
  prompt: string;
  category: string;
  tags: string[];
  source: "built_in" | "custom";
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const prompt = body?.prompt;
    const templates = body?.templates as IncomingTemplate[] | undefined;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(templates) || templates.length === 0) {
      return new Response(JSON.stringify({ error: "Templates are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    // Keep payload small: only send what matters for matching.
    const compactTemplates = templates.slice(0, 200).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? "",
      category: t.category,
      tags: Array.isArray(t.tags) ? t.tags.slice(0, 12) : [],
      source: t.source,
      // include prompt because this is a prompt-template library matcher
      prompt: t.prompt,
    }));

    const systemPrompt =
      "You are a template recommender for an AI prompt tool. Given a user's draft prompt and a list of templates, pick the top 3 templates that best match the user's intent. " +
      "Return short, specific reasons focused on why the template helps the user. Do not mention internal scoring. Prefer templates whose prompt structure directly fits the user's request.";

    const gatewayResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({
              prompt: prompt.trim(),
              templates: compactTemplates,
              instructions: {
                topK: 3,
                reasonStyle: "1 sentence, concrete, no fluff",
              },
            }),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_templates",
              description: "Return the top 3 template matches with reasons.",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        templateId: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["templateId", "reason"],
                      additionalProperties: false,
                    },
                    minItems: 3,
                    maxItems: 3,
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend_templates" } },
      }),
    });

    if (!gatewayResp.ok) {
      const errorText = await gatewayResp.text();
      console.error("AI gateway error:", gatewayResp.status, errorText);

      if (gatewayResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (gatewayResp.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Template recommendation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await gatewayResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    let parsed: any = null;

    try {
      parsed = typeof args === "string" ? JSON.parse(args) : null;
    } catch (e) {
      console.error("Failed to parse tool args:", e);
    }

    const recommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];

    // Ensure 3 items at most, and that template IDs exist in input.
    const templateIdSet = new Set(compactTemplates.map((t) => t.id));
    const cleaned = recommendations
      .filter((r: any) => r && typeof r.templateId === "string" && typeof r.reason === "string")
      .filter((r: any) => templateIdSet.has(r.templateId))
      .slice(0, 3);

    return new Response(JSON.stringify({ recommendations: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in recommend-templates:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
