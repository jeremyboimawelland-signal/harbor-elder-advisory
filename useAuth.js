import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Replaces the prototype's `const [role, setRole] = useState(null)` plus the
 * fake "Continue as Sarah Donnelly" / "Continue as Consultant" buttons in RoleGate.
 *
 * Real auth via Supabase still needs a *role* concept layered on top — Supabase
 * Auth tells you WHO is signed in, not whether they're a client or a consultant.
 * This hook derives that from whether the signed-in user owns/is-assigned-to any
 * `clients` row as consultant_user_id (consultant) vs. owner_user_id (client),
 * falling back to letting the user pick if they're genuinely new (e.g. their first
 * sign-in before a consultant has created their client file yet).
 *
 * Wire up real magic-link or password auth via supabase.auth.signInWithOtp() /
 * signInWithPassword() in the LoginScreen component — this hook only manages the
 * derived role once a session exists.
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null); // 'client' | 'admin' | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setRole(null);
      return;
    }
    (async () => {
      const { data: consultantRows } = await supabase
        .from("clients")
        .select("id")
        .eq("consultant_user_id", session.user.id)
        .limit(1);
      setRole(consultantRows && consultantRows.length > 0 ? "admin" : "client");
    })();
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRole(null);
  }, []);

  /** Demo-only role switch matching the prototype's "Switch role" button in TopBar. */
  const switchRole = useCallback(() => {
    setRole((r) => (r === "admin" ? "client" : "admin"));
  }, []);

  return { session, user: session?.user ?? null, role, loading, signOut, switchRole, setRole };
}
