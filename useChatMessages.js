import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { callAgent, callOrchestratorSynthesis, classifyQuery } from "../lib/agentApi";
import { AGENTS, calculateBurnRate } from "../lib/constants";

/**
 * Replaces the prototype's `useStoredState(\`chat-${client.id}\`, [...])` PLUS the
 * entire `runQuery` function from ChatTab. The biggest behavioral change from the
 * original: agent responses now come from `callAgent()` → the real `agent-chat`
 * Supabase Edge Function instead of a direct (sandbox-only) fetch to Anthropic.
 * Loading states, retry-on-failure, and the orchestrator synthesis step are all
 * preserved from the original UX.
 */
export function useChatMessages(client, financials) {
  const [messages, setMessages] = useState([]);
  const [pendingAgents, setPendingAgents] = useState([]);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const seededWelcome = useRef(false);

  const refresh = useCallback(async () => {
    if (!client?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at");

    const rows = (data || []).map((m) => ({
      id: m.id,
      role: m.role,
      agent: m.agent_key,
      text: m.content,
      synthesis: m.is_synthesis,
      error: m.is_error,
    }));

    if (rows.length === 0 && !seededWelcome.current) {
      seededWelcome.current = true;
      setMessages([
        {
          id: "welcome",
          role: "agent",
          agent: "orchestrator",
          text: `Hi — I'm the Orchestrator for ${client.name}'s file. Ask me anything about the legal, healthcare, real estate, tax, or family side of this situation, and I'll route it to the right specialist(s) and synthesize their answers. Responses come from live Claude calls, so they may take a few seconds.`,
        },
      ]);
    } else {
      setMessages(rows);
    }
    setLoading(false);
  }, [client?.id, client?.name]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persistMessage = useCallback(
    async (msg) => {
      await supabase.from("chat_messages").insert({
        client_id: client.id,
        role: msg.role,
        agent_key: msg.agent ?? null,
        content: msg.text,
        is_synthesis: !!msg.synthesis,
        is_error: !!msg.error,
      });
    },
    [client?.id]
  );

  const buildContextNote = useCallback(() => {
    const { runwayMonths } = calculateBurnRate(
      financials.liquidAssets,
      financials.monthlyIncome,
      financials.monthlyExpenses
    );
    return `Context: Client is ${client.name} in ${client.location}. Household: ${client.principals
      .map(
        (p) =>
          `${p.name} (${p.role}, age ${p.age}${p.conditions?.length ? ", " + p.conditions.join("/") : ""})`
      )
      .join("; ")}. Current liquidity runway is approximately ${
      isFinite(runwayMonths) ? runwayMonths.toFixed(1) + " months" : "stable (income exceeds cost of care)"
    }.`;
  }, [client, financials]);

  const runQuery = useCallback(
    async (queryText) => {
      const agentsHit = classifyQuery(queryText);
      setPendingAgents(agentsHit);
      setLastFailedQuery(null);
      const contextNote = buildContextNote();

      try {
        const subResults = await Promise.all(
          agentsHit.map(async (a) => {
            const text = await callAgent({ agentKey: a, userText: queryText, contextNote });
            return { id: `a${Date.now()}-${a}`, role: "agent", agent: a, text };
          })
        );

        for (const r of subResults) await persistMessage(r);
        setMessages((m) => [...m, ...subResults]);
        setPendingAgents([]);

        if (subResults.length > 0) {
          setPendingAgents(["orchestrator"]);
          const combinedSubText = subResults.map((r) => `${AGENTS[r.agent].label}: ${r.text}`).join("\n\n");
          try {
            const synthesisText = await callOrchestratorSynthesis({
              userText: queryText,
              subAgentResponses: combinedSubText,
            });
            const synthMsg = {
              id: `s${Date.now()}`,
              role: "agent",
              agent: "orchestrator",
              text: synthesisText,
              synthesis: true,
            };
            await persistMessage(synthMsg);
            setMessages((m) => [...m, synthMsg]);
          } catch (synthesisErr) {
            const fallback = {
              id: `s${Date.now()}`,
              role: "agent",
              agent: "orchestrator",
              text: `${AGENTS[agentsHit[0]].label}${
                agentsHit.length > 1 ? ` and ${agentsHit.length - 1} other domain(s)` : ""
              } responded above. (Synthesis step failed: ${synthesisErr.message} — sub-agent answers are still valid.)`,
              synthesis: true,
            };
            await persistMessage(fallback);
            setMessages((m) => [...m, fallback]);
          }
          setPendingAgents([]);
        }
      } catch (e) {
        setPendingAgents([]);
        setLastFailedQuery(queryText);
        const errMsg = {
          id: `err${Date.now()}`,
          role: "agent",
          agent: "orchestrator",
          text: `Something went wrong reaching the agents (${e.message}). Use Retry below, or rephrase your question.`,
          error: true,
        };
        setMessages((m) => [...m, errMsg]);
        // Errors are intentionally NOT persisted to chat_messages — only successful
        // exchanges become permanent history, matching the original's retry-replaces-error UX.
      }
    },
    [buildContextNote, persistMessage]
  );

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || pendingAgents.length > 0) return;
      const userMsg = { id: `u${Date.now()}`, role: "user", text: text.trim() };
      await persistMessage(userMsg);
      setMessages((m) => [...m, userMsg]);
      await runQuery(text.trim());
    },
    [pendingAgents.length, persistMessage, runQuery]
  );

  const retry = useCallback(() => {
    if (!lastFailedQuery) return;
    setMessages((m) => m.filter((msg) => !msg.error));
    runQuery(lastFailedQuery);
  }, [lastFailedQuery, runQuery]);

  return { messages, pendingAgents, lastFailedQuery, loading, sendMessage, retry };
}
