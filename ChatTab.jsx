import { useEffect, useRef, useState } from "react";
import { Send, Loader2, RefreshCw } from "lucide-react";
import { Card, SectionLabel } from "../ui/Card";
import { PrimaryButton } from "../ui/Buttons";
import { ChatBubble } from "./ChatBubble";
import { AGENTS } from "../../lib/constants";
import { useChatMessages } from "../../hooks/useChatMessages";

const SUGGESTIONS = [
  "What happens if we divest $50,000 before applying for Medicaid?",
  "Should we sell the house now or wait?",
  "My brother won't engage — what do I do?",
  "Is the inherited IRA subject to the 10-year rule?",
];

/**
 * Ported from the prototype's <ChatTab>. The behavioral contract (loading states,
 * routing-in-progress indicator, retry-on-failure) is unchanged from the original —
 * only the transport changed, from a direct sandbox-only fetch to useChatMessages()
 * calling the real `agent-chat` Supabase Edge Function.
 */
export function ChatTab({ client, financials }) {
  const { messages, pendingAgents, lastFailedQuery, sendMessage, retry } = useChatMessages(client, financials);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const busy = pendingAgents.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pendingAgents]);

  const send = () => {
    if (!input.trim() || busy) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  return (
    <div className="grid h-[calc(100vh-200px)] grid-cols-[1fr_260px] gap-5">
      <Card padded={false} className="flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-5">
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          {busy && (
            <div className="flex items-center gap-2 pl-1 text-[13px] text-slate">
              <Loader2 size={14} className="animate-spin" />
              {pendingAgents[0] === "orchestrator"
                ? "Synthesizing across agents…"
                : `Calling ${pendingAgents.map((a) => AGENTS[a].label).join(", ")}…`}
            </div>
          )}
          {lastFailedQuery && !busy && (
            <button
              onClick={retry}
              className="flex items-center gap-1.5 self-start rounded-md bg-alert-soft px-3 py-1.5 text-[12.5px] font-semibold text-alert"
            >
              <RefreshCw size={13} /> Retry last question
            </button>
          )}
        </div>
        <div className="flex gap-2.5 border-t border-paper-line p-3.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={busy}
            placeholder={busy ? "Waiting for agents to respond…" : "Ask about legal, healthcare, real estate, tax, or family matters…"}
            className={`flex-1 rounded-lg border border-paper-line px-3.5 py-2.5 text-[13.5px] ${busy ? "bg-paper-line" : "bg-paper"}`}
          />
          <PrimaryButton icon={busy ? Loader2 : Send} onClick={send} disabled={busy}>
            {busy ? "Sending…" : "Send"}
          </PrimaryButton>
        </div>
      </Card>

      <div className="flex flex-col gap-3.5">
        <Card>
          <SectionLabel info="Each domain agent is a separate Claude API call (via the agent-chat Edge Function) with its own system prompt and boundaries — visible in the Legal, Healthcare, Real Estate, Tax, and Family tabs.">
            Domain Agents Online
          </SectionLabel>
          <div className="flex flex-col gap-2.5">
            {Object.entries(AGENTS)
              .filter(([k]) => k !== "orchestrator")
              .map(([k, a]) => {
                const Icon = a.icon;
                const isPending = pendingAgents.includes(k);
                return (
                  <div key={k} className="flex items-center gap-2 text-[12.5px] text-ink-soft">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${isPending ? "animate-pulse bg-copper" : "bg-sage"}`} />
                    <Icon size={14} className="text-slate" />
                    {a.label}
                  </div>
                );
              })}
          </div>
        </Card>
        <Card>
          <SectionLabel>Try asking</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => !busy && setInput(s)}
                className={`rounded-md border border-paper-line bg-paper px-2.5 py-2 text-left text-xs leading-relaxed text-ink-soft ${
                  busy ? "cursor-default opacity-60" : "cursor-pointer"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
