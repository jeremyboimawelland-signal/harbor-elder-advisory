import { useState } from "react";
import { TopBar } from "./components/layout/TopBar";
import { ProxyBanner } from "./components/layout/ProxyBanner";
import { LoginScreen } from "./components/layout/LoginScreen";
import { ClientRoster } from "./components/roster/ClientRoster";
import { ClientWorkspace } from "./components/layout/ClientWorkspace";
import { useAuth } from "./hooks/useAuth";
import { useClients } from "./hooks/useClients";

/**
 * Ported from the prototype's root <App>. Key differences from the original:
 *   - Role (`client` | `admin`) now comes from useAuth(), derived from real
 *     Supabase Auth session + the signed-in user's relationship to `clients` rows,
 *     instead of a button the user clicked on a fake login screen.
 *   - The client roster comes from useClients() (Supabase) instead of a
 *     useStoredState-backed SEED_CLIENTS array.
 *   - "Switch role" is preserved as a demo/QA convenience (see useAuth.switchRole)
 *     but should be gated behind a feature flag or removed before shipping to
 *     real users, since real users shouldn't be able to grant themselves admin.
 */
export default function App() {
  const { session, role, loading: authLoading, switchRole, user } = useAuth();
  const { clients, createClient } = useClients();
  const [proxiedClient, setProxiedClient] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const handleSelectClient = (c) => {
    setProxiedClient(c);
    setActiveTab("overview");
  };

  const handleExitProxy = () => setProxiedClient(null);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-paper text-slate">Loading…</div>;
  }

  if (!session) {
    return <LoginScreen />;
  }

  // Client-role users go straight into their own (only) client file.
  const effectiveClient = role === "client" ? clients[0] : proxiedClient;

  return (
    <div className="flex min-h-screen flex-col bg-paper font-body">
      <TopBar
        role={role}
        onSwitchRole={switchRole}
        clientName={effectiveClient ? effectiveClient.name : null}
        isAdmin={role === "admin"}
        onBackToRoster={role === "admin" ? handleExitProxy : null}
      />
      {role === "admin" && effectiveClient && <ProxyBanner client={effectiveClient} onExit={handleExitProxy} />}

      {role === "admin" && !effectiveClient ? (
        <ClientRoster clients={clients} onSelect={handleSelectClient} onCreateClient={createClient} />
      ) : effectiveClient ? (
        <ClientWorkspace
          client={effectiveClient}
          role={role}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUserName={user?.user_metadata?.display_name || user?.email}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-slate">
          No client file is set up for your account yet. Ask your consultant to create one.
        </div>
      )}
    </div>
  );
}
