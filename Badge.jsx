import clsx from "clsx";

/** Ported from the prototype's <Badge> — tone colors map 1:1 to the original `T` palette. */
const TONE_CLASSES = {
  neutral: "bg-paper-line text-ink-soft",
  copper: "bg-copper-soft text-copper",
  sage: "bg-sage-soft text-sage",
  alert: "bg-alert-soft text-alert",
  gold: "bg-[#F7EFD2] text-[#8A6D1F]",
};

export function Badge({ children, tone = "neutral", className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
