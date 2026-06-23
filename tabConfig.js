import { Home, Scale, HeartPulse, Building2, Calculator, Users, FolderOpen, MessageSquare, ClipboardList } from "lucide-react";

/** Ported verbatim from CLIENT_TABS / ADMIN_CLIENT_TABS in the prototype. */
export const CLIENT_TABS = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "legal", label: "Legal & Estate", icon: Scale },
  { id: "healthcare", label: "Healthcare", icon: HeartPulse },
  { id: "realestate", label: "Real Estate", icon: Building2 },
  { id: "tax", label: "Tax & Wealth", icon: Calculator },
  { id: "family", label: "Family", icon: Users },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "chat", label: "Ask the Agents", icon: MessageSquare },
];

export const ADMIN_CLIENT_TABS = [...CLIENT_TABS, { id: "consultant", label: "Consultant Notes", icon: ClipboardList }];
