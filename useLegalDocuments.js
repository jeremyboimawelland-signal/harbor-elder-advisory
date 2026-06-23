import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const STATUS_ORDER = ["Not Started", "Drafted", "Awaiting Signatures", "Executed"];

/** Replaces `useStoredState(\`legal-docs-${client.id}\`, [...])` in LegalTab. */
export function useLegalDocuments(clientId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const { data } = await supabase
      .from("legal_documents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at");

    setDocuments(
      (data || []).map((d) => ({
        id: d.id,
        name: d.name,
        form: d.form_reference,
        status: d.status,
        signers: d.signers || [],
      }))
    );
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Ported from LegalTab's `advance(id)` — steps through STATUS_ORDER by one. */
  const advance = useCallback(
    async (id) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;
      const idx = STATUS_ORDER.indexOf(doc.status);
      const nextStatus = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)];
      await supabase.from("legal_documents").update({ status: nextStatus }).eq("id", id);
      await refresh();
    },
    [documents, refresh]
  );

  return { documents, loading, advance, refresh };
}
