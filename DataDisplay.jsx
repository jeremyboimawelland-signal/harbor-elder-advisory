import { Star, CheckCircle2, Circle } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";
import { Badge } from "./Badge";

const TONE_TEXT = { alert: "text-alert", sage: "text-sage", default: "text-ink" };

export function StatTile({ label, value, sub, tone, info }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center text-xs text-slate">
        {label}
        {info && <InfoTooltip text={info} />}
      </div>
      <div className={`font-mono text-[26px] font-semibold leading-tight tracking-tight ${TONE_TEXT[tone] || TONE_TEXT.default}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-slate">{sub}</div>}
    </div>
  );
}

export function StarRow({ count, size = 13 }) {
  return (
    <span className="inline-flex items-center gap-px align-middle">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= count ? "#C9A227" : "none"} color={i <= count ? "#C9A227" : "#E8E2D6"} strokeWidth={1.5} />
      ))}
    </span>
  );
}

export function ProgressDot({ done }) {
  return done ? (
    <CheckCircle2 size={18} className="shrink-0 text-sage" />
  ) : (
    <Circle size={18} className="shrink-0 text-paper-line" />
  );
}

const STATUS_TONE_MAP = {
  "Not Started": "neutral",
  Drafted: "copper",
  "Awaiting Signatures": "gold",
  Executed: "sage",
  "Needs Review": "alert",
  Processed: "sage",
  Processing: "neutral",
};

export function StatusPill({ status }) {
  return <Badge tone={STATUS_TONE_MAP[status] || "neutral"}>{status}</Badge>;
}

export function NumberField({ label, value, onChange, compact, disabled }) {
  return (
    <div>
      {label && (
        <div className="mb-1.5 text-xs text-slate">
          {label}
          {disabled && <span className="font-normal text-slate"> (from Asset Vault)</span>}
        </div>
      )}
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[13px] text-slate">$</span>
        <input
          type="number"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={`rounded-md border border-paper-line py-2 pl-[22px] pr-2.5 font-mono text-[13px] ${
            compact ? "w-[140px]" : "w-full"
          } ${disabled ? "cursor-not-allowed bg-paper-line text-slate" : "bg-paper text-ink"}`}
        />
      </div>
    </div>
  );
}
