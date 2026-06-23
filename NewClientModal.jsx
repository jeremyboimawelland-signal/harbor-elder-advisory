import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { GhostButton, PrimaryButton } from "../ui/Buttons";

/** Ported from the prototype's <NewClientModal>, now calling the real createClient mutator from useClients(). */
export function NewClientModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [riskLevel, setRiskLevel] = useState("Medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canCreate = name.trim().length > 1 && location.trim().length > 1 && !saving;

  const handleCreate = async () => {
    if (!canCreate) return;
    setSaving(true);
    try {
      await onCreate({ name: name.trim(), location: location.trim(), riskLevel });
      onClose();
    } catch (e) {
      alert(`Could not create client: ${e.message}`);
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/45 p-5">
      <div onClick={(e) => e.stopPropagation()} className="w-[420px] max-w-full rounded-xl bg-paper-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-display text-[19px] text-ink">New client file</span>
          <button onClick={onClose} aria-label="Close" className="text-slate">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1.5 text-xs text-slate">Client name</div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Linda Park"
              className="w-full rounded-md border border-paper-line px-3 py-2.5 text-[13.5px]"
            />
          </div>
          <div>
            <div className="mb-1.5 text-xs text-slate">Location</div>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Green Bay, WI"
              className="w-full rounded-md border border-paper-line px-3 py-2.5 text-[13.5px]"
            />
          </div>
          <fieldset className="border-0 p-0">
            <div className="mb-1.5 text-xs text-slate">Initial risk level</div>
            <div className="flex gap-3.5">
              {["Low", "Medium", "High"].map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-1.5 text-[13px]">
                  <input type="radio" name="newClientRisk" checked={riskLevel === r} onChange={() => setRiskLevel(r)} />
                  {r}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="mt-5.5 flex justify-end gap-2.5">
          <GhostButton small onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton small onClick={handleCreate} disabled={!canCreate}>
            {saving ? "Creating…" : "Create file"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
