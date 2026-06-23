import { useState } from "react";
import { Info } from "lucide-react";
import { Card, SectionLabel } from "../ui/Card";
import { NumberField } from "../ui/DataDisplay";
import { usePlatformConfig } from "../../hooks/usePlatformConfig";

/**
 * Ported from the prototype's <PenaltyCalculator>, now reading the daily rate from
 * the live `platform_config` table via usePlatformConfig() instead of a hardcoded
 * JS constant — this was flagged in the build plan as a real annual-update risk.
 */
export function PenaltyCalculator() {
  const [amount, setAmount] = useState(50000);
  const { config } = usePlatformConfig();
  const days = Math.floor(amount / config.daily_penalty_rate);
  const months = (days / 30.4).toFixed(1);

  return (
    <Card>
      <SectionLabel>WI Medicaid Penalty Calculator</SectionLabel>
      <div className="mb-3.5 text-[13px] leading-relaxed text-ink-soft">
        Estimates the period of Medicaid ineligibility created by divesting assets within the 60-month look-back window.
      </div>
      <NumberField label="Divested amount" value={amount} onChange={setAmount} />
      <div className="mt-4 flex items-center justify-between rounded-lg bg-alert-soft p-3.5">
        <div>
          <div className="text-xs font-semibold text-alert">Days of ineligibility</div>
          <div className="font-mono text-[28px] font-bold text-alert">{days.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-alert">≈ {months} months</div>
          <div className="text-[11px] text-alert opacity-80">
            Rate: ${config.daily_penalty_rate}/day · {config.jurisdiction} {config.effective_year}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex gap-1.5 text-[11.5px] text-slate">
        <Info size={13} className="mt-0.5 shrink-0" />
        Informational estimate only — confirm with the Tax &amp; Wealth Agent before acting, and consult a CPA or elder law attorney for filings.
      </div>
    </Card>
  );
}
