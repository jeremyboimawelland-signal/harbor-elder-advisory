import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Replaces the static `FACILITIES_SEED` array. Reads from the `facilities` table,
 * which is populated by the CMS Care Compare sync job described in
 * docs/CMS_SYNC_NOTES.md — not by the frontend.
 */
export function useFacilities({ careType = "all", sortBy = "distance" } = {}) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let query = supabase.from("facilities").select("*");
      if (careType !== "all") query = query.eq("care_type", careType);

      const { data } = await query;
      if (cancelled) return;

      let list = (data || []).map((f) => ({
        id: f.id,
        name: f.name,
        address: f.address,
        careType: f.care_type,
        overall: f.overall_rating,
        healthInspection: f.health_inspection_rating,
        staffing: f.staffing_rating,
        qualityMeasures: f.quality_measures_rating,
        abuseFlag: f.abuse_flag,
        sff: f.special_focus_facility,
        latitude: f.latitude,
        longitude: f.longitude,
      }));

      // NOTE: distance sort needs a real distance calc against the client's address —
      // the prototype used a hardcoded distanceMi field. Until geocoding is wired in,
      // "distance" sort falls back to name order; "rating" sort works fully.
      if (sortBy === "rating") {
        list = [...list].sort((a, b) => b.overall - a.overall);
      }

      setFacilities(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [careType, sortBy]);

  return { facilities, loading };
}

/**
 * Replaces `useStoredState(\`tour-${facility.id}\`, {})`, which had the cross-client
 * leak bug noted in the dashboard QA pass (two different clients touring the same
 * facility shared checklist state). Fixed here by the (client_id, facility_id)
 * unique constraint in migration 0001.
 */
export function useTourChecklist(clientId, facilityId, questions) {
  const [checked, setCheckedState] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId || !facilityId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("tour_checklists")
        .select("checked_state")
        .eq("client_id", clientId)
        .eq("facility_id", facilityId)
        .maybeSingle();
      if (!cancelled) {
        setCheckedState(data?.checked_state || {});
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, facilityId]);

  const setChecked = useCallback(
    async (next) => {
      const resolved = typeof next === "function" ? next(checked) : next;
      setCheckedState(resolved);
      await supabase.from("tour_checklists").upsert(
        {
          client_id: clientId,
          facility_id: facilityId,
          questions,
          checked_state: resolved,
        },
        { onConflict: "client_id,facility_id" }
      );
    },
    [clientId, facilityId, questions, checked]
  );

  return { checked, setChecked, loading };
}
