import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const EMPTY_FINANCIALS = {
  monthlyIncome: 0,
  monthlyExpenses: 0,
  liquidAssets: [],
  costBasisRealEstate: 0,
  homeMarketValueEst: 0,
  iraBeneficiaryDesignation: null,
};

/**
 * Replaces `useStoredState(\`financials-${client.id}\`, FINANCIAL_SEED[client.id] || {...})`.
 * Reads/writes `financial_snapshot` (one row per client) and `liquid_assets`
 * (many rows per client) and merges them into the single `financials` object
 * shape every tab in the prototype expects, so downstream components
 * (BurnRateWidget, AssetEditor, TaxWealthTab, RealEstateTab) need no changes.
 */
export function useFinancials(clientId) {
  const [financials, setFinancialsState] = useState(EMPTY_FINANCIALS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);

    const [{ data: snapshot }, { data: assets }] = await Promise.all([
      supabase.from("financial_snapshot").select("*").eq("client_id", clientId).maybeSingle(),
      supabase.from("liquid_assets").select("*").eq("client_id", clientId).order("sort_order"),
    ]);

    setFinancialsState({
      monthlyIncome: snapshot?.monthly_income ?? 0,
      monthlyExpenses: snapshot?.monthly_expenses ?? 0,
      costBasisRealEstate: snapshot?.cost_basis_real_estate ?? 0,
      homeMarketValueEst: snapshot?.home_market_value_est ?? 0,
      iraBeneficiaryDesignation: snapshot?.ira_beneficiary_designation ?? null,
      liquidAssets: (assets || []).map((a) => ({ id: a.id, label: a.label, value: Number(a.value) })),
    });
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Matches the prototype's `setFinancials(updated)` full-object-replace signature
   * used by AssetEditor's onChange. Diffs against current state to decide which
   * Supabase tables need writing rather than blindly upserting everything.
   */
  const setFinancials = useCallback(
    async (updated) => {
      const next = typeof updated === "function" ? updated(financials) : updated;
      setFinancialsState(next); // optimistic update so the UI feels instant

      await supabase.from("financial_snapshot").upsert(
        {
          client_id: clientId,
          monthly_income: next.monthlyIncome,
          monthly_expenses: next.monthlyExpenses,
          cost_basis_real_estate: next.costBasisRealEstate,
          home_market_value_est: next.homeMarketValueEst,
          ira_beneficiary_designation: next.iraBeneficiaryDesignation,
        },
        { onConflict: "client_id" }
      );

      // Liquid assets: upsert everything with an id already present, insert new ones
      // (ids like `a${Date.now()}` from the old NewAsset flow are not valid uuids,
      // so AssetEditor.jsx generates real ones via crypto.randomUUID() now — see component).
      const existingIds = next.liquidAssets.filter((a) => a.id).map((a) => a.id);
      const { data: currentRows } = await supabase
        .from("liquid_assets")
        .select("id")
        .eq("client_id", clientId);
      const currentIds = (currentRows || []).map((r) => r.id);
      const toDelete = currentIds.filter((id) => !existingIds.includes(id));

      if (toDelete.length > 0) {
        await supabase.from("liquid_assets").delete().in("id", toDelete);
      }

      await supabase.from("liquid_assets").upsert(
        next.liquidAssets.map((a, i) => ({
          id: a.id,
          client_id: clientId,
          label: a.label,
          value: a.value,
          sort_order: i,
        }))
      );
    },
    [clientId, financials]
  );

  return { financials, setFinancials, loading, refresh };
}
