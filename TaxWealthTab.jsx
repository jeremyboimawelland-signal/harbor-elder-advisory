import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, SectionLabel } from "../ui/Card";
import { GhostButton } from "../ui/Buttons";
import { NumberField, StatTile } from "../ui/DataDisplay";
import { AgentConstitutionCard } from "../ui/AgentConstitutionCard";
import { PenaltyCalculator } from "./PenaltyCalculator";
import { calculateCapitalGains, fmtUSD } from "../../lib/constants";

function StrategyRow({ title, detail }) {
  return (
    <div className="rounded-md bg-paper p-3.5">
      <div className="mb-1 text-[13.5px] font-bold text-ink">{title}</div>
      <div className="text-[12.5px] leading-relaxed text-ink-soft">{detail}</div>
    </div>
  );
}

/** Ported from the prototype's <TaxWealthTab>. */
export function TaxWealthTab({ client, financials }) {
  const [salePrice, setSalePrice] = useState(financials.homeMarketValueEst || 350000);
  const [strategy, setStrategy] = useState("sell_now");

  const { taxableGain, estimatedTax } = useMemo(
    () => calculateCapitalGains(salePrice, financials.costBasisRealEstate),
    [salePrice, financials.costBasisRealEstate]
  );
  const reviewRequired = estimatedTax > 50000;

  const iraRule =
    financials.iraBeneficiaryDesignation === "non_spouse"
      ? "10-Year Rule: account must be fully depleted within 10 years of the original owner's death."
      : financials.iraBeneficiaryDesignation === "spouse"
      ? "Spousal transfer: can be rolled into the surviving spouse's own IRA or treated as a beneficiary IRA."
      : "No beneficiary designation on file yet.";

  return (
    <div className="grid grid-cols-[1.6fr_1fr] gap-5">
      <div className="flex flex-col gap-4">
        <Card>
          <SectionLabel info="Toggle between strategies to compare the tax mechanic — this does not change your actual asset records, only the projection shown here.">
            Sell Now vs. Wait for Step-Up — Strategy Dashboard
          </SectionLabel>
          <div className="mb-4 flex gap-2">
            <GhostButton active={strategy === "sell_now"} onClick={() => setStrategy("sell_now")}>Sell Now</GhostButton>
            <GhostButton active={strategy === "wait"} onClick={() => setStrategy("wait")}>Wait for Step-Up</GhostButton>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3.5">
            <NumberField label="Projected sale price" value={salePrice} onChange={setSalePrice} />
            <NumberField label="Cost basis (on file)" value={financials.costBasisRealEstate} onChange={() => {}} disabled />
          </div>
          <div className="rounded-lg bg-paper p-3.5 text-[13.5px] leading-relaxed text-ink-soft">
            {strategy === "sell_now" ? (
              <>Selling now subjects the estate to capital gains on the difference between sale price and cost basis, less the $250,000 primary-residence exclusion.</>
            ) : (
              <>Waiting until death provides a step-up in basis under Treasury Reg. §1.1014-2, which could eliminate most or all capital gains tax on a future sale — but delays access to liquidity the Burn Rate Engine may need.</>
            )}
          </div>
          <div className="mt-4 flex gap-5 border-t border-paper-line pt-3.5">
            <StatTile label="Taxable Gain" value={fmtUSD(taxableGain)} />
            <StatTile
              label="Est. Tax (15% LTCG)"
              value={fmtUSD(estimatedTax)}
              tone={reviewRequired ? "alert" : undefined}
              info="Simplified long-term capital gains estimate at a flat 15% federal rate. Actual liability depends on income bracket, state tax, and filing status — always confirm with a CPA."
            />
          </div>
          {reviewRequired && (
            <div className="mt-3.5 flex items-start gap-2 rounded-md bg-alert-soft p-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-alert" />
              <span className="text-[12.5px] font-semibold text-alert">
                CPA Review Required — estimated liability exceeds $50,000. This calculation should not be acted on without a qualified CPA or tax attorney.
              </span>
            </div>
          )}
        </Card>

        <Card>
          <SectionLabel>Inherited IRA Rule Checker</SectionLabel>
          <div className="mb-2 text-[13px] text-slate">
            Beneficiary designation on file: <strong className="text-ink">{financials.iraBeneficiaryDesignation || "Not set"}</strong>
          </div>
          <div className="rounded-md bg-paper p-3.5 text-[13.5px] text-ink-soft">{iraRule}</div>
        </Card>

        <Card className="border-copper-soft">
          <SectionLabel>Medicaid Asset Protection Strategies</SectionLabel>
          <div className="flex flex-col gap-3">
            <StrategyRow
              title="Medicaid Asset Protection Trust (MAPT)"
              detail="If funded more than 60 months before a Medicaid application, assets in an irrevocable MAPT are excluded from the look-back penalty and protected from estate recovery."
            />
            <StrategyRow
              title='"Half a Loaf" Strategy'
              detail="Gifts roughly half of excess assets, then uses the remainder to purchase an annuity that pays through the resulting penalty period. Reduces — but does not eliminate — the look-back penalty."
            />
            <div className="mt-1 flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-alert" />
              <span className="text-xs leading-relaxed text-alert">
                Named guard: any gifting strategy must be cross-checked against the Healthcare Agent's look-back flag
                before this Agent recommends it — gifting without a funded plan for the resulting penalty period is the
                single most common costly mistake in Medicaid planning.
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <AgentConstitutionCard
          agent="tax"
          title="Tax & Wealth Agent — Boundaries"
          points={[
            "Not a CPA — every response includes a CPA/tax attorney referral",
            "Flags conflicts between tax-efficient strategies and the 60-month look-back",
            "Explains step-up in basis vs. capital gains for death vs. life sales",
            "Mandatory CPA Review flag above $50,000 estimated liability",
          ]}
        />
        <PenaltyCalculator />
      </div>
    </div>
  );
}
