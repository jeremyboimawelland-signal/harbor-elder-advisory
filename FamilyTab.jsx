import { useState } from "react";
import { Plus, Eye, Info, AlertTriangle } from "lucide-react";
import { Card, SectionLabel } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { GhostButton } from "../ui/Buttons";
import { InfoTooltip } from "../ui/InfoTooltip";
import { AgentConstitutionCard } from "../ui/AgentConstitutionCard";
import { useDecisionLog } from "../../hooks/useDecisionLog";

const SCRIPTS = {
  Finances:
    "I want us to look at this together, not as me checking up on you. Here's what the numbers show about how long Mom and Dad's savings will cover care — I'd like your read on it before we decide anything.",
  Placement:
    "I know this is hard to picture from far away. Can we set a time to look at the same three facilities together on a call, so we're deciding from the same information?",
  Caregiving:
    "I'm not asking you to match what I'm doing day to day — I know that's not possible right now. I do want to find one or two things you could take on that would actually lighten the load here.",
};

/**
 * Ported from the prototype's <FamilyTab>. RLS on `decision_log` (migration 0001)
 * is the REAL enforcement of the OBSERVER-can't-write rule now; the `previewAsRole`
 * toggle below is a UI-only simulation for the signed-in user (consultant or admin
 * client) to preview what an OBSERVER-role family member would see, exactly as in
 * the original prototype.
 */
export function FamilyTab({ client, role, currentUserName }) {
  const { decisionLog, addDecision } = useDecisionLog(client.id);
  const [scriptTopic, setScriptTopic] = useState("Finances");
  const [draftDecision, setDraftDecision] = useState("");
  const [previewAsRole, setPreviewAsRole] = useState("ADMIN");

  const canEditAsPreview = previewAsRole === "ADMIN";

  const handleAdd = async () => {
    if (!draftDecision.trim()) return;
    try {
      await addDecision(draftDecision, role === "admin" ? "Consultant (on behalf of Sarah)" : currentUserName);
      setDraftDecision("");
    } catch (e) {
      // RLS will reject this for a real OBSERVER-role user even if they somehow
      // trigger this handler — surfacing the raw error is intentional here so a
      // misconfigured role is obvious during testing rather than silently swallowed.
      alert(e.message);
    }
  };

  return (
    <div className="grid grid-cols-[1.6fr_1fr] gap-5">
      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <SectionLabel info="Demonstrates how the Decision Log renders for each role. ADMIN can add entries; OBSERVER sees the same log read-only.">
              Sibling Transparency Portal
            </SectionLabel>
            {client.sibling && <Badge>{client.sibling.role} access</Badge>}
          </div>

          {client.sibling ? (
            <div className="mb-3.5 text-[13.5px] text-ink-soft">
              <strong className="text-ink">{client.sibling.name}</strong> has{" "}
              <strong>{client.sibling.role === "ADMIN" ? "full edit access" : "read-only visibility"}</strong> into the
              Decision Log below. {client.sibling.role === "OBSERVER" && "They cannot add, edit, or delete assets or documents."}
            </div>
          ) : (
            <div className="mb-3.5 text-[13.5px] text-slate">No sibling or secondary family member has been added to this file yet.</div>
          )}

          <div className="mb-3 flex items-center gap-2.5 rounded-md bg-paper p-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate">Preview portal as</span>
            <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-ink-soft">
              <input type="radio" name="previewRole" checked={previewAsRole === "ADMIN"} onChange={() => setPreviewAsRole("ADMIN")} />
              ADMIN
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-ink-soft">
              <input type="radio" name="previewRole" checked={previewAsRole === "OBSERVER"} onChange={() => setPreviewAsRole("OBSERVER")} />
              OBSERVER
            </label>
            <InfoTooltip text="Toggle this to see exactly what changes in the UI between the two RBAC roles — this is a live preview, not just a label." />
          </div>

          <SectionLabel>Decision Log</SectionLabel>
          {canEditAsPreview ? (
            <div className="mb-3 flex gap-2">
              <input
                value={draftDecision}
                onChange={(e) => setDraftDecision(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Log a financial or facility decision…"
                className="flex-1 rounded-md border border-paper-line bg-paper px-3 py-2 text-[13px]"
              />
              <GhostButton small icon={Plus} onClick={handleAdd}>Log decision</GhostButton>
            </div>
          ) : (
            <div className="mb-3 flex items-center gap-2 rounded-md bg-alert-soft p-2.5">
              <Eye size={13} className="text-alert" />
              <span className="text-xs text-alert">
                OBSERVER role: read-only. The entry composer is hidden — this is the actual restriction, not just a visual style.
              </span>
            </div>
          )}
          <div className="mb-3 flex flex-col gap-2.5">
            {decisionLog.map((d) => (
              <div key={d.id} className="flex gap-2.5 text-[13px]">
                <span className="whitespace-nowrap pt-px font-mono text-[11.5px] text-slate">{d.date}</span>
                <span className="text-ink-soft">
                  <strong className="text-ink">{d.actor}</strong> — {d.text}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-1.5 text-[11.5px] text-slate">
            <Info size={13} className="mt-0.5 shrink-0" />
            Scoped to financial and facility decisions only — not a general family update feed.
          </div>
        </Card>

        <Card>
          <SectionLabel info="Generated by the Social Work Agent to keep family conversations neutral and focused on the Principal's wellbeing rather than blame.">
            Neutral Communication Script Generator
          </SectionLabel>
          <div className="mb-3 flex gap-2">
            {Object.keys(SCRIPTS).map((topic) => (
              <GhostButton key={topic} small active={scriptTopic === topic} onClick={() => setScriptTopic(topic)}>
                {topic}
              </GhostButton>
            ))}
          </div>
          <div className="rounded-lg bg-paper p-3.5 text-[13.5px] italic leading-relaxed text-ink">"{SCRIPTS[scriptTopic]}"</div>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <AgentConstitutionCard
          agent="socialwork"
          title="Social Work Agent — Boundaries"
          points={[
            "Neutral arbitration only — never validates sibling blaming",
            "Focuses strictly on the Principal's Safety, Wellness, and Social Connection",
            "Crisis escalation: any signal of abuse or neglect triggers an immediate APS referral message",
            "Decision Log stays scoped to financial/facility decisions, not general updates",
          ]}
        />
        <Card className="border-transparent bg-alert-soft">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-alert" />
            <div className="text-[12.5px] leading-relaxed text-alert">
              If at any point this conversation involves a threat of physical harm, neglect, or abuse, this platform
              will immediately surface contact information for Adult Protective Services.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
