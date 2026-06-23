import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Replaces the prototype's broken `const [auditLog] = useStoredState(...)` (no setter —
 * see the bug inventory from the dashboard QA pass). Every write goes through
 * `logAction`, which both inserts the row and refreshes local state, so callers
 * elsewhere (useDocuments, ConsultantTab, LegalTab) can fire-and-forget.
 */
export function useAuditLog(clientId) {
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const { data } = await supabase
      .from("audit_log")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(100);

    setAuditLog(
      (data || []).map((a) => ({
        id: a.id,
        ts: a.created_at?.slice(0, 16).replace("T", " "),
        actor: a.actor_display_name,
        action: a.action,
      }))
    );
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logAction = useCallback(
    async (action) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("audit_log").insert({
        client_id: clientId,
        actor_user_id: user?.id ?? null,
        actor_display_name: user?.user_metadata?.display_name || user?.email || "Unknown user",
        action,
      });
      await refresh();
    },
    [clientId, refresh]
  );

  return { auditLog, loading, logAction, refresh };
}
