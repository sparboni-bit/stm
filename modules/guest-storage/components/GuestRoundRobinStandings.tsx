"use client"

import { useMemo } from "react"

import type { CompetitionEntry } from "@/modules/competition-entries/types"
import type { MatchRow } from "@/modules/matches/types"

import {
  buildRoundRobinStandings,
  type RoundRobinGroupStandings,
} from "@/modules/matches/standings/roundRobinStandings"

import { MatchViewBuilder } from "@/modules/matches/view/MatchViewBuilder"

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

export function GuestRoundRobinStandings({
  matches,
  entries,
}: {
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
            match.match_type ===
            "round_robin",
        )
        .map((match) =>
          matchViewBuilder.build({
            match,
            entries,
          }),
        ),
    [
      matches,
      entries,
      matchViewBuilder,
    ],
  )

  const standings: RoundRobinGroupStandings[] =
    useMemo(
      () =>
        buildRoundRobinStandings(
          views,
        ),
      [views],
    )

  const completed = views.filter(
    (match) =>
      match.status ===
      "completed",
  ).length

  return (
    <section className="space-y-5">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
          Round Robin
        </p>

        <h2 className="mt-1 text-lg font-bold text-neutral-950">
          Standings
        </h2>

        <p className="mt-1 text-sm text-neutral-600">
          {completed} / {views.length} matches completed
        </p>
      </header>

      {standings.length === 0 ? (
        <div className="border border-dashed border-neutral-300 bg-white px-4 py-8 text-center">
          <h3 className="font-semibold text-neutral-950">
            No Round Robin standings yet
          </h3>

          <p className="mt-2 text-sm text-neutral-600">
            Generate a Round Robin stage to see its
            standings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {standings.map(
            (group) => (
              <article
                key={
                  group.groupKey
                }
                className="overflow-hidden border border-neutral-200 bg-white shadow-sm"
              >
                <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                  <h3 className="font-bold text-neutral-950">
                    Group{" "}
                    {
                      group.groupKey
                    }
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                        <th className="sticky left-0 z-30 w-10 min-w-10 bg-white px-2 py-3 text-center lg:static">
                          Pos
                        </th>

                        <th className="sticky left-10 z-30 min-w-[150px] bg-white px-3 py-3 text-left shadow-[6px_0_8px_-8px_rgba(0,0,0,0.35)] lg:static lg:shadow-none">
                          Player
                        </th>

                        <th className="w-10 px-2 py-3 text-center">
                          P
                        </th>

                        <th className="w-10 px-2 py-3 text-center">
                          W
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
                      {group.rows.map(
                        (
                          row,
                          index,
                        ) => (
                          <tr
                            key={
                              row.entryId
                            }
                            className="border-b border-neutral-100 last:border-b-0"
                          >
                            <td className="sticky left-0 z-20 bg-white px-2 py-3 text-center font-semibold text-neutral-500 lg:static">
                              {index +
                                1}
                            </td>

                            <td className="sticky left-10 z-20 bg-white px-3 py-3 shadow-[6px_0_8px_-8px_rgba(0,0,0,0.35)] lg:static lg:shadow-none">
                              <div className="flex items-center gap-2">
                                <span
                                  className={
                                    index ===
                                    0
                                      ? "font-bold text-neutral-950"
                                      : "font-medium text-neutral-900"
                                  }
                                >
                                  {
                                    row.displayName
                                  }
                                </span>

                                {row.seed !==
                                null ? (
                                  <span className="shrink-0 whitespace-nowrap border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[9px] font-semibold text-neutral-600">
                                    Seed{" "}
                                    {
                                      row.seed
                                    }
                                  </span>
                                ) : null}
                              </div>
                            </td>

                            <td className="px-2 py-3 text-center">
                              {
                                row.played
                              }
                            </td>

                            <td className="px-2 py-3 text-center font-bold">
                              {
                                row.won
                              }
                            </td>

                            <td className="px-2 py-3 text-center">
                              {
                                row.lost
                              }
                            </td>

                            <td className="px-2 py-3 text-center">
                              {
                                row.pointsFor
                              }
                            </td>

                            <td className="px-2 py-3 text-center">
                              {
                                row.pointsAgainst
                              }
                            </td>

                            <td className="px-2 py-3 text-center font-semibold">
                              {signed(
                                row.diff,
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            ),
          )}
        </div>
      )}

      {standings.length >
      0 ? (
        <p className="text-xs leading-5 text-neutral-500">
          Ranking: wins, points difference, points for,
          player name. Only completed matches contribute
          to the totals.
        </p>
      ) : null}
    </section>
  )
}