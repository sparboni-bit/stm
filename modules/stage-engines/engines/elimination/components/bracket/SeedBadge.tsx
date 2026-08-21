type SeedBadgeProps = { seed: number | null }

export function SeedBadge({ seed }: SeedBadgeProps) {
  if (seed === null) return <span className="w-7 shrink-0" aria-hidden="true" />
  return (
    <span className="w-7 shrink-0 text-right font-mono text-[11px] font-bold text-slate-500" aria-label={`Seed ${seed}`}>
      ({seed})
    </span>
  )
}
