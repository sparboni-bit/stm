import type { MatchDetailView } from "../view"

type MatchStatusBadgeProps = {
  match: MatchDetailView
}

function getStatusLabel(match: MatchDetailView): string {
  if (match.isBye) {
    return "BYE"
  }

  switch (match.status) {
    case "pending":
      return "Pending"
    case "ready":
      return "Ready"
    case "on_court":
      return "Live"
    case "completed":
      return "Completed"
    default:
      return match.status
  }
}

export function MatchStatusBadge({
  match,
}: MatchStatusBadgeProps) {
  return (
    <span className="inline-flex items-center border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
      {getStatusLabel(match)}
    </span>
  )
}
