import { FileSignature } from "lucide-react";
import { Card, SectionLabel } from "../ui/Card";
import { GhostButton } from "../ui/Buttons";
import { StatusPill } from "../ui/DataDisplay";
import { AgentConstitutionCard } from "../ui/AgentConstitutionCard";
import { useLegalDocuments } from "../../hooks/useLegalDocuments";

/** Ported from the prototype's <LegalTab>, backed by useLegalDocuments() (Supabase) instead of useStoredState. */
export function LegalTab({ client }) {
  const { documents, advance } = useLegalDocuments(client.id);

  return (
    <div className="grid grid-cols-[1.6fr_1fr] gap-5">
      <div className="flex flex-col gap-4">
        <Card>
          <SectionLabel>Document Assembly — Wisconsin Jurisdiction</SectionLabel>
          <div className="flex flex-col gap-2.5">
            {documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-paper-line p-3.5">
                <div className="flex items-center gap-3">
                  <FileSignature size={18} className="text-slate" />
                  <div>
                    <div className="text-sm font-semibold text-ink">{d.name}</div>
                    <div className="text-xs text-slate">
                      {d.form} · Signing order: {d.signers.join(" → ")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <StatusPill status={d.status} />
                  {d.status !== "Executed" && (
                    <GhostButton small onClick={() => advance(d.id)}>Advance</GhostButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionLabel>Witness Execution Requirements (WI)</SectionLabel>
          <div className="text-[13.5px] leading-relaxed text-ink-soft">
            Wisconsin law requires <strong>two disinterested witnesses</strong> physically present for healthcare POA execution.
            PandaDoc signing order is enforced as: Principal signs first, then both witnesses, then the named Agent. Witnesses
            cannot be the named agent, alternate agent, or a treating healthcare provider.
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <AgentConstitutionCard
          agent="legal"
          title="Legal & Estate Agent — Boundaries"
          points={[
            "Self-help software, not legal representation — never claims to be a licensed attorney",
            "Never provides definitive legal advice or guarantees outcomes",
            "Cites statutes and explains mechanics; grounded strictly in WI Ch. 244 / 155 RAG context",
            "Flags handoffs, e.g. 'Flagging Tax Agent for IRA beneficiary rules'",
          ]}
        />
        <Card>
          <SectionLabel>Data Sources (RAG)</SectionLabel>
          <ul className="m-0 flex flex-col gap-1 pl-4.5 text-[13px] leading-loose text-ink-soft">
            <li>WI Statutes Ch. 244 (Financial POA) &amp; Ch. 155 (Healthcare POA)</li>
            <li>WI Court Form F-00085 (Health Care POA)</li>
            <li>Cornell LII — Title 42 (Medicaid), Title 26 (Taxes)</li>
            <li>NAELA public practice guidelines</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
