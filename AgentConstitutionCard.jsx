import { AGENTS } from "../../lib/constants";

/** Ported from the prototype's <AgentConstitutionCard> — used by every domain tab. */
export function AgentConstitutionCard({ agent, title, points }) {
  const a = AGENTS[agent];
  const Icon = a.icon;
  return (
    <div className="rounded-[10px] bg-ink p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} color="#D7DCE5" />
        <span className="text-[13px] font-bold uppercase tracking-wide text-[#D7DCE5]">{title}</span>
      </div>
      <ul className="m-0 flex flex-col gap-2 pl-4">
        {points.map((p, i) => (
          <li key={i} className="text-[12.5px] leading-relaxed text-[#AEB7C6]">
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
