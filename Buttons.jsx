import clsx from "clsx";

export function PrimaryButton({ children, onClick, icon: Icon, className, small, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-[7px] bg-ink font-semibold text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60",
        small ? "px-3 py-1.5 text-[13px]" : "px-4 py-2.5 text-sm",
        className
      )}
    >
      {Icon && <Icon size={small ? 14 : 16} />}
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, icon: Icon, className, small, active, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-[7px] border font-semibold disabled:cursor-not-allowed disabled:opacity-60",
        small ? "px-3 py-1.5 text-[13px]" : "px-4 py-2.5 text-sm",
        active ? "border-copper bg-copper-soft text-copper" : "border-paper-line bg-transparent text-ink-soft",
        className
      )}
    >
      {Icon && <Icon size={small ? 14 : 16} />}
      {children}
    </button>
  );
}
