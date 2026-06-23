import clsx from "clsx";
import { InfoTooltip } from "./InfoTooltip";

export function Card({ children, className, padded = true }) {
  return (
    <div
      className={clsx(
        "rounded-[10px] border border-paper-line bg-paper-card",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children, info }) {
  return (
    <div className="mb-2.5 flex items-center text-[11px] font-bold uppercase tracking-wider text-slate">
      {children}
      {info && <InfoTooltip text={info} />}
    </div>
  );
}
