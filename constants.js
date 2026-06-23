import { Sparkles, Scale, HeartPulse, Building2, Calculator, Users } from "lucide-react";

// Ported from the AGENTS object in the original ElderCareDashboard.jsx prototype.
// Colors are kept as hex (not Tailwind classes) since they're used for icon `color`
// props and dynamic inline styles (chat bubble borders), not background utilities.
export const AGENTS = {
  orchestrator: { label: "Orchestrator", color: "#1C2430", icon: Sparkles },
  legal: { label: "Legal & Estate Agent", color: "#4A5C7A", icon: Scale },
  healthcare: { label: "Healthcare Agent", color: "#5C7A6B", icon: HeartPulse },
  realestate: { label: "Real Estate Agent", color: "#8A6D3B", icon: Building2 },
  tax: { label: "Tax & Wealth Agent", color: "#7A5C8A", icon: Calculator },
  socialwork: { label: "Social Work Agent", color: "#B5651D", icon: Users },
};

// Mirrors the platform_config table seeded in 0001_initial_schema.sql.
// The component that displays this (PenaltyCalculator) should prefer fetching the
// live value from Supabase over this constant — this is a sane fallback only.
export const PLATFORM_CONFIG_FALLBACK = {
  daily_penalty_rate: 352.06,
  jurisdiction: "WI",
  effective_year: 2026,
};

export const fmtUSD = (n) =>
  n >= 0
    ? `$${Math.round(n).toLocaleString("en-US")}`
    : `-$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

/**
 * Pure function — ported verbatim from calculateBurnRate() in the prototype.
 * Intentionally has zero dependency on React or Supabase so it can be unit tested
 * in isolation and reused server-side later if you ever want to compute runway
 * in a scheduled job instead of on the client.
 */
export function calculateBurnRate(assets, monthlyIncome, monthlyExpenses) {
  const totalLiquidity = assets.reduce((acc, curr) => acc + curr.value, 0);
  const netBurn = monthlyExpenses - monthlyIncome;
  const runwayMonths = netBurn > 0 ? totalLiquidity / netBurn : Infinity;
  return { runwayMonths, netBurn, totalLiquidity };
}

/** Ported verbatim from calculateCapitalGains() in the prototype's Tax & Wealth tab. */
export function calculateCapitalGains(salePrice, costBasis, isPrimaryResidence = true) {
  const gain = salePrice - costBasis;
  const exclusion = isPrimaryResidence ? 250000 : 0;
  const taxableGain = Math.max(0, gain - exclusion);
  const estimatedTax = taxableGain * 0.15;
  return { taxableGain, estimatedTax };
}

export const CLIENT_TAB_IDS = [
  "overview",
  "legal",
  "healthcare",
  "realestate",
  "tax",
  "family",
  "documents",
  "chat",
];

export const ADMIN_ONLY_TAB_ID = "consultant";
