import { ShieldCheck, Users, LogOut } from "lucide-react";
import { Badge } from "../ui/Badge";

/** Ported from the prototype's <TopBar>. */
export function TopBar({ role, onSwitchRole, clientName, isAdmin, onBackToRoster }) {
  return (
    <div className="flex h-14 shrink-0 items-center bg-ink px-6">
      <div className="mr-7 flex items-center gap-2.5">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-copper">
          <ShieldCheck size={15} color="#FFF6EC" />
        </div>
        <span className="font-display text-[17px] text-paper">Harbor</span>
      </div>

      {isAdmin && onBackToRoster && (
        <button
          onClick={onBackToRoster}
          className="mr-4 flex items-center gap-1.5 rounded-md border border-[#3A4452] px-2.5 py-1.5 text-xs font-semibold text-[#C7CDD8]"
        >
          <Users size={13} /> All Clients
        </button>
      )}

      {clientName && <div className="text-[13px] text-[#C7CDD8]">{clientName}</div>}

      <div className="ml-auto flex items-center gap-3.5">
        <Badge tone={role === "admin" ? "neutral" : "copper"}>{role === "admin" ? "Consultant" : "Client"}</Badge>
        <button
          onClick={onSwitchRole}
          title="Switch role (demo)"
          className="flex items-center gap-1.5 rounded-md border border-[#3A4452] px-2.5 py-1.5 text-xs text-[#C7CDD8]"
        >
          <LogOut size={13} /> Switch role
        </button>
      </div>
    </div>
  );
}

/** Ported from the prototype's <TabNav>. */
export function TabNav({ tabs, active, onChange, alerts = {} }) {
  return (
    <div className="flex gap-0.5 overflow-x-auto border-b border-paper-line bg-paper-card px-6">
      {tabs.map((t) => {
        const isActive = active === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 pb-2.5 pt-3.5 text-[13.5px] ${
              isActive ? "border-copper font-bold text-ink" : "border-transparent font-medium text-slate"
            }`}
          >
            <Icon size={15} />
            {t.label}
            {alerts[t.id] && <span className="inline-block h-1.5 w-1.5 rounded-full bg-alert" />}
          </button>
        );
      })}
    </div>
  );
}
