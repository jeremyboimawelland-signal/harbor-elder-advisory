import { ShieldCheck, AlertTriangle } from "lucide-react";
import { Card, SectionLabel } from "../ui/Card";
import { StatTile } from "../ui/DataDisplay";
import { AgentConstitutionCard } from "../ui/AgentConstitutionCard";
import { fmtUSD } from "../../lib/constants";
import { useConditionFlags, useDownsizingSteps } from "../../hooks/useRealEstate";

const CONDITION_LABELS = { roof: "roof", hvac: "HVAC", plumbing: "plumbing", electrical: "electrical", kitchen: "kitchen" };

/** Ported from the prototype's <RealEstateTab>, backed by Supabase hooks instead of useStoredState. */
export function RealEstateTab({ client, financials }) {
  const { flags: conditionFlags, setFlags: setConditionFlags } = useConditionFlags(client.id);
  const { steps: inventorySteps, toggleStep } = useDownsizingSteps(client.id);

  const repairFlagCount = Object.values(conditionFlags).filter(Boolean).length;
  const estRepairCost = repairFlagCount * 4200;
  const netEstimate = (financials.homeMarketValueEst || 0) - estRepairCost;

  return (
    <div className="grid grid-cols-[1.6fr_1fr] gap-5">
      <div className="flex flex-col gap-4">
        <Card>
          <SectionLabel info="Each flagged item adds an estimated repair cost ($4,200 placeholder per item in this demo) subtracted from the market value estimate below.">
            Pre-Sale Property Condition Audit
          </SectionLabel>
          <div className="mb-3.5 text-[12.5px] text-ink-soft">
            Flag known issues before listing — small repairs often return more in sale price than their cost, while big
            remodels rarely pencil out for a downsizing sale.
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(conditionFlags).map((key) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md border border-paper-line px-3 py-2 text-[13px] capitalize text-ink-soft">
                <input
                  type="checkbox"
                  checked={conditionFlags[key]}
                  onChange={() => setConditionFlags({ ...conditionFlags, [key]: !conditionFlags[key] })}
                />
                {CONDITION_LABELS[key]}
              </label>
            ))}
          </div>
          {financials.homeMarketValueEst > 0 && (
            <div className="mt-4 flex gap-5 border-t border-paper-line pt-3.5">
              <StatTile label="Est. Market Value" value={fmtUSD(financials.homeMarketValueEst)} />
              <StatTile label="Flagged Repairs" value={fmtUSD(estRepairCost)} tone="alert" />
              <StatTile label="Net Est. Before Sale Costs" value={fmtUSD(netEstimate)} tone="sage" />
            </div>
          )}
        </Card>

        <Card>
          <SectionLabel>Downsizing Action Plan</SectionLabel>
          <div className="flex flex-col gap-2.5">
            {inventorySteps.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-start gap-2.5">
                <input type="checkbox" checked={s.done} onChange={() => toggleStep(s.id)} className="mt-0.5" />
                <span className={`text-[13.5px] text-ink ${s.done ? "opacity-55 line-through" : ""}`}>{s.text}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <AgentConstitutionCard
          agent="realestate"
          title="Real Estate Agent — Boundaries"
          points={[
            "Evaluates every sale against the Medicaid 60-month look-back",
            "Calculates IRS Pub 523 tax impact: sell now vs. hold for step-up",
            "Provides a Logistical Roadmap alongside financial data",
            "Always recommends an independent CMA from a licensed, SRES-credentialed broker",
          ]}
        />
        <Card className="border-transparent bg-sage-soft">
          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-sage" />
            <div className="text-[12.5px] leading-relaxed text-[#3D5A48]">
              Valuations shown are estimates only. A Comparative Market Analysis from a local, independently licensed
              broker is required before any listing decision.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
