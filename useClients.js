import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Replaces the prototype's `useStoredState("client-roster", SEED_CLIENTS, true)`.
 * Fetches the consultant's client roster from Supabase instead of browser storage,
 * and exposes a `createClient` mutator matching the old `onCreateClient` callback
 * signature used by ClientRoster + NewClientModal.
 */
export function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("clients")
      .select(
        `id, name, location, status, risk_level, created_at, last_activity_at,
         principals ( id, name, role, age, conditions ),
         client_roles ( id, name, role, engagement, location )`
      )
      .order("last_activity_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    // Normalize to the shape the rest of the app expects (camelCase, single `sibling`
    // object rather than an array — most demo clients have at most one).
    const normalized = (data || []).map((c) => ({
      id: c.id,
      name: c.name,
      location: c.location,
      status: c.status,
      riskLevel: c.risk_level,
      principals: c.principals || [],
      sibling: (c.client_roles && c.client_roles[0]) || null,
      createdAt: c.created_at,
      lastActivity: c.last_activity_at,
    }));

    setClients(normalized);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createClient = useCallback(
    async ({ name, location, riskLevel }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error: insertError } = await supabase
        .from("clients")
        .insert({
          name,
          location,
          risk_level: riskLevel,
          status: "onboarding",
          owner_user_id: user.id,
          consultant_user_id: user.id, // the creating consultant is assigned by default
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);
      await refresh();
      return data;
    },
    [refresh]
  );

  return { clients, loading, error, refresh, createClient };
}
