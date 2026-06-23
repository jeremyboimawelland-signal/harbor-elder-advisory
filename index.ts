// Supabase Edge Function: agent-chat
//
// Replaces the artifact-sandbox-only `fetch("https://api.anthropic.com/v1/messages")`
// call from the original ElderCareDashboard.jsx prototype. That call worked ONLY inside
// the Claude.ai artifact preview, which intercepts that exact URL and injects auth
// invisibly — it will fail with no key (and would be a security hole if a key were
// hardcoded) anywhere else, including in Lovable's preview or in production.
//
// This function holds ANTHROPIC_API_KEY server-side as a Supabase secret and exposes
// a single safe endpoint the frontend calls instead. Deploy with:
//   supabase functions deploy agent-chat
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Request body: { agentKey: "legal" | "healthcare" | "realestate" | "tax" | "socialwork" | "orchestrator",
//                  userText: string, contextNote?: string, isSynthesis?: boolean,
//                  subAgentResponses?: string }
// Response body: { text: string }

import { AGENT_SYSTEM_PROMPTS, ORCHESTRATOR_SYNTHESIS_PROMPT, VALID_AGENT_KEYS } from "./prompts.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL = "claude-sonnet-4-6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // tighten to your deployed domain before going to production
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "ANTHROPIC_API_KEY is not configured on the server. Run: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: {
    agentKey?: string;
    userText?: string;
    contextNote?: string;
    isSynthesis?: boolean;
    subAgentResponses?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { agentKey, userText, contextNote, isSynthesis, subAgentResponses } = body;

  if (!userText || typeof userText !== "string") {
    return new Response(JSON.stringify({ error: "userText is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let systemPrompt: string;
  let userContent: string;

  if (isSynthesis) {
    systemPrompt = ORCHESTRATOR_SYNTHESIS_PROMPT;
    userContent = `Original client question: "${userText}"\n\nSub-agent responses:\n${subAgentResponses ?? ""}`;
  } else {
    if (!agentKey || !VALID_AGENT_KEYS.includes(agentKey as any)) {
      return new Response(
        JSON.stringify({ error: `agentKey must be one of: ${VALID_AGENT_KEYS.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    systemPrompt = AGENT_SYSTEM_PROMPTS[agentKey];
    userContent = contextNote ? `${contextNote}\n\nClient question: ${userText}` : userText;
  }

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!anthropicResponse.ok) {
      let detail = `status ${anthropicResponse.status}`;
      try {
        const errJson = await anthropicResponse.json();
        if (errJson?.error?.message) detail = errJson.error.message;
      } catch {
        // body wasn't JSON — keep the generic status detail
      }
      return new Response(JSON.stringify({ error: detail }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicResponse.json();
    const textBlocks = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text);
    const joined = textBlocks.join("\n").trim();

    return new Response(JSON.stringify({ text: joined || "(No response text returned.)" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (networkErr) {
    return new Response(
      JSON.stringify({ error: `Network error reaching Claude API: ${String(networkErr)}` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
