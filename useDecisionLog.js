import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Replaces `useStoredState(\`decisions-${client.id}\`, [...])` in FamilyTab.
 * RLS (see migration 0001, "Write decision log only if can edit client") is what
 * actually enforces the OBSERVER-can't-write rule now — the UI hiding the composer
 * for OBSERVER is a courtesy, not the real boundary, matching the dashboard's stated
 * design intent ("not just disabled — the entry composer is hidden entirely").
 */
export function useDecisionLog(clientId) {
  const [decisionLog, setDecisionLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const { data } = await supabase
      .from("decision_log")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    setDecisionLog(
      (data || []).map((d) => ({
        id: d.id,
        date: d.created_at?.slice(0, 10),
        actor: d.actor_name,
        text: d.entry_text,
      }))
    );
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addDecision = useCallback(
    async (text, actorName) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("decision_log").insert({
        client_id: clientId,
        actor_name: actorName,
        actor_user_id: user?.id ?? null,
        entry_text: text,
      });
      // RLS will reject this with an error for OBSERVER-role users attempting to
      // call this directly (e.g. via devtools) even if the UI never offers the button.
      if (error) throw new Error(error.message);
      await refresh();
    },
    [clientId, refresh]
  );

  return { decisionLog, loading, addDecision, refresh };
}
