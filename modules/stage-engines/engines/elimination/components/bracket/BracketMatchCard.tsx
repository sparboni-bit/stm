import Link from "next/link"

import type { BracketViewMatch } from "../../view"
import { PlayerRow } from "./PlayerRow"
import { ScoreColumn } from "./ScoreColumn"
import { StatusBadge } from "./StatusBadge"

type BracketMatchCardProps = {
  match: BracketViewMatch
  competitionId: string
  stageId: string
}

function hasResolvedParticipant(
  participant: BracketViewMatch["sideA"],
): boolean {
  return participant.slotType === "entry" && participant.entryId !== null
}

function isActionableMatch(match: BracketViewMatch): boolean {
  if (match.isBye || match.status === "cancelled") return false

  if (
    match.status === "ready" ||
    match.status === "on_court" ||
    match.status === "completed"
  ) {
    return true
  }

  if (match.status === "pending") {
    return (
      hasResolvedParticipant(match.sideA) &&
      hasResolvedParticipant(match.sideB)
    )
  }

  return false
}

export function BracketMatchCard({
  match,
  competitionId,
  stageId,
}: BracketMatchCardProps) {
  const completed = match.status === "completed" || match.winnerSide !== null
  const actionable = isActionableMatch(match)

  const card = (
    <article className="w-[272px] shrink-0">
      <div className="mb-1 flex h-5 items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          M{match.visibleMatchNumber ?? match.matchNumber}
        </span>
        <div className="flex items-center gap-2">
          {match.courtLabel ? (
            <span className="text-[10px] font-semibold text-slate-400">
              {match.courtLabel}
            </span>
          ) : null}
          <StatusBadge match={match} />
        </div>
      </div>

      <div
        className={[
          "grid grid-cols-[minmax(0,1fr)_auto] overflow-hidden border bg-white shadow-sm",
          actionable
            ? "border-slate-300 transition hover:border-slate-500 hover:shadow-md"
            : "border-slate-300",
        ].join(" ")}
      >
        <div className="min-w-0 divide-y divide-slate-100">
          <div className="relative">
            <PlayerRow
              participant={match.sideA}
              winner={match.winnerSide === "A"}
              loser={completed && match.winnerSide === "B"}
            />
            {match.finishType === "retirement" && match.retiredSide === "A" ? (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 border border-amber-300 bg-amber-50 px-1 text-[8px] font-bold text-amber-800">
                RET
              </span>
            ) : null}
          </div>
          <div className="relative">
            <PlayerRow
              participant={match.sideB}
              winner={match.winnerSide === "B"}
              loser={completed && match.winnerSide === "A"}
            />
            {match.finishType === "retirement" && match.retiredSide === "B" ? (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 border border-amber-300 bg-amber-50 px-1 text-[8px] font-bold text-amber-800">
                RET
              </span>
            ) : null}
          </div>
        </div>
        <ScoreColumn score={match.score} winnerSide={match.winnerSide} />
      </div>
    </article>
  )

  if (!actionable) return card

  return (
    <Link
      href={`/competitions/${competitionId}/stages/${stageId}/matches/${match.id}`}
      className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
      aria-label={`Open match ${match.visibleMatchNumber ?? match.matchNumber}`}
    >
      {card}
    </Link>
  )
}
