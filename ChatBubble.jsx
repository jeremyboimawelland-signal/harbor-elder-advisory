import { AGENTS } from "../../lib/constants";

/** Ported from the prototype's <ChatBubble>. */
export function ChatBubble({ message }) {
  if (message.role === "user") {
    return (
      <div className="max-w-[78%] self-end">
        <div className="rounded-[12px_12px_2px_12px] bg-ink px-3.5 py-2.5 text-[13.5px] leading-relaxed text-paper">
          {message.text}
        </div>
      </div>
    );
  }

  const a = AGENTS[message.agent] || AGENTS.orchestrator;
  const Icon = a.icon;

  return (
    <div className="max-w-[82%] self-start">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon size={13} color={message.error ? "#A4342A" : a.color} />
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: message.error ? "#A4342A" : a.color }}>
          {message.error ? "System" : a.label}
        </span>
      </div>
      <div
        className={`rounded-[2px_12px_12px_12px] border px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink ${
          message.error
            ? "border-alert bg-alert-soft"
            : message.synthesis
            ? "border-copper bg-copper-soft"
            : "border-paper-line bg-paper-card"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}
