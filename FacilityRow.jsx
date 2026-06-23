import { MapPin, AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "../ui/Badge";
import { GhostButton } from "../ui/Buttons";
import { StarRow } from "../ui/DataDisplay";
import { InfoTooltip } from "../ui/InfoTooltip";
import { ListChecks } from "lucide-react";

function RatingMini({ label, value, flagged }) {
  return (
    <div>
      <div className="mb-0.5 text-[11px] text-slate">{label}</div>
      <div className="flex items-center gap-px">
        <StarRow count={value} />
        {flagged && <InfoTooltip text="Low rating — worth raising directly on the tour." width={170} />}
      </div>
    </div>
  );
}

/** Ported from the prototype's <FacilityRow>. */
export function FacilityRow({ f, onTour, selected }) {
  const lowRating = f.healthInspection <= 2;
  return (
    <div className={`rounded-[9px] border p-3.5 ${selected ? "border-copper" : "border-paper-line"}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[14.5px] font-bold text-ink">
            {f.name}
            {f.abuseFlag && (
              <Badge tone="alert"><AlertTriangle size={10} /> Abuse Flag</Badge>
            )}
            {f.sff && (
              <Badge tone="copper"><AlertCircle size={10} /> Special Focus</Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-slate">
            <MapPin size={12} /> {f.address}
          </div>
        </div>
        <GhostButton small icon={ListChecks} onClick={onTour}>Build Tour Huddle</GhostButton>
      </div>
      <div className="mt-3 flex gap-5">
        <RatingMini label="Overall" value={f.overall} />
        <RatingMini label="Health Inspection" value={f.healthInspection} flagged={lowRating && !f.abuseFlag} />
        <RatingMini label="Staffing" value={f.staffing} />
        <RatingMini label="Quality Measures" value={f.qualityMeasures} />
      </div>
    </div>
  );
}
