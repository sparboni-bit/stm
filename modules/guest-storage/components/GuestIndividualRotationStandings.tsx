"use client"

import { useMemo } from "react"

import type { CompetitionEntry } from "@/modules/competition-entries/types"
import type { CompetitionStage } from "@/modules/competition-stages/types"
import type { MatchRow } from "@/modules/matches/types"
import {
  buildIndividualRotationStandings,
} from "@/modules/matches/standings/individualRotationStandings"
import { MatchViewBuilder } from "@/modules/matches/view/MatchViewBuilder"

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

export function GuestIndividualRotationStandings({
  stage,
  matches,
  entries,
}: {
  stage: CompetitionStage
  matches: MatchRow[]
  entries: CompetitionEntry[]
}) {
  const matchViewBuilder = useMemo(
    () => new MatchViewBuilder(),
    [],
  )

  const views = useMemo(
    () =>
      matches
        .filter(
          (match) =>
            match.stage_id === stage.id &&
            match.match_type === "individual_rotation",
        )
        .map((match) =>
          matchViewBuilder.build({
            match,
            entries,
          }),
        ),
    [matches, entries, stage.id, matchViewBuilder],
  )

  const standings = useMemo(
    () => buildIndividualRotationStandings(views),
    [views],
  )

  const completed = views.filter(
    (match) => match.status === "completed",
  ).length

  return (
    <article className="overflow-hidden border border-neutral-200 bg-white shadow-sm">
      <header className="border-b border-neutral-200 bg-neutral-50 px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
          Individual Rotation
        </p>
        <h2 className="mt-1 text-lg font-bold text-neutral-950">
          {stage.name}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          {completed} / {views.length} matches completed
        </p>
      </header>

      {standings.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="font-semibold text-neutral-950">
            No standings yet
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            Generate this Individual Rotation phase to see the individual standings.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                <th className="sticky left-0 z-20 w-10 bg-neutral-50 px-2 py-3 text-center">Pos</th>
                <th className="sticky left-10 z-20 min-w-[170px] bg-neutral-50 px-3 py-3 text-left shadow-[4px_0_6px_-6px_rgba(0,0,0,0.35)]">Player</th>
                <th className="w-10 px-2 py-3 text-center">P</th>
                <th className="w-10 px-2 py-3 text-center">W</th>
                <th className="w-10 px-2 py-3 text-center">D</th>
                <th className="w-10 px-2 py-3 text-center">L</th>
                <th className="w-12 px-2 py-3 text-center">PF</th>
                <th className="w-12 px-2 py-3 text-center">PA</th>
                <th className="w-12 px-2 py-3 text-center">+/-</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, index) => (
                <tr
                  key={row.entryId}
                  className="border-b border-neutral-100 last:border-b-0"
                >
                  <td className="sticky left-0 z-10 bg-white px-2 py-3 text-center font-semibold text-neutral-500">
                    {index + 1}
                  </td>
                  <td className="sticky left-10 z-10 min-w-[170px] bg-white px-3 py-3 font-medium text-neutral-950 shadow-[4px_0_6px_-6px_rgba(0,0,0,0.35)]">
                    {row.displayName}
                  </td>
                  <td className="px-2 py-3 text-center">{row.played}</td>
                  <td className="px-2 py-3 text-center font-bold">{row.won}</td>
                  <td className="px-2 py-3 text-center">{row.drawn}</td>
                  <td className="px-2 py-3 text-center">{row.lost}</td>
                  <td className="px-2 py-3 text-center">{row.pointsFor}</td>
                  <td className="px-2 py-3 text-center">{row.pointsAgainst}</td>
                  <td className="px-2 py-3 text-center font-semibold">
                    {signed(row.diff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {standings.length > 0 ? (
        <p className="border-t border-neutral-100 px-4 py-3 text-xs leading-5 text-neutral-500">
          Ranking: wins, points difference, points for, player name. Only completed matches contribute to the totals.
        </p>
      ) : null}
    </article>
  )
}
