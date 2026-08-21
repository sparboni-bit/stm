"use client"

import { useEffect, useMemo, useState } from "react"

import { useStage } from "../../../../competition-stages/hooks"
import { listStageMatchesAction } from "../../../../matches/actions"
import {
  buildRoundRobinStandings,
  type RoundRobinGroupStandings,
} from "../../../../matches/standings/roundRobinStandings"
import type {
  MatchDetailView,
  MatchParticipantView,
} from "../../../../matches/view"

function participantLabel(
  participant: MatchParticipantView,
): string {
  const seed =
    participant.seed !== null
      ? `(${participant.seed}) `
      : ""

  return `${seed}${participant.displayName}`
}

function scoreValues(
  match: MatchDetailView,
  side: "A" | "B",
): string[] {
  if (
    Array.isArray(match.score.sets) &&
    match.score.sets.length > 0
  ) {
    return match.score.sets
      .map((item) => {
        if (
          typeof item !== "object" ||
          item === null
        ) {
          return null
        }

        const row =
          item as Record<string, unknown>

        const value =
          side === "A"
            ? row.a
            : row.b

        return (
          typeof value === "number" ||
          typeof value === "string"
        )
          ? String(value)
          : null
      })
      .filter(
        (value): value is string =>
          value !== null,
      )
  }

  const value =
    side === "A"
      ? match.score.scoreA ??
        match.score.a
      : match.score.scoreB ??
        match.score.b

  return (
    typeof value === "number" ||
    typeof value === "string"
  )
    ? [String(value)]
    : []
}

function scoreLabel(
  match: MatchDetailView,
): string {
  const a =
    scoreValues(match, "A")
  const b =
    scoreValues(match, "B")

  if (
    a.length === 0 &&
    b.length === 0
  ) {
    return "—"
  }

  const max =
    Math.max(
      a.length,
      b.length,
    )

  const sets =
    Array.from(
      { length: max },
      (_, index) =>
        `${a[index] ?? "–"}-${b[index] ?? "–"}`,
    )

  return sets.join("  ")
}

function signed(value: number) {
  return value > 0
    ? `+${value}`
    : String(value)
}

export function RoundRobinReportsSection() {
  const stage = useStage()

  const [matches, setMatches] =
    useState<MatchDetailView[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)

    void listStageMatchesAction(
      stage.id,
    )
      .then((result) => {
        if (active) {
          setMatches(result)
        }
      })
      .catch((cause) => {
        if (!active) {
          return
        }

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load Round Robin report.",
        )
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [stage.id])

  const standings:
    RoundRobinGroupStandings[] =
    useMemo(
      () =>
        buildRoundRobinStandings(
          matches,
        ),
      [matches],
    )

  const matchesByGroup =
    useMemo(() => {
      const groups =
        new Map<
          string,
          MatchDetailView[]
        >()

      for (const match of matches) {
        if (
          match.matchType !==
            "round_robin" ||
          !match.groupKey
        ) {
          continue
        }

        const current =
          groups.get(
            match.groupKey,
          ) ?? []

        current.push(match)

        groups.set(
          match.groupKey,
          current,
        )
      }

      for (const groupMatches of groups.values()) {
        groupMatches.sort(
          (a, b) =>
            a.roundNumber -
              b.roundNumber ||
            a.matchOrder -
              b.matchOrder ||
            a.matchNumber -
              b.matchNumber,
        )
      }

      return groups
    }, [matches])

  const completedCount =
    matches.filter(
      (match) =>
        match.status ===
        "completed",
    ).length

  function printReport() {
    window.print()
  }

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .rr-report-root,
          .rr-report-root * {
            visibility: visible !important;
          }

          .rr-report-root {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .rr-report-no-print {
            display: none !important;
          }

          .rr-report-group {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 18mm;
          }

          .rr-report-matches {
            break-inside: auto;
          }

          .rr-report-match-row {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>

      <section className="rr-report-root space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Round Robin · Final report
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {stage.name}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Final standings and match results by group.
            </p>

            {!loading &&
            !error ? (
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {completedCount} /{" "}
                {matches.length} matches completed
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={printReport}
            className="rr-report-no-print min-h-11 border border-slate-950 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Print / Save PDF
          </button>
        </header>

        {loading ? (
          <div className="border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            Loading report...
          </div>
        ) : null}

        {error ? (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!loading &&
        !error &&
        standings.length === 0 ? (
          <div className="border border-dashed border-slate-300 px-4 py-10 text-center">
            <h3 className="font-semibold text-slate-950">
              No report available
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              No Round Robin matches were found for this Stage.
            </p>
          </div>
        ) : null}

        {!loading &&
        !error
          ? standings.map(
              (group) => {
                const groupMatches =
                  matchesByGroup.get(
                    group.groupKey,
                  ) ?? []

                return (
                  <article
                    key={
                      group.groupKey
                    }
                    className="rr-report-group space-y-4"
                  >
                    <div className="border border-slate-200 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <h3 className="font-bold text-slate-950">
                          Group{" "}
                          {
                            group.groupKey
                          }
                        </h3>

                        <span className="text-xs font-semibold text-slate-500">
                          {
                            group.rows
                              .length
                          }{" "}
                          entries
                        </span>
                      </div>

                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                            <th className="w-12 px-3 py-2.5 text-center">
                              Pos
                            </th>
                            <th className="px-3 py-2.5 text-left">
                              Player
                            </th>
                            <th className="w-12 px-2 py-2.5 text-center">
                              P
                            </th>
                            <th className="w-12 px-2 py-2.5 text-center">
                              W
                            </th>
                            <th className="w-12 px-2 py-2.5 text-center">
                              L
                            </th>
                            <th className="w-14 px-2 py-2.5 text-center">
                              PF
                            </th>
                            <th className="w-14 px-2 py-2.5 text-center">
                              PA
                            </th>
                            <th className="w-14 px-2 py-2.5 text-center">
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
                                className="border-b border-slate-100 last:border-b-0"
                              >
                                <td className="px-3 py-2.5 text-center font-semibold text-slate-500">
                                  {index +
                                    1}
                                </td>

                                <td className="px-3 py-2.5 font-medium text-slate-900">
                                  {
                                    row.displayName
                                  }
                                  {row.seed !==
                                  null
                                    ? ` (${row.seed})`
                                    : ""}
                                </td>

                                <td className="px-2 py-2.5 text-center">
                                  {
                                    row.played
                                  }
                                </td>

                                <td className="px-2 py-2.5 text-center font-semibold">
                                  {row.won}
                                </td>

                                <td className="px-2 py-2.5 text-center">
                                  {row.lost}
                                </td>

                                <td className="px-2 py-2.5 text-center">
                                  {
                                    row.pointsFor
                                  }
                                </td>

                                <td className="px-2 py-2.5 text-center">
                                  {
                                    row.pointsAgainst
                                  }
                                </td>

                                <td className="px-2 py-2.5 text-center font-semibold">
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

                    <div className="rr-report-matches border border-slate-200 bg-white">
                      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <h4 className="font-semibold text-slate-950">
                          Match results
                        </h4>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {groupMatches.map(
                          (match) => (
                            <div
                              key={
                                match.id
                              }
                              className="rr-report-match-row grid gap-1 px-4 py-3 text-sm sm:grid-cols-[90px_1fr_auto]"
                            >
                              <div className="text-xs font-semibold text-slate-500">
                                Round{" "}
                                {
                                  match.roundNumber
                                }
                              </div>

                              <div className="min-w-0 text-slate-900">
                                <span
                                  className={
                                    match.winnerSide ===
                                    "A"
                                      ? "font-bold"
                                      : ""
                                  }
                                >
                                  {participantLabel(
                                    match.sideA,
                                  )}
                                </span>

                                <span className="mx-2 text-slate-400">
                                  vs
                                </span>

                                <span
                                  className={
                                    match.winnerSide ===
                                    "B"
                                      ? "font-bold"
                                      : ""
                                  }
                                >
                                  {participantLabel(
                                    match.sideB,
                                  )}
                                </span>

                                {match.finishType ===
                                "retirement" ? (
                                  <span className="ml-2 text-xs font-bold text-amber-700">
                                    RET
                                  </span>
                                ) : null}
                              </div>

                              <div className="font-mono font-bold tabular-nums text-slate-950">
                                {scoreLabel(
                                  match,
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </article>
                )
              },
            )
          : null}

        {!loading &&
        !error &&
        standings.length > 0 ? (
          <footer className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
            Ranking order: wins, points difference, points for, player name.
            Only completed matches contribute to standings.
          </footer>
        ) : null}
      </section>
    </>
  )
}
