

# Implementing 5 AI-Powered Features

This plan adds five new AI features to the Prompt Improver application: A/B Comparison, Natural Language to Structured Prompt, Risk & Safety Analysis, Smart Categorization, and Prompt Chaining.

---

## Feature 1: Prompt A/B Comparison

**What it does:** When improving a prompt, generate 2-3 variant improvements with different optimization strategies and display them side-by-side so users can pick the best one.

**Implementation:**

1. **New edge function** `supabase/functions/ab-compare-prompt/index.ts`
   - Accepts the original prompt and enhancements
   - Calls Lovable AI (gemini-3-flash-preview) with instructions to produce 3 variants: one focused on clarity, one on detail, one on creativity
   - Returns an array of `{ label, improvedPrompt, tradeoffs }` objects
   - Uses tool calling to extract structured output

2. **New component** `src/components/PromptABComparison.tsx`
   - Displays variants in a side-by-side card grid (responsive: stacked on mobile)
   - Each card shows the variant label, the improved text, and a brief AI-generated tradeoff note
   - "Use This" button on each card sets it as the improved prompt
   - Loading skeleton state while generating

3. **Integration into PromptImprover**
   - Add an "A/B Compare" button next to the existing "Improve" button
   - When clicked, calls the new edge function and opens the comparison view
   - Selecting a variant populates the improved prompt field as usual

4. **Config update** - Register `ab-compare-prompt` in `supabase/config.toml`

---

## Feature 2: Natural Language to Structured Prompt

**What it does:** Users type a casual description of what they want, and AI converts it into a well-structured, optimized prompt.

**Implementation:**

1. **New edge function** `supabase/functions/structure-prompt/index.ts`
   - Accepts a plain-language description
   - System prompt instructs AI to output a structured prompt with: Role, Task, Context, Format, and Constraints sections
   - Returns `{ structuredPrompt }` 

2. **New component** `src/components/NaturalLanguageInput.tsx`
   - A card/section above the main prompt input with a simpler textarea and "Structure It" button
   - Shows a brief explanation: "Describe what you want in plain language"
   - On success, populates the main prompt textarea so the user can further refine or improve it
   - Collapsible so it doesn't clutter the UI

3. **Integration into PromptImprover**
   - Add as a collapsible section above the prompt textarea
   - When structured prompt is generated, auto-fill the main input

4. **Config update** - Register in `supabase/config.toml`

---

## Feature 3: AI-Powered Risk & Safety Analysis

**What it does:** Analyzes a prompt for potential issues like bias, ambiguity, missing guardrails, and suggests safety improvements.

**Implementation:**

1. **New edge function** `supabase/functions/analyze-safety/index.ts`
   - Accepts a prompt
   - Uses tool calling to return structured output:
     ```
     { 
       overallRisk: "low" | "medium" | "high",
       issues: [{ type, severity, description, suggestion }],
       safetyScore: number 
     }
     ```
   - Categories: bias, ambiguity, missing-guardrails, harmful-output-risk, data-leakage

2. **New component** `src/components/PromptSafetyAnalysis.tsx`
   - Displays overall risk level with a color-coded badge (green/yellow/red)
   - Lists issues as cards with severity icons, descriptions, and suggested fixes
   - "Apply Fix" button on each issue calls a lightweight AI rewrite (reuse `apply-coaching-tip` pattern)
   - Safety score displayed alongside the existing quality score

3. **Integration into PromptImprover**
   - Add a "Safety Check" button (Shield icon) that appears after a prompt is entered
   - Results display below the quality score section

4. **Config update** - Register in `supabase/config.toml`

---

## Feature 4: Smart Prompt Categorization

**What it does:** AI auto-tags and categorizes saved prompts so users can search and organize their prompt library.

**Implementation:**

1. **New edge function** `supabase/functions/categorize-prompt/index.ts`
   - Accepts a prompt text
   - Uses tool calling to return: `{ category, tags: string[], complexity: "simple"|"moderate"|"complex" }`
   - Predefined categories: Writing, Coding, Analysis, Creative, Business, Education, Research, Other

2. **Database migration**
   - Add `category text`, `tags text[]`, and `complexity text` columns to the `prompt_improvements` table (nullable, with defaults)

3. **Update PromptImprover flow**
   - After a successful improvement, call the categorize function in the background
   - Store the results on the `prompt_improvements` record

4. **Update Analytics Dashboard**
   - Add a tag cloud or category breakdown visualization showing the user's prompt patterns

5. **Config update** - Register in `supabase/config.toml`

---

## Feature 5: AI-Powered Prompt Chaining

**What it does:** Users build multi-step prompt workflows where the output of one step feeds into the next. AI suggests how to connect steps.

**Implementation:**

1. **New edge function** `supabase/functions/suggest-chain/index.ts`
   - Accepts an initial prompt and optional existing chain steps
   - Uses tool calling to return: `{ suggestedNextSteps: [{ title, promptTemplate, explanation }] }`

2. **Database migration**
   - New `prompt_chains` table: `id`, `user_id`, `title`, `created_at`, `updated_at`
   - New `prompt_chain_steps` table: `id`, `chain_id`, `step_order`, `prompt_text`, `output_text`, `created_at`
   - RLS policies for user-scoped access on both tables

3. **New component** `src/components/PromptChainBuilder.tsx`
   - Visual step-by-step builder showing connected cards
   - Each step has a prompt textarea, "Run" button, and output display
   - "Suggest Next Step" button calls the edge function
   - Output from step N can be inserted into step N+1's prompt with a variable placeholder
   - Save/load chains from the database

4. **New tab in Index page**
   - Add a third tab "Chains" alongside "Prompt Improver" and "Analytics"
   - Contains the chain builder and a list of saved chains

5. **Config update** - Register in `supabase/config.toml`

---

## Technical Summary

| Item | Type | Details |
|------|------|---------|
| Edge functions | 5 new | `ab-compare-prompt`, `structure-prompt`, `analyze-safety`, `categorize-prompt`, `suggest-chain` |
| Components | 4 new | `PromptABComparison`, `NaturalLanguageInput`, `PromptSafetyAnalysis`, `PromptChainBuilder` |
| DB migrations | 2 | Add columns to `prompt_improvements`; create `prompt_chains` + `prompt_chain_steps` tables |
| Config | 1 update | Register all 5 new functions in `supabase/config.toml` |
| AI model | All use | `google/gemini-3-flash-preview` via Lovable AI gateway |

All edge functions follow the existing pattern: CORS headers, LOVABLE_API_KEY from env, error handling for 429/402 status codes, and `verify_jwt = false` in config.

