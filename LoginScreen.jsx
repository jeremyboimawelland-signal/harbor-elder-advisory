import { useState } from "react";
import { ChevronRight, Home, UserCog } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

/**
 * Replaces the prototype's <RoleGate>, which had two buttons that hardcoded
 * "Continue as Sarah Donnelly" / "Continue as Consultant" with no real auth.
 * This uses Supabase magic-link auth — the actual role (client vs. admin) is
 * derived afterward by useAuth() based on the signed-in user's relationship to
 * rows in the `clients` table, not chosen at the login screen.
 *
 * Keeping the same two-tile visual layout from the original for continuity with
 * the approved design, but both tiles now lead to the same real sign-in flow —
 * the labels exist to set expectations, not to fork behavior.
 */
export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const sendMagicLink = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setSending(false);
    if (signInError) {
      setError(signInError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-6 font-body">
      <div className="w-full max-w-[440px]">
        <div className="mb-9 text-center">
          <div className="mb-2 font-display text-[30px] tracking-tight text-paper">Harbor Elder Advisory</div>
          <div className="text-sm text-[#9AA5B5]">Multi-agent care, legal, and financial planning</div>
        </div>

        <div className="mb-6 flex justify-center gap-3 text-[13px] text-[#9AA5B5]">
          <span className="flex items-center gap-1.5"><Home size={14} /> Clients</span>
          <span>·</span>
          <span className="flex items-center gap-1.5"><UserCog size={14} /> Consultants</span>
        </div>

        <div className="rounded-[10px] bg-paper-card p-5">
          {sent ? (
            <div className="text-center text-sm text-ink-soft">
              Check <strong>{email}</strong> for a sign-in link. You can close this tab once you've clicked it.
            </div>
          ) : (
            <>
              <label className="mb-1.5 block text-xs text-slate">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMagicLink()}
                placeholder="you@example.com"
                className="mb-3 w-full rounded-md border border-paper-line px-3 py-2.5 text-sm"
              />
              {error && <div className="mb-3 text-xs text-alert">{error}</div>}
              <button
                onClick={sendMagicLink}
                disabled={sending}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send sign-in link"} <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
        <div className="mt-5 text-center text-xs text-[#7A8499]">
          Your role (client or consultant) is determined automatically once you're signed in.
        </div>
      </div>
    </div>
  );
}
