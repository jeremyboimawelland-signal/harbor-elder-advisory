import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuditLog } from "./useAuditLog";

/**
 * Replaces `useStoredState(\`notes-${client.id}\`, [...])` in ConsultantTab.
 * RLS restricts both read and write to the assigned consultant (see migration 0001,
 * "Only assigned consultant can read/write notes") — this is the table that must
 * NEVER be reachable from the client-facing role, by design from the original spec.
 */
export function useConsultantNotes(clientId) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logAction } = useAuditLog(clientId);

  const refresh = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("consultant_notes")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    // A non-consultant calling this will get an empty array back (RLS denies the
    // select silently) rather than an error — that's expected Postgres RLS behavior.
    if (!error) {
      setNotes(
        (data || []).map((n) => ({
          id: n.id,
          date: n.created_at?.slice(0, 10),
          author: n.author_display_name,
          text: n.note_text,
        }))
      );
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addNote = useCallback(
    async (text) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("consultant_notes").insert({
        client_id: clientId,
        author_user_id: user.id,
        author_display_name: user.user_metadata?.display_name || user.email,
        note_text: text,
      });
      if (error) throw new Error(error.message);
      await logAction("Added consultant note");
      await refresh();
    },
    [clientId, refresh, logAction]
  );

  return { notes, loading, addNote, refresh };
}
