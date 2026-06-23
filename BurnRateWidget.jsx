import { useMemo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, SectionLabel } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { StatTile } from "../ui/DataDisplay";
import { calculateBurnRate, fmtUSD } from "../../lib/constants";

/** Ported from the prototype's <BurnRateWidget> — the platform's core differentiator. */
export function BurnRateWidget({ financials }) {
  const { runwayMonths, netBurn, totalLiquidity } = useMemo(
    () => calculateBurnRate(financials.liquidAssets, financials.monthlyIncome, financials.monthlyExpenses),
    [financials]
  );

  const isUrgent = runwayMonths < 12;
  const isFinite_ = isFinite(runwayMonths);

  const chartData = useMemo(() => {
    const months = isFinite_ ? Math.min(Math.ceil(runwayMonths) + 3, 60) : 24;
    const pts = [];
    let bal = totalLiquidity;
    for (let m = 0; m <= months; m++) {
      pts.push({ month: m, balance: Math.max(0, bal) });
      bal -= netBurn;
    }
    return pts;
  }, [totalLiquidity, netBurn, runwayMonths, isFinite_]);

  const maxBal = Math.max(...chartData.map((p) => p.balance), 1);

  return (
    <Card className={isUrgent ? "border-[1.5px] border-alert" : ""}>
      <div className="mb-4.5 flex items-start justify-between">
        <div>
          <SectionLabel info="Runway = total liquid assets ÷ (monthly cost of care minus monthly income). Edit the numbers below to see this recalculate live.">
            Burn Rate &amp; Liquidity Runway
          </SectionLabel>
          <div className="flex items-baseline gap-2.5">
            <span className={`font-mono text-[40px] font-bold tracking-tight ${isUrgent ? "text-alert" : "text-sage"}`}>
              {isFinite_ ? runwayMonths.toFixed(1) : "∞"}
            </span>
            <span className="text-[15px] text-slate">months of runway</span>
          </div>
        </div>
        {isUrgent && (
          <Badge tone="alert">
            <AlertTriangle size={12} /> Urgent liquidity alert
          </Badge>
        )}
        {!isUrgent && isFinite_ && (
          <Badge tone="sage">
            <CheckCircle2 size={12} /> Within stable range
          </Badge>
        )}
      </div>

      <div className="mb-1.5 flex h-16 items-end gap-0.5">
        {chartData.map((p, i) => (
          <div
            key={i}
            title={`Month ${p.month}: ${fmtUSD(p.balance)}`}
            style={{ height: `${Math.max(2, (p.balance / maxBal) * 100)}%` }}
            className={`min-w-[2px] flex-1 rounded-t-sm ${
              p.month >= Math.floor(runwayMonths) && isFinite_
                ? "bg-alert-soft"
                : isUrgent
                ? "bg-[#D99B82]"
                : "bg-[#A9C4B5]"
            }`}
          />
        ))}
      </div>
      <div className="mb-4.5 flex justify-between text-[11px] text-slate">
        <span>Today</span>
        <span>Projected balance over time →</span>
      </div>

      <div className="flex gap-6 border-t border-paper-line pt-3.5">
        <StatTile label="Liquid Assets" value={fmtUSD(totalLiquidity)} />
        <StatTile label="Monthly Income" value={fmtUSD(financials.monthlyIncome)} />
        <StatTile label="Monthly Cost of Care" value={fmtUSD(financials.monthlyExpenses)} />
        <StatTile
          label="Net Burn / Month"
          value={fmtUSD(netBurn)}
          tone={netBurn > 0 ? "alert" : "sage"}
          info="Monthly cost of care minus monthly income. Positive means assets are being drawn down; negative means income covers costs with room to spare."
        />
      </div>
    </Card>
  );
}
