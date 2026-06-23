import { useState } from "react";
import { ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";
import { Card, SectionLabel } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { AgentConstitutionCard } from "../ui/AgentConstitutionCard";
import { FacilityRow } from "./FacilityRow";
import { TourHuddle } from "./TourHuddle";
import { useFacilities } from "../../hooks/useFacilities";

const CARE_TYPES = [
  { id: "all", label: "All types" },
  { id: "memory", label: "Memory care" },
  { id: "assisted", label: "Assisted living" },
  { id: "skilled", label: "Skilled nursing" },
  { id: "hospice", label: "Hospice" },
];

/** Ported from the prototype's <HealthcareTab>, backed by useFacilities() (Supabase) instead of FACILITIES_SEED. */
export function HealthcareTab({ client }) {
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [careFilter, setCareFilter] = useState("all");
  const [sortBy, setSortBy] = useState("distance");
  const { facilities } = useFacilities({ careType: careFilter, sortBy });

  return (
    <div className="grid grid-cols-[1.6fr_1fr] gap-5">
      <div className="flex flex-col gap-4">
        <Card>
          <div className="mb-1 flex items-center justify-between">
            <SectionLabel info="Pulled from CMS Care Compare's public provider-info dataset. Filtered by ZIP and sorted by your chosen criteria below.">
              CMS Care Compare — Facilities Near {client.location}
            </SectionLabel>
            <span className="flex items-center gap-1 text-[11px] text-slate">
              <ShieldCheck size={12} /> No referral fees — independent of facility payments
            </span>
          </div>

          <fieldset className="mb-3 flex flex-wrap items-center gap-2.5 border-0 border-b border-paper-line p-0 py-3">
            <legend className="mb-1.5 w-full p-0 text-[11px] font-bold uppercase tracking-wide text-slate">Care type</legend>
            {CARE_TYPES.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-ink-soft">
                <input type="radio" name="careType" checked={careFilter === c.id} onChange={() => setCareFilter(c.id)} />
                {c.label}
              </label>
            ))}
          </fieldset>

          <div className="mb-3 flex items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate">Sort by</span>
            <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-ink-soft">
              <input type="radio" name="sortBy" checked={sortBy === "distance"} onChange={() => setSortBy("distance")} />
              Closest
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-ink-soft">
              <input type="radio" name="sortBy" checked={sortBy === "rating"} onChange={() => setSortBy("rating")} />
              Highest rated
            </label>
          </div>

          <div className="flex flex-col gap-2.5">
            {facilities.length === 0 && (
              <div className="py-6 text-center text-[13px] text-slate">No facilities match this filter near {client.location}.</div>
            )}
            {facilities.map((f) => (
              <FacilityRow key={f.id} f={f} onTour={() => setSelectedFacility(f)} selected={selectedFacility?.id === f.id} />
            ))}
          </div>
        </Card>

        {selectedFacility && <TourHuddle facility={selectedFacility} principals={client.principals} clientId={client.id} />}
      </div>

      <div className="flex flex-col gap-4">
        <AgentConstitutionCard
          agent="healthcare"
          title="Healthcare Agent — Boundaries"
          points={[
            "Uses CMS data only — never guarantees Medicaid eligibility",
            "Explains the 60-month look-back period mechanics, not outcomes",
            "Never provides medical advice",
            "Always clarifies Medicare Hospice does not cover nursing home room and board",
          ]}
        />
        <Card>
          <SectionLabel>Rating Legend</SectionLabel>
          <div className="flex flex-col gap-2.5 text-[12.5px] text-ink-soft">
            <div className="flex items-start gap-2">
              <Badge tone="alert"><AlertTriangle size={11} /> Abuse Flag</Badge>
              <span>Harm-level abuse citation on most recent survey — health inspection rating capped at 2 stars by CMS methodology. Distinct from a routine low score.</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge tone="copper"><AlertCircle size={11} /> Special Focus Facility</Badge>
              <span>CMS has identified a history of serious, persistent quality issues requiring closer monitoring.</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
