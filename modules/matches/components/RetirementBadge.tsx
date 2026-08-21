type Props = {
  compact?: boolean
}

export function RetirementBadge({
  compact = false,
}: Props) {
  return (
    <span
      title="Retired"
      className={[
        "inline-flex shrink-0 items-center justify-center border border-amber-300 bg-amber-50 font-bold uppercase tracking-wide text-amber-800",
        compact
          ? "h-6 px-1.5 text-[9px]"
          : "h-7 px-2 text-[10px]",
      ].join(" ")}
    >
      RET
    </span>
  )
}
