import Link from "next/link"

import type { MatchDetailView } from "../view"
import { MatchHeader } from "./MatchHeader"
import { MatchMetadata } from "./MatchMetadata"
import { MatchPlayers } from "./MatchPlayers"
import { MatchScoreEditor } from "./MatchScoreEditor"
import { MatchScheduleEditor } from "./MatchScheduleEditor"
import { MatchLiveControls } from "./MatchLiveControls"
import { MatchUndoResult } from "./MatchUndoResult"

type MatchManagerProps = {
  match: MatchDetailView
}

export function MatchManager({
  match,
}: MatchManagerProps) {
  const base =
    `/competitions/${match.competitionId}` +
    `/stages/${match.stageId}`

  const isIndividualRotation =
    match.matchType === "individual_rotation"

  const isElimination =
    match.matchType === "elimination"

  return (
    <div className="space-y-3 sm:space-y-4">
      <nav
        aria-label="Match context navigation"
        className="flex flex-wrap items-center gap-3 text-sm"
      >
        {isIndividualRotation ? (
          <Link
            href={`${base}?section=play`}
            className="font-semibold text-slate-500 hover:text-slate-950"
          >
            ← Play
          </Link>
        ) : (
          <>
            <Link
              href={`${base}?section=matches`}
              className="font-semibold text-slate-500 hover:text-slate-950"
            >
              ← Matches
            </Link>

            {isElimination ? (
              <>
                <span className="text-slate-300">|</span>

                <Link
                  href={`${base}?section=bracket`}
                  className="font-semibold text-slate-500 hover:text-slate-950"
                >
                  Bracket
                </Link>
              </>
            ) : null}
          </>
        )}
      </nav>

      <MatchHeader match={match} />
      <MatchPlayers match={match} />

      <MatchLiveControls match={match} />

      <MatchScheduleEditor match={match} />

      <MatchScoreEditor
        key={`${match.id}-${match.completedAt ?? "open"}`}
        match={match}
      />

      <MatchUndoResult match={match} />

      <MatchMetadata match={match} />
    </div>
  )
}