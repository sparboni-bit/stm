"use client"

import { useEffect, useState } from "react"

import { useStage } from "../../../../competition-stages/hooks"
import { listStageMatchesAction } from "../../../../matches/actions"
import {
  buildRoundRobinStandings,
  type RoundRobinGroupStandings,
} from "../../../../matches/standings/roundRobinStandings"
import type { MatchDetailView } from "../../../../matches/view"

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

export function RoundRobinStandingsSection() {
  const stage = useStage()
  const [matches, setMatches] = useState<MatchDetailView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    void listStageMatchesAction(stage.id)
      .then((result) => {
        if (active) setMatches(result)
      })
      .catch((cause) => {
        if (!active) return
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load Round Robin standings.",
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [stage.id])

  const standings: RoundRobinGroupStandings[] =
    buildRoundRobinStandings(matches)

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Round Robin
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">Standings</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Group standings calculated from completed matches.
        </p>
      </header>

      {loading ? (
        <div className="border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Loading standings...
        </div>
      ) : null}

      {error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && standings.length === 0 ? (
        <div className="border border-dashed border-slate-300 px-4 py-10 text-center">
          <h3 className="text-base font-semibold text-slate-950">
            No standings available
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Generate the Round Robin matches before opening standings.
          </p>
        </div>
      ) : null}

      {!loading && !error && standings.length > 0 ? (
        <div className="space-y-4">
          {standings.map((group) => (
            <article
              key={group.groupKey}
              className="overflow-hidden border border-slate-200 bg-white"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="font-semibold text-slate-950">
                  Group {group.groupKey}
                </h3>
                <span className="text-xs text-slate-500">
                  {group.rows.length} entries
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="w-12 px-3 py-3 text-center">Pos</th>
                      <th className="px-3 py-3 text-left">Player</th>
                      <th className="w-12 px-2 py-3 text-center">P</th>
                      <th className="w-12 px-2 py-3 text-center">W</th>
                      <th className="w-12 px-2 py-3 text-center">L</th>
                      <th className="w-14 px-2 py-3 text-center">PF</th>
                      <th className="w-14 px-2 py-3 text-center">PA</th>
                      <th className="w-14 px-2 py-3 text-center">+/-</th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.rows.map((row, index) => (
                      <tr
                        key={row.entryId}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-3 py-3 text-center font-semibold text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className={index === 0 ? "font-bold text-slate-950" : "font-medium text-slate-900"}>
                              {row.displayName}
                            </span>
                            {row.seed !== null ? (
                              <span className="shrink-0 border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                                Seed {row.seed}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">{row.played}</td>
                        <td className="px-2 py-3 text-center font-semibold">{row.won}</td>
                        <td className="px-2 py-3 text-center">{row.lost}</td>
                        <td className="px-2 py-3 text-center">{row.pointsFor}</td>
                        <td className="px-2 py-3 text-center">{row.pointsAgainst}</td>
                        <td className="px-2 py-3 text-center font-semibold">{signed(row.diff)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!loading && !error && standings.length > 0 ? (
        <p className="text-xs leading-5 text-slate-500">
          Ranking order: wins, points difference, points for, player name.
          Only completed matches contribute to the totals.
        </p>
      ) : null}
    </section>
  )
}
