import { Eye, ArrowLeft } from "lucide-react";

/**
 * Ported from the prototype's <ProxyBanner>. This is, per the build plan, "the
 * single most important visual cue in the console" — do not remove or soften it.
 */
export function ProxyBanner({ client, onExit }) {
  return (
    <div className="flex items-center gap-2.5 bg-copper px-5 py-2.5 text-[13px] font-semibold text-[#FFF6EC]">
      <Eye size={15} />
      <span>
        Viewing as consultant, proxying client file:&nbsp;<strong>{client.name}</strong>
      </span>
      <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] uppercase tracking-wide">
        All actions logged to audit trail
      </span>
      <button
        onClick={onExit}
        className="ml-auto flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1 text-xs font-semibold text-[#FFF6EC]"
      >
        <ArrowLeft size={13} /> Exit client file
      </button>
    </div>
  );
}
