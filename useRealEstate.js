import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const DEFAULT_CONDITION_FLAGS = { roof: false, hvac: true, plumbing: false, electrical: false, kitchen: true };

const DEFAULT_STEPS = [
  { text: "Consult Medicaid Planner regarding home sale timing", done: true },
  { text: "Get independent CMA (Comparative Market Analysis) from an SRES-credentialed broker", done: false },
  { text: "Walk through and tag items: Keep / Sell / Donate", done: false },
  { text: "Get liquidation value estimate for items tagged Sell", done: false },
  { text: "Schedule estate sale or online auction for unwanted items", done: false },
  { text: "Sort and securely destroy or retain legal/financial papers", done: false },
  { text: "Transfer or cancel utilities ahead of closing", done: false },
];

/** Replaces `useStoredState(\`condition-${client.id}\`, {...})` in RealEstateTab. */
export function useConditionFlags(clientId) {
  const [flags, setFlagsState] = useState(DEFAULT_CONDITION_FLAGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("property_condition_flags")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();

      if (data) {
        setFlagsState({
          roof: data.roof,
          hvac: data.hvac,
          plumbing: data.plumbing,
          electrical: data.electrical,
          kitchen: data.kitchen,
        });
      } else {
        // First visit for this client — seed the row so future upserts have something to match.
        await supabase
          .from("property_condition_flags")
          .insert({ client_id: clientId, ...DEFAULT_CONDITION_FLAGS });
        setFlagsState(DEFAULT_CONDITION_FLAGS);
      }
      setLoading(false);
    })();
  }, [clientId]);

  const setFlags = useCallback(
    async (next) => {
      const resolved = typeof next === "function" ? next(flags) : next;
      setFlagsState(resolved);
      await supabase
        .from("property_condition_flags")
        .upsert({ client_id: clientId, ...resolved }, { onConflict: "client_id" });
    },
    [clientId, flags]
  );

  return { flags, setFlags, loading };
}

/** Replaces `useStoredState(\`inventory-${client.id}\`, [...])` in RealEstateTab. */
export function useDownsizingSteps(clientId) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const { data } = await supabase
      .from("downsizing_steps")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order");

    if (data && data.length > 0) {
      setSteps(data.map((s) => ({ id: s.id, text: s.step_text, done: s.done })));
    } else {
      // First visit — seed the default roadmap from the original prototype.
      const { data: inserted } = await supabase
        .from("downsizing_steps")
        .insert(DEFAULT_STEPS.map((s, i) => ({ client_id: clientId, step_text: s.text, done: s.done, sort_order: i })))
        .select();
      setSteps((inserted || []).map((s) => ({ id: s.id, text: s.step_text, done: s.done })));
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleStep = useCallback(
    async (id) => {
      const step = steps.find((s) => s.id === id);
      if (!step) return;
      setSteps((cur) => cur.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
      await supabase.from("downsizing_steps").update({ done: !step.done }).eq("id", id);
    },
    [steps]
  );

  return { steps, loading, toggleStep };
}
