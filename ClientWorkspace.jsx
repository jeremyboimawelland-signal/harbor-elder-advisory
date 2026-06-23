import { TabNav } from "../layout/TopBar";
import { CLIENT_TABS, ADMIN_CLIENT_TABS } from "../layout/tabConfig";
import { OverviewTab } from "../overview/OverviewTab";
import { LegalTab } from "../legal/LegalTab";
import { HealthcareTab } from "../healthcare/HealthcareTab";
import { RealEstateTab } from "../realestate/RealEstateTab";
import { TaxWealthTab } from "../tax/TaxWealthTab";
import { FamilyTab } from "../family/FamilyTab";
import { DocumentsTab } from "../documents/DocumentsTab";
import { ChatTab } from "../chat/ChatTab";
import { ConsultantTab } from "../consultant/ConsultantTab";
import { useFinancials } from "../../hooks/useFinancials";
import { calculateBurnRate } from "../../lib/constants";

/** Ported from the prototype's <ClientWorkspace>, now using useFinancials() (Supabase) instead of useStoredState. */
export function ClientWorkspace({ client, role, activeTab, setActiveTab, currentUserName }) {
  const { financials, setFinancials } = useFinancials(client.id);

  const { runwayMonths } = calculateBurnRate(financials.liquidAssets, financials.monthlyIncome, financials.monthlyExpenses);
  const alerts = { overview: runwayMonths < 12 };

  const tabs = role === "admin" ? ADMIN_CLIENT_TABS : CLIENT_TABS;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TabNav tabs={tabs} active={activeTab} onChange={setActiveTab} alerts={alerts} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-[1180px]">
          {activeTab === "overview" && <OverviewTab client={client} financials={financials} setFinancials={setFinancials} />}
          {activeTab === "legal" && <LegalTab client={client} />}
          {activeTab === "healthcare" && <HealthcareTab client={client} />}
          {activeTab === "realestate" && <RealEstateTab client={client} financials={financials} />}
          {activeTab === "tax" && <TaxWealthTab client={client} financials={financials} />}
          {activeTab === "family" && <FamilyTab client={client} role={role} currentUserName={currentUserName} />}
          {activeTab === "documents" && <DocumentsTab client={client} />}
          {activeTab === "chat" && <ChatTab client={client} financials={financials} />}
          {activeTab === "consultant" && role === "admin" && <ConsultantTab client={client} />}
        </div>
      </div>
    </div>
  );
}
