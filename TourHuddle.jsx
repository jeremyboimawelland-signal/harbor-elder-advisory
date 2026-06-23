import { useMemo } from "react";
import { Card, SectionLabel } from "../ui/Card";
import { useTourChecklist } from "../../hooks/useFacilities";

/** Ported from the prototype's <TourHuddle>, backed by useTourChecklist() (fixes the cross-client leak bug). */
export function TourHuddle({ facility, principals, clientId }) {
  const needs = principals.flatMap((p) => p.conditions || []);

  const questions = useMemo(() => {
    const q = [];
    if (facility.abuseFlag) {
      q.push("Your facility has a harm-level abuse citation on file — can you walk me through what changed in your protocols since then?");
    }
    if (facility.sff) {
      q.push("CMS has flagged this facility for Special Focus monitoring — what is your current corrective action plan and timeline?");
    }
    if (needs.some((n) => n.toLowerCase().includes("dementia"))) {
      q.push("How do you handle medication compliance and wandering risk for residents in the memory care unit?");
    }
    if (needs.some((n) => n.toLowerCase().includes("hospice"))) {
      q.push("How does your facility coordinate with an outside hospice provider for room-and-board vs. medical services billing?");
    }
    q.push("What is your weekend staffing ratio compared to weekdays?");
    q.push("Can residents maintain their own schedule for meals and outings?");
    return q;
  }, [facility, needs]);

  const { checked, setChecked } = useTourChecklist(clientId, facility.id, questions);

  return (
    <Card className="border-copper-soft bg-[#FBF3E7]">
      <SectionLabel>Tour Huddle — {facility.name}</SectionLabel>
      <div className="mb-3 text-[12.5px] text-ink-soft">
        Generated from CMS citations + the household's flagged health needs.
      </div>
      <div className="flex flex-col gap-2.5">
        {questions.map((q, i) => (
          <label key={i} className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={!!checked[i]}
              onChange={() => setChecked({ ...checked, [i]: !checked[i] })}
              className="mt-0.5"
            />
            <span className={`text-[13.5px] leading-relaxed text-ink ${checked[i] ? "opacity-60 line-through" : ""}`}>
              {q}
            </span>
          </label>
        ))}
      </div>
    </Card>
  );
}
