import { supabase } from "./supabaseClient";

/**
 * Calls the `agent-chat` Supabase Edge Function, which holds the Anthropic API key
 * server-side. This is the direct replacement for the prototype's `callClaude()`,
 * which called `fetch("https://api.anthropic.com/v1/messages")` directly — that
 * pattern only works inside the Claude.ai artifact sandbox and will not function
 * in Lovable or in production.
 *
 * Throws on any failure so callers can show an inline error + retry, matching the
 * original prototype's UX.
 */
export async function callAgent({ agentKey, userText, contextNote }) {
  const { data, error } = await supabase.functions.invoke("agent-chat", {
    body: { agentKey, userText, contextNote },
  });

  if (error) {
    throw new Error(error.message || "Failed to reach the agent");
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data.text;
}

/**
 * Calls the orchestrator's synthesis step once one or more domain agents have
 * already responded. Mirrors the `isSynthesis` branch in the edge function.
 */
export async function callOrchestratorSynthesis({ userText, subAgentResponses }) {
  const { data, error } = await supabase.functions.invoke("agent-chat", {
    body: { isSynthesis: true, userText, subAgentResponses },
  });

  if (error) {
    throw new Error(error.message || "Failed to reach the orchestrator");
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data.text;
}

/**
 * Keyword-based router — ported verbatim from `classifyQuery()` in the prototype.
 * Cheap, deterministic, and runs entirely client-side before any API call is made.
 */
export function classifyQuery(text) {
  const t = text.toLowerCase();
  const hits = [];
  if (/(poa|power of attorney|will|trust|probate|guardian|hipaa|witness)/.test(t)) hits.push("legal");
  if (/(medicaid|medicare|facility|nursing|hospice|cms|rating|memory care|dementia care)/.test(t)) hits.push("healthcare");
  if (/(home|house|sell|downsiz|real estate|cma|property|equity)/.test(t)) hits.push("realestate");
  if (/(tax|capital gain|ira|basis|cpa|trust fund|gift|penalty|step-up|step up)/.test(t)) hits.push("tax");
  if (/(brother|sister|sibling|family|conflict|argue|mediat|conference)/.test(t)) hits.push("socialwork");
  if (hits.length === 0) hits.push("legal", "healthcare");
  return [...new Set(hits)];
}
