"use client"

import { useEffect, useMemo, useState } from "react"

import { useStage } from "../../../../competition-stages/hooks"
import { listStageMatchesAction } from "../../../../matches/actions"
import {
  buildIndividualRotationStandings,
  type IndividualRotationStandingRow,
} from "../../../../matches/standings/individualRotationStandings"
import type {
  MatchDetailView,
  MatchParticipantView,
} from "../../../../matches/view"

import {
  getIndividualRotationFairnessReportAction,
  type IndividualRotationFairnessReport,
} from "../actions/fairnessActions"

function gradeLabel(
  grade: IndividualRotationFairnessReport["grade"],
): string {
  switch (grade) {
    case "excellent":
      return "Excellent"
    case "good":
      return "Good"
    case "acceptable":
      return "Acceptable"
    case "poor":
      return "Poor"
  }
}

function participantLabel(
  participant: MatchParticipantView,
): string {
  if (
    Array.isArray(participant.members) &&
    participant.members.length > 0
  ) {
    return participant.members
      .map((member) => {
        const seed =
          member.seed !== null
            ? `(${member.seed}) `
            : ""

        return `${seed}${member.displayName}`
      })
      .join(" / ")
  }

  const seed =
    participant.seed !== null
      ? `(${participant.seed}) `
      : ""

  return `${seed}${participant.displayName}`
}

function scoreLabel(
  match: MatchDetailView,
): string {
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
          return "–"
        }

        const row =
          item as Record<string, unknown>

        return `${row.a ?? "–"}-${row.b ?? "–"}`
      })
      .join("  ")
  }

  const a =
    match.score.scoreA ??
    match.score.a

  const b =
    match.score.scoreB ??
    match.score.b

  if (
    a === undefined &&
    b === undefined
  ) {
    return "—"
  }

  return `${a ?? "–"}-${b ?? "–"}`
}

function signed(value: number) {
  return value > 0
    ? `+${value}`
    : String(value)
}

export function IndividualRotationReportsSection() {
  const stage = useStage()

  const [matches, setMatches] =
    useState<MatchDetailView[]>([])

  const [fairness, setFairness] =
    useState<IndividualRotationFairnessReport | null>(
      null,
    )

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)

    void Promise.all([
      listStageMatchesAction(stage.id),
      getIndividualRotationFairnessReportAction(
        stage.id,
      ),
    ])
      .then(
        ([
          matchResult,
          fairnessResult,
        ]) => {
          if (!active) {
            return
          }

          setMatches(matchResult)
          setFairness(
            fairnessResult,
          )
        },
      )
      .catch((cause) => {
        if (!active) {
          return
        }

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load Individual Rotation report.",
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
    IndividualRotationStandingRow[] =
    useMemo(
      () =>
        buildIndividualRotationStandings(
          matches,
        ),
      [matches],
    )

  const rounds =
    useMemo(() => {
      const grouped =
        new Map<
          number,
          MatchDetailView[]
        >()

      for (const match of matches) {
        const roundNumber =
          match.roundNumber

        const current =
          grouped.get(
            roundNumber,
          ) ?? []

        current.push(match)

        grouped.set(
          roundNumber,
          current,
        )
      }

      return Array.from(
        grouped.entries(),
      )
        .sort(
          ([a], [b]) =>
            a - b,
        )
        .map(
          ([
            roundNumber,
            roundMatches,
          ]) => ({
            roundNumber,
            matches:
              roundMatches.sort(
                (a, b) =>
                  a.matchOrder -
                    b.matchOrder ||
                  a.matchNumber -
                    b.matchNumber,
              ),
          }),
        )
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

          .rotation-report-root,
          .rotation-report-root * {
            visibility: visible !important;
          }

          .rotation-report-root {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .rotation-report-no-print {
            display: none !important;
          }

          .rotation-report-block,
          .rotation-report-round,
          .rotation-report-match {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>

      <section className="rotation-report-root space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Individual Rotation · Final report
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {stage.name}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Final individual ranking, rounds and fairness summary.
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
            className="rotation-report-no-print min-h-11 border border-slate-950 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
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
        !error ? (
          <>
            <section className="rotation-report-block border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Final ranking
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-950">
                  Individual standings
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="w-12 px-3 py-3 text-center">
                        Pos
                      </th>
                      <th className="px-3 py-3 text-left">
                        Player
                      </th>
                      <th className="w-12 px-2 py-3 text-center">
                        P
                      </th>
                      <th className="w-12 px-2 py-3 text-center">
                        W
                      </th>
                      <th className="w-12 px-2 py-3 text-center">
                        D
                      </th>
                      <th className="w-12 px-2 py-3 text-center">
                        L
                      </th>
                      <th className="w-14 px-2 py-3 text-center">
                        PF
                      </th>
                      <th className="w-14 px-2 py-3 text-center">
                        PA
                      </th>
                      <th className="w-14 px-2 py-3 text-center">
                        +/-
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {standings.map(
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
                          <td className="px-3 py-3 text-center font-semibold text-slate-500">
                            {index + 1}
                          </td>

                          <td
                            className={
                              index === 0
                                ? "px-3 py-3 font-bold text-slate-950"
                                : "px-3 py-3 font-medium text-slate-900"
                            }
                          >
                            {
                              row.displayName
                            }
                          </td>

                          <td className="px-2 py-3 text-center">
                            {row.played}
                          </td>

                          <td className="px-2 py-3 text-center font-semibold">
                            {row.won}
                          </td>

                          <td className="px-2 py-3 text-center">
                            {row.drawn}
                          </td>

                          <td className="px-2 py-3 text-center">
                            {row.lost}
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
            </section>

            {fairness ? (
              <section className="rotation-report-block space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Fairness
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-950">
                    Final fairness summary
                  </h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Score
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {fairness.score}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {gradeLabel(
                        fairness.grade,
                      )}
                    </p>
                  </div>

                  <div className="border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Games / player
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {
                        fairness.metrics
                          .minMatchesPerPlayer
                      }
                      –
                      {
                        fairness.metrics
                          .maxMatchesPerPlayer
                      }
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {
                        fairness.metrics
                          .totalRounds
                      }{" "}
                      rounds ·{" "}
                      {
                        fairness.metrics
                          .totalMatches
                      }{" "}
                      matches
                    </p>
                  </div>

                  <div className="border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Partner repeats
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {
                        fairness.metrics
                          .repeatedPartnerRelations
                      }
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Max count{" "}
                      {
                        fairness.metrics
                          .maxPartnerCount
                      }
                    </p>
                  </div>

                  <div className="border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Opponent repeats
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {
                        fairness.metrics
                          .repeatedOpponentRelations
                      }
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Max count{" "}
                      {
                        fairness.metrics
                          .maxOpponentCount
                      }
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h4 className="font-semibold text-slate-950">
                      Rotation balance
                    </h4>
                  </div>

                  <dl className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      [
                        "Participation spread",
                        fairness.metrics
                          .participationSpread,
                      ],
                      [
                        "Sitouts / player",
                        `${fairness.metrics.minSitoutsPerPlayer}–${fairness.metrics.maxSitoutsPerPlayer}`,
                      ],
                      [
                        "Sitout spread",
                        fairness.metrics
                          .sitoutSpread,
                      ],
                      [
                        "Consecutive sitouts",
                        fairness.metrics
                          .consecutiveSitouts,
                      ],
                      [
                        "Seeded partnerships",
                        fairness.metrics
                          .seededPartnerships,
                      ],
                      [
                        "Players",
                        fairness.playerCount,
                      ],
                    ].map(
                      ([
                        label,
                        value,
                      ]) => (
                        <div
                          key={String(
                            label,
                          )}
                          className="bg-white px-4 py-4"
                        >
                          <dt className="text-xs font-semibold text-slate-500">
                            {label}
                          </dt>

                          <dd className="mt-1 text-lg font-bold tabular-nums text-slate-950">
                            {value}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                </div>
              </section>
            ) : null}

            <section className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Rounds
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-950">
                  Match results by round
                </h3>
              </div>

              {rounds.map(
                (round) => (
                  <article
                    key={
                      round.roundNumber
                    }
                    className="rotation-report-round border border-slate-200 bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <h4 className="font-semibold text-slate-950">
                        Round{" "}
                        {
                          round.roundNumber
                        }
                      </h4>

                      <span className="text-xs font-semibold text-slate-500">
                        {
                          round.matches
                            .length
                        }{" "}
                        matches
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {round.matches.map(
                        (match) => (
                          <div
                            key={
                              match.id
                            }
                            className="rotation-report-match grid gap-1 px-4 py-3 text-sm sm:grid-cols-[90px_1fr_auto]"
                          >
                            <div className="text-xs font-semibold text-slate-500">
                              {match.courtLabel ??
                                `Match ${match.visibleMatchNumber ?? match.matchNumber}`}
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
                  </article>
                ),
              )}
            </section>

            <footer className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
              Ranking order: wins, points difference, points for, player name.
              Fairness metrics describe the generated schedule and are independent
              from match results.
            </footer>
          </>
        ) : null}
      </section>
    </>
  )
}
