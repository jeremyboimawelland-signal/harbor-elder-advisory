import { useState } from "react";
import { Search, Plus, MapPin, ChevronRight } from "lucide-react";
import { PrimaryButton } from "../ui/Buttons";
import { Badge } from "../ui/Badge";
import { NewClientModal } from "./NewClientModal";

/** Ported from the prototype's <ClientRoster>, now reading from useClients() (Supabase) instead of a prop array. */
export function ClientRoster({ clients, onSelect, onCreateClient }) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto w-full max-w-[980px] p-7">
      {showModal && <NewClientModal onClose={() => setShowModal(false)} onCreate={onCreateClient} />}

      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="font-display text-2xl text-ink">Client Roster</div>
          <div className="mt-0.5 text-[13px] text-slate">Select a file to proxy into the client's view and work on their behalf.</div>
        </div>
        <PrimaryButton icon={Plus} onClick={() => setShowModal(true)}>New client</PrimaryButton>
      </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients…"
          className="w-full rounded-lg border border-paper-line bg-paper-card py-2.5 pl-9 pr-3.5 text-[13.5px]"
        />
      </div>

      {filtered.length === 0 && (
        <div className="py-10 text-center text-[13.5px] text-slate">No clients match "{search}".</div>
      )}

      <div className="flex flex-col gap-2.5">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className="flex w-full items-center justify-between rounded-xl border border-paper-line bg-paper-card p-4 text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-copper-soft font-display text-base text-copper">
                {c.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <div className="text-[15px] font-bold text-ink">{c.name}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-slate">
                  <MapPin size={11} /> {c.location || "No location set"} · {c.principals.length} principal
                  {c.principals.length === 1 ? "" : "s"} · last activity {c.lastActivity?.slice(0, 10)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Badge tone={c.status === "active" ? "sage" : "gold"}>{c.status}</Badge>
              <Badge tone={c.riskLevel === "High" ? "alert" : c.riskLevel === "Medium" ? "copper" : "neutral"}>
                {c.riskLevel} risk
              </Badge>
              <ChevronRight size={16} className="text-slate" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
