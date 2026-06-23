import { Plus, X } from "lucide-react";
import { Card, SectionLabel } from "../ui/Card";
import { GhostButton } from "../ui/Buttons";
import { NumberField } from "../ui/DataDisplay";

/**
 * Ported from the prototype's <AssetEditor>, with one necessary change: new asset
 * rows now get a real `crypto.randomUUID()` instead of the original's `a${Date.now()}`
 * string id. The old scheme worked fine against `window.storage`'s JSON blob but
 * will be rejected by Postgres's `uuid` column type on `liquid_assets.id` — see
 * migration 0001. useFinancials.setFinancials() upserts by this id, so it must be
 * a real uuid from the moment the row is created, not just on first save.
 */
export function AssetEditor({ financials, onChange }) {
  const update = (field, value) => onChange({ ...financials, [field]: value });
  const updateAsset = (id, value) =>
    onChange({ ...financials, liquidAssets: financials.liquidAssets.map((a) => (a.id === id ? { ...a, value } : a)) });
  const updateLabel = (id, label) =>
    onChange({ ...financials, liquidAssets: financials.liquidAssets.map((a) => (a.id === id ? { ...a, label } : a)) });
  const removeAsset = (id) =>
    onChange({ ...financials, liquidAssets: financials.liquidAssets.filter((a) => a.id !== id) });
  const addAsset = () =>
    onChange({
      ...financials,
      liquidAssets: [...financials.liquidAssets, { id: crypto.randomUUID(), label: "New asset", value: 0 }],
    });

  return (
    <Card>
      <SectionLabel info="These figures feed the Burn Rate Engine on the Overview tab in real time.">
        Adjust the numbers
      </SectionLabel>
      <div className="mb-4 grid grid-cols-2 gap-3.5">
        <NumberField label="Monthly income (SS + pensions)" value={financials.monthlyIncome} onChange={(v) => update("monthlyIncome", v)} />
        <NumberField label="Monthly cost of care" value={financials.monthlyExpenses} onChange={(v) => update("monthlyExpenses", v)} />
      </div>
      <div className="flex items-center justify-between">
        <SectionLabel>Liquid assets</SectionLabel>
        <GhostButton small icon={Plus} onClick={addAsset}>Add asset</GhostButton>
      </div>
      <div className="flex flex-col gap-2">
        {financials.liquidAssets.length === 0 && (
          <div className="py-2.5 text-[12.5px] text-slate">No assets listed. Add one above.</div>
        )}
        {financials.liquidAssets.map((a) => (
          <div key={a.id} className="flex items-center gap-2">
            <input
              value={a.label}
              onChange={(e) => updateLabel(a.id, e.target.value)}
              className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-[13px] text-ink-soft focus:border-paper-line"
            />
            <NumberField value={a.value} onChange={(v) => updateAsset(a.id, v)} compact />
            <button
              onClick={() => removeAsset(a.id)}
              aria-label={`Remove ${a.label}`}
              title="Remove this asset"
              className="flex p-1.5 text-slate"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
