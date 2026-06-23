import { Users } from "lucide-react";
import { Card, SectionLabel } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ProgressDot } from "../ui/DataDisplay";
import { BurnRateWidget } from "./BurnRateWidget";
import { AssetEditor } from "./AssetEditor";

const ROADMAP_PHASES = [
  { label: "Intake & Stabilization", done: true, detail: "Profile, OCR vault, document gathering" },
  { label: "Financial Runway", done: true, detail: "Burn Rate Engine calculating months of coverage" },
  { label: "Legal & Compliance", done: false, detail: "WI-compliant POA + Healthcare Proxy execution" },
  { label: "Facility & Advocacy", done: false, detail: "CMS-informed tour checklist and facility shortlist" },
  { label: "Wealth & Exit", done: false, detail: "Basis step-up strategy and property sale analysis" },
];

function RoadmapList() {
  return (
    <div className="flex flex-col gap-3.5">
      {ROADMAP_PHASES.map((p, i) => (
        <div key={p.label} className="flex gap-3">
          <ProgressDot done={p.done} />
          <div>
            <div className={`text-[13.5px] font-semibold ${p.done ? "text-slate line-through" : "text-ink"}`}>
              Phase {i + 1}: {p.label}
            </div>
            <div className="text-[12.5px] text-slate">{p.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Ported from the prototype's <OverviewTab>. */
export function OverviewTab({ client, financials, setFinancials }) {
  return (
    <div className="grid grid-cols-[1.6fr_1fr] gap-5">
      <div className="flex flex-col gap-5">
        <BurnRateWidget financials={financials} />
        <Card>
          <SectionLabel>Strategic Roadmap</SectionLabel>
          <RoadmapList />
        </Card>
      </div>
      <div className="flex flex-col gap-5">
        <Card>
          <SectionLabel>Household</SectionLabel>
          {client.principals.map((p) => (
            <div key={p.id} className="mb-3 border-b border-paper-line pb-3 last:mb-0 last:border-0 last:pb-0">
              <div className="text-sm font-bold text-ink">
                {p.name} <span className="font-normal text-slate">· {p.role}, {p.age}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {!p.conditions || p.conditions.length === 0 ? (
                  <span className="text-xs text-slate">No flagged conditions</span>
                ) : (
                  p.conditions.map((c) => <Badge key={c} tone="copper">{c}</Badge>)
                )}
              </div>
            </div>
          ))}
          {client.sibling && (
            <div className="flex items-center gap-1.5 text-[13px] text-ink-soft">
              <Users size={14} className="text-slate" />
              {client.sibling.name} — <Badge>{client.sibling.role}</Badge>
              <span className="text-slate">({client.sibling.engagement} engagement)</span>
            </div>
          )}
        </Card>
        <AssetEditor financials={financials} onChange={setFinancials} />
      </div>
    </div>
  );
}
