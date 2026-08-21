import type { MatchDetailView } from "../view"
import { MatchStatusBadge } from "./MatchStatusBadge"

type MatchHeaderProps = {
  match: MatchDetailView
}

export function MatchHeader({
  match,
}: MatchHeaderProps) {
  return (
    <header className="border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Round {match.roundNumber}
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-950">
            Match {match.visibleMatchNumber ?? match.matchNumber}
          </h1>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            <span>Match #{match.matchNumber}</span>

            {match.matchType ? (
              <span>{match.matchType}</span>
            ) : null}

            <span>
              {match.courtLabel ?? "Court not assigned"}
            </span>
          </div>
        </div>

        <MatchStatusBadge match={match} />
      </div>
    </header>
  )
}
