import type { BracketViewMatch } from "../../view"

type StatusBadgeProps = { match: BracketViewMatch }

export function StatusBadge({ match }: StatusBadgeProps) {
  if (match.isBye) return <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">BYE</span>
  if (match.status === "on_court") return <span className="text-[10px] font-bold uppercase tracking-wide text-rose-700">LIVE</span>
  if (match.status === "completed") return <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">FINAL</span>
  return null
}
