import { useState } from "react";
import { Plus, Download, Clock } from "lucide-react";
import { Card, SectionLabel } from "../ui/Card";
import { GhostButton } from "../ui/Buttons";
import { useConsultantNotes } from "../../hooks/useConsultantNotes";
import { useAuditLog } from "../../hooks/useAuditLog";

function BriefRow({ label, value, highlight }) {
  return (
    <div className="mb-2 flex gap-2.5">
      <span className="min-w-[140px] text-xs font-bold text-ink">{label}</span>
      <span className={highlight ? "font-bold text-alert" : "text-ink-soft"}>{value}</span>
    </div>
  );
}

/** Ported from the prototype's <ConsultantTab>, backed by Supabase hooks. Admin-only — never reachable in client role. */
export function ConsultantTab({ client }) {
  const { notes, addNote } = useConsultantNotes(client.id);
  const { auditLog, logAction } = useAuditLog(client.id);
  const [draft, setDraft] = useState("");

  const handleAddNote = async () => {
    if (!draft.trim()) return;
    await addNote(draft);
    setDraft("");
  };

  const exportBrief = async () => {
    const lines = [
      "ATTORNEY HANDOFF BRIEF",
      `Client: ${client.name}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `Family Conflict Risk: ${client.riskLevel}`,
      "Stated Goals: Emergency incapacity planning, Real estate liquidation, Medicaid asset protection",
      "Completed Drafts: WI DPOA (drafted), Healthcare Proxy (awaiting signatures)",
      "Action Items: Assess capacity and execute drafts; Advise on MAPT vs. revocable trust for home sale; Fiduciary shielding advice",
      "",
      "Principals:",
      ...client.principals.map((p) => `  - ${p.name} (${p.role}, age ${p.age}): ${(p.conditions || []).join(", ") || "No flagged conditions"}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${client.name.replace(/\s+/g, "_")}_Attorney_Brief.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    await logAction("Exported attorney handoff brief");
  };

  return (
    <div className="grid grid-cols-[1.6fr_1fr] gap-5">
      <div className="flex flex-col gap-4">
        <Card>
          <SectionLabel info="Visible only to consultants — never surfaced in the client-facing view, even when proxying. Enforced by RLS on the consultant_notes table, not just hidden in the UI.">
            Internal Consultant Notes — Not Visible to Client
          </SectionLabel>
          <div className="mb-3.5 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              placeholder="Add an internal note about this file…"
              className="flex-1 rounded-md border border-paper-line bg-paper px-3 py-2 text-[13px]"
            />
            <GhostButton small icon={Plus} onClick={handleAddNote}>Add</GhostButton>
          </div>
          <div className="flex flex-col gap-2.5">
            {notes.map((n) => (
              <div key={n.id} className="rounded-lg bg-[#FBF3E7] p-3.5">
                <div className="mb-1 flex justify-between">
                  <span className="text-xs font-bold text-copper">{n.author}</span>
                  <span className="text-[11px] text-slate">{n.date}</span>
                </div>
                <div className="text-[13px] leading-relaxed text-ink-soft">{n.text}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionLabel>Attorney Handoff Brief</SectionLabel>
          <div className="text-[13px] leading-relaxed text-ink-soft">
            <BriefRow label="Client" value={client.name} />
            <BriefRow label="Family Conflict Risk" value={client.riskLevel} highlight={client.riskLevel === "High"} />
            <BriefRow label="Stated Goals" value="Emergency incapacity planning · Real estate liquidation · Medicaid asset protection" />
            <BriefRow label="Completed Drafts" value="WI DPOA (drafted), Healthcare Proxy (awaiting signatures)" />
            <BriefRow label="Action Items" value="Assess capacity and execute drafts · Advise on MAPT vs. revocable trust for home sale · Fiduciary shielding advice" />
          </div>
          <div className="mt-3.5">
            <GhostButton small icon={Download} onClick={exportBrief}>Export brief (.txt)</GhostButton>
          </div>
        </Card>
      </div>

      <Card>
        <SectionLabel>Audit Log</SectionLabel>
        <div className="flex max-h-[440px] flex-col gap-3 overflow-y-auto">
          {auditLog.map((a) => (
            <div key={a.id} className="flex gap-2.5 text-[12.5px]">
              <Clock size={13} className="mt-0.5 shrink-0 text-slate" />
              <div>
                <div className="font-semibold text-ink">{a.action}</div>
                <div className="text-[11.5px] text-slate">{a.actor} · {a.ts}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
