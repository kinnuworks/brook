import { BrookAvatar } from "./BrookAvatar";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrookAvatar size={compact ? 32 : 38} />
      <span className="leading-none">
        <span className="block text-[22px] font-bold tracking-tight text-deep-900">Brook</span>
        {!compact && <span className="mt-0.5 block text-[11.5px] font-medium text-ink-soft">for OneAquaHealth citizen science</span>}
      </span>
    </span>
  );
}
