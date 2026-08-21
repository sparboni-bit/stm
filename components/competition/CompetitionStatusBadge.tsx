type CompetitionStatusBadgeProps = {
  status: string
}

const statusClasses: Record<string, string> = {
  draft:
    "border-slate-200 bg-slate-100 text-slate-700",

  configure:
    "border-amber-200 bg-amber-50 text-amber-700",

  ready:
    "border-blue-200 bg-blue-50 text-blue-700",

  generated:
    "border-violet-200 bg-violet-50 text-violet-700",

  running:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  completed:
    "border-slate-200 bg-white text-slate-600",

  archived:
    "border-slate-200 bg-slate-100 text-slate-500",
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    )
}

export function CompetitionStatusBadge({
  status,
}: CompetitionStatusBadgeProps) {
  const className =
    statusClasses[status] ??
    "border-slate-200 bg-slate-100 text-slate-700"

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {formatStatus(status)}
    </span>
  )
}