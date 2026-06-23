import { useEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";

/**
 * Ported from the prototype's <InfoTooltip>. One of the dashboard's most-requested
 * polish items (14 placements across the app) — hover or tap the "i" icon, dismiss
 * with Escape or a click outside. Pure CSS/Tailwind position, no portal needed since
 * every usage site has enough surrounding space (verified in the original QA pass).
 */
export function InfoTooltip({ text, width = 220 }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onClickAway = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickAway);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickAway);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="relative ml-1 inline-flex">
      <button
        type="button"
        aria-label="More information"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex cursor-help border-none bg-transparent p-0 text-slate"
      >
        <HelpCircle size={13} />
      </button>
      {open && (
        <div
          role="tooltip"
          style={{ width: `${width}px` }}
          className="absolute bottom-[calc(100%+8px)] left-1/2 z-50 -translate-x-1/2 rounded-[7px] bg-ink px-[11px] py-2 text-[11.5px] font-normal leading-relaxed text-[#E4E8F0] shadow-lg"
        >
          {text}
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-ink" />
        </div>
      )}
    </span>
  );
}
