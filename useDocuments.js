import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuditLog } from "./useAuditLog";

const SIMULATED_EXTRACTED_FIELDS = {
  Medicare: { policy_number: "1EG4-TE5-MK72", expiry: "2027-03-01", amount: null },
  "Real Estate": { policy_number: null, expiry: null, amount: 410000 },
  Financial: { policy_number: null, expiry: null, amount: 300000 },
  Medical: { policy_number: null, expiry: null, amount: null },
  Legal: { policy_number: "WI-DPOA-2026-0417", expiry: null, amount: null },
};

const NAMES_BY_CATEGORY = {
  Financial: ["Pension_Statement.pdf", "Bank_Statement_May.pdf"],
  Medical: ["Specialist_Referral.pdf", "Discharge_Summary.pdf"],
  Legal: ["Witness_Affidavit.pdf"],
  "Real Estate": ["Home_Appraisal_2026.pdf"],
  Medicare: ["Medicare_Summary_Notice.pdf"],
};

/**
 * Replaces `useStoredState(\`docs-${client.id}\`, DOCS_SEED[client.id] || [])`.
 *
 * `simulateUpload` keeps the prototype's placeholder OCR-delay behavior (a random
 * filename + a Processing -> Processed transition after ~1.8s) because real OCR
 * extraction is out of scope for this port. To wire real uploads:
 *   1. Use supabase.storage.from('documents').upload(path, file) for the actual file
 *   2. Replace the setTimeout below with a call to your OCR pipeline (LlamaParse/
 *      Textract per the original MRDs), writing results to `extracted_fields`
 *   3. Keep the `status` transition (Processing -> Processed) so the UI doesn't change
 */
export function useDocuments(clientId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logAction } = useAuditLog(clientId);

  const refresh = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", clientId)
      .order("uploaded_at", { ascending: false });

    setDocuments(
      (data || []).map((d) => ({
        id: d.id,
        name: d.name,
        type: d.doc_type,
        status: d.status,
        uploaded: d.uploaded_at?.slice(0, 10),
        extractedFields: d.extracted_fields || SIMULATED_EXTRACTED_FIELDS[d.doc_type] || {},
      }))
    );
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const simulateUpload = useCallback(
    async (category) => {
      const pool = NAMES_BY_CATEGORY[category] || ["Document.pdf"];
      const name = pool[Math.floor(Math.random() * pool.length)];

      const { data: inserted } = await supabase
        .from("documents")
        .insert({
          client_id: clientId,
          name,
          doc_type: category,
          status: "Processing",
        })
        .select()
        .single();

      await refresh();

      setTimeout(async () => {
        await supabase
          .from("documents")
          .update({
            status: "Processed",
            extracted_fields: SIMULATED_EXTRACTED_FIELDS[category] || {},
          })
          .eq("id", inserted.id);
        await logAction(`Uploaded ${name}`);
        await refresh();
      }, 1800);
    },
    [clientId, refresh, logAction]
  );

  const deleteDocument = useCallback(
    async (id) => {
      await supabase.from("documents").delete().eq("id", id);
      await refresh();
    },
    [refresh]
  );

  return { documents, loading, simulateUpload, deleteDocument, refresh };
}
