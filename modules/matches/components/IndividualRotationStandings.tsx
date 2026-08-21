"use client"

import { useEffect, useMemo, useState } from "react"

import { useStage } from "../../competition-stages/hooks"
import { listStageMatchesAction } from "../actions"
import type { MatchDetailView } from "../view"
import {
  buildIndividualRotationStandings,
  type IndividualRotationStandingRow,
} from "../standings/individualRotationStandings"

export function IndividualRotationStandingsTable({
  rows,
  compact = false,
}: {
  rows: IndividualRotationStandingRow[]
  compact?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-300 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <th className="px-3 py-3">#</th>
            <th className="px-3 py-3">Player</th>
            <th className="px-3 py-3 text-center">P</th>
            <th className="px-3 py-3 text-center">W</th>
            <th className="px-3 py-3 text-center">D</th>
            <th className="px-3 py-3 text-center">L</th>
            <th className="px-3 py-3 text-center">PF</th>
            <th className="px-3 py-3 text-center">PA</th>
            <th className="px-3 py-3 text-center">Diff</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.entryId} className="border-b border-slate-200 last:border-b-0">
              <td className="px-3 py-3 font-semibold text-slate-500">
                {row.played > 0 ? index + 1 : "–"}
              </td>
              <td className="px-3 py-3 font-semibold text-slate-900">{row.displayName}</td>
              <td className="px-3 py-3 text-center tabular-nums">{row.played}</td>
              <td className="px-3 py-3 text-center tabular-nums">{row.won}</td>
              <td className="px-3 py-3 text-center tabular-nums">{row.drawn}</td>
              <td className="px-3 py-3 text-center tabular-nums">{row.lost}</td>
              <td className="px-3 py-3 text-center tabular-nums">{row.pointsFor}</td>
              <td className="px-3 py-3 text-center tabular-nums">{row.pointsAgainst}</td>
              <td className="px-3 py-3 text-center font-semibold tabular-nums">
                {row.diff > 0 ? `+${row.diff}` : row.diff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!compact ? (
        <p className="border-t border-slate-200 px-3 py-3 text-xs text-slate-500">
          Ranking order: wins, point difference, points for, player name.
        </p>
      ) : null}
    </div>
  )
}

export function IndividualRotationRankingSection() {
  const stage = useStage()
  const [matches, setMatches] = useState<MatchDetailView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const result = await listStageMatchesAction(stage.id)
        if (active) setMatches(result)
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load ranking.",
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [stage.id])

  const rows = useMemo(
    () => buildIndividualRotationStandings(matches),
    [matches],
  )

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Individual ranking
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">Standings</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Live individual standings calculated from completed doubles matches.
        </p>
      </div>

      {loading ? (
        <div className="border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          Loading ranking...
        </div>
      ) : null}

      {error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Live standings
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">Ranking</h3>
            <p className="mt-1 text-sm text-slate-500">Updated from completed matches.</p>
          </div>
          <IndividualRotationStandingsTable rows={rows} />
        </div>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          Generate the stage before opening the ranking.
        </div>
      ) : null}
    </section>
  )
}
