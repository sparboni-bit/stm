"use client"

import { useEffect, useMemo, useState } from "react"

import { useStage } from "../../competition-stages/hooks"
import { listStageMatchesAction } from "../actions"
import {
  buildIndividualRotationStandings,
} from "../standings/individualRotationStandings"
import type { MatchDetailView } from "../view"

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

export function IndividualRotationRankingSection() {
  const stage = useStage()

  const [matches, setMatches] =
    useState<MatchDetailView[]>([])
  const [loading, setLoading] =
    useState(true)
  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const result =
          await listStageMatchesAction(stage.id)

        if (active) {
          setMatches(result)
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load standings.",
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [stage.id])

  const standings = useMemo(
    () =>
      buildIndividualRotationStandings(
        matches,
      ),
    [matches],
  )

  const completed =
    matches.filter(
      (match) =>
        match.status === "completed",
    ).length

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <header className="border-b border-neutral-200 bg-neutral-50 px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
          Individual Rotation
        </p>

        <h2 className="mt-1 text-lg font-bold text-neutral-950">
          {stage.name}
        </h2>

        <p className="mt-1 text-sm text-neutral-600">
          {completed} / {matches.length} matches completed
        </p>
      </header>

      {loading ? (
        <div className="px-4 py-8 text-center text-sm text-neutral-500">
          Loading standings...
        </div>
      ) : null}

      {error ? (
        <div className="border-t border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {!loading &&
      !error &&
      standings.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="font-semibold text-neutral-950">
            No standings yet
          </p>

          <p className="mt-2 text-sm text-neutral-600">
            Generate this Individual Rotation stage to see the individual standings.
          </p>
        </div>
      ) : null}

      {!loading &&
      !error &&
      standings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                <th className="sticky left-0 z-20 w-10 bg-neutral-50 px-2 py-3 text-center">
                  Pos
                </th>

                <th className="sticky left-10 z-20 min-w-[118px] max-w-[118px] sm:min-w-[170px] sm:max-w-none bg-neutral-50 px-3 py-3 text-left shadow-[4px_0_6px_-6px_rgba(0,0,0,0.35)]">
                  Player
                </th>

                <th className="w-10 px-2 py-3 text-center">
                  P
                </th>

                <th className="w-10 px-2 py-3 text-center">
                  W
                </th>

                <th className="w-10 px-2 py-3 text-center">
                  D
                </th>

                <th className="w-10 px-2 py-3 text-center">
                  L
                </th>

                <th className="w-12 px-2 py-3 text-center">
                  PF
                </th>

                <th className="w-12 px-2 py-3 text-center">
                  PA
                </th>

                <th className="w-12 px-2 py-3 text-center">
                  +/-
                </th>
              </tr>
            </thead>

            <tbody>
              {standings.map(
                (row, index) => (
                  <tr
                    key={row.entryId}
                    className="border-b border-neutral-100 last:border-b-0"
                  >
                    <td className="sticky left-0 z-10 bg-white px-2 py-3 text-center font-semibold text-neutral-500">
                      {index + 1}
                    </td>

                    <td className="sticky left-10 z-10 min-w-[118px] max-w-[118px] sm:min-w-[170px] sm:max-w-none bg-white px-3 py-3 font-medium text-neutral-950 shadow-[4px_0_6px_-6px_rgba(0,0,0,0.35)]">
                      <span className="block max-w-[82px] truncate sm:max-w-none">{row.displayName}</span>
                    </td>

                    <td className="px-2 py-3 text-center">
                      {row.played}
                    </td>

                    <td className="px-2 py-3 text-center font-bold">
                      {row.won}
                    </td>

                    <td className="px-2 py-3 text-center">
                      {row.drawn}
                    </td>

                    <td className="px-2 py-3 text-center">
                      {row.lost}
                    </td>

                    <td className="px-2 py-3 text-center">
                      {row.pointsFor}
                    </td>

                    <td className="px-2 py-3 text-center">
                      {row.pointsAgainst}
                    </td>

                    <td className="px-2 py-3 text-center font-semibold">
                      {signed(row.diff)}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading &&
      !error &&
      standings.length > 0 ? (
        <p className="border-t border-neutral-100 px-4 py-3 text-xs leading-5 text-neutral-500">
          Ranking: wins, points difference, points for, player name. Only completed matches contribute to the totals.
        </p>
      ) : null}
    </article>
  )
}
