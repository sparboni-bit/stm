"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { useStage } from "../../competition-stages/hooks"
import { listStageMatchesAction } from "../actions"
import type {
  MatchDetailView,
  MatchParticipantView,
} from "../view"

function participantLabel(
  participant: MatchParticipantView,
): string {
  const seed =
    participant.seed !== null
      ? `(${participant.seed}) `
      : ""

  return `${seed}${participant.displayName}`
}

function statusLabel(match: MatchDetailView): string {
  if (match.isBye) return "BYE"

  switch (match.status) {
    case "pending":
      return "Pending"
    case "ready":
      return "Ready"
    case "on_court":
      return "Live"
    case "completed":
      return "Completed"
    default:
      return match.status
  }
}

function singleSetScore(
  match: MatchDetailView,
  side: "A" | "B",
): string | null {
  const key = side === "A" ? "scoreA" : "scoreB"
  const legacyKey = side === "A" ? "a" : "b"

  const value =
    match.score[key] ??
    match.score[legacyKey]

  return typeof value === "number" || typeof value === "string"
    ? String(value)
    : null
}

function bestOf3Scores(
  match: MatchDetailView,
  side: "A" | "B",
): string[] {
  if (!Array.isArray(match.score.sets)) {
    return []
  }

  return match.score.sets
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null
      }

      const row = item as Record<string, unknown>
      const value = side === "A" ? row.a : row.b

      return typeof value === "number" || typeof value === "string"
        ? String(value)
        : null
    })
    .filter((value): value is string => value !== null)
}

function ScoreBoxes({
  values,
  winner,
}: {
  values: string[]
  winner: boolean
}) {
  if (values.length === 0) {
    return null
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className={[
            "inline-flex h-8 min-w-8 items-center justify-center px-2 font-mono text-sm font-bold tabular-nums",
            winner
              ? "bg-slate-950 text-white"
              : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {value}
        </span>
      ))}
    </div>
  )
}

function matchScores(
  match: MatchDetailView,
  side: "A" | "B",
): string[] {
  if (Array.isArray(match.score.sets) && match.score.sets.length > 0) {
    return bestOf3Scores(match, side)
  }

  const single = singleSetScore(match, side)
  return single === null ? [] : [single]
}


export function StageMatchesSection({
  refreshKey = 0,
}: {
  refreshKey?: number
}) {
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

        if (active) {
          setMatches(result)
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load matches.",
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
  }, [stage.id, refreshKey])

  const rounds = useMemo(() => {
    const grouped = new Map<number, MatchDetailView[]>()

    for (const match of matches) {
      const current = grouped.get(match.roundNumber) ?? []
      current.push(match)
      grouped.set(match.roundNumber, current)
    }

    return Array.from(grouped.entries()).sort(
      ([roundA], [roundB]) => roundA - roundB,
    )
  }, [matches])


  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Match management
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Matches
        </h2>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          All matches generated for this stage, grouped by round.
        </p>
      </div>

      {loading ? (
        <div className="border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          Loading matches...
        </div>
      ) : null}

      {error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && matches.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
          <p className="text-sm font-semibold text-slate-900">
            No matches generated
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Generate the stage structure before opening match management.
          </p>
        </div>
      ) : null}

      {!loading && !error
        ? rounds.map(([roundNumber, roundMatches]) => (
            <div key={roundNumber} className="space-y-3">
              <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Stage round
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-950">
                    Round {roundNumber}
                  </h3>
                </div>

                <span className="text-xs font-semibold text-slate-400">
                  {roundMatches.length}{" "}
                  {roundMatches.length === 1 ? "match" : "matches"}
                </span>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {roundMatches.map((match) => {
                  const href =
                    `/competitions/${stage.competitionId}` +
                    `/stages/${stage.id}` +
                    `/matches/${match.id}`

                  const scoresA = matchScores(match, "A")
                  const scoresB = matchScores(match, "B")

                const content = (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                          Match{" "}
                          {match.visibleMatchNumber ??
                            match.matchNumber}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {match.isBye
                            ? "No court required"
                            : match.courtLabel ??
                              "Court not assigned"}
                        </p>

                        {!match.isBye &&
                        match.scheduledAt ? (
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">
                            {new Intl.DateTimeFormat(
                              undefined,
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              },
                            ).format(
                              new Date(
                                match.scheduledAt,
                              ),
                            )}
                          </p>
                        ) : null}
                      </div>

                      <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {statusLabel(match)}
                      </span>
                    </div>

                    <div className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
                      <div
                        className={[
                          "flex min-h-11 items-center justify-between gap-2 py-2",
                          match.winnerSide === "A"
                            ? "font-bold text-slate-950"
                            : "font-medium text-slate-700",
                        ].join(" ")}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="break-words leading-5 sm:truncate">
                            {participantLabel(
                              match.sideA,
                            )}
                          </span>

                          {match.finishType === "retirement" &&
                          match.retiredSide === "A" ? (
                            <span className="shrink-0 border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                              RET
                            </span>
                          ) : null}
                        </span>

                        <ScoreBoxes
                          values={scoresA}
                          winner={
                            match.winnerSide ===
                            "A"
                          }
                        />
                      </div>

                      <div
                        className={[
                          "flex min-h-11 items-center justify-between gap-2 py-2",
                          match.winnerSide === "B"
                            ? "font-bold text-slate-950"
                            : "font-medium text-slate-700",
                        ].join(" ")}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="break-words leading-5 sm:truncate">
                            {participantLabel(
                              match.sideB,
                            )}
                          </span>

                          {match.finishType === "retirement" &&
                          match.retiredSide === "B" ? (
                            <span className="shrink-0 border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                              RET
                            </span>
                          ) : null}
                        </span>

                        <ScoreBoxes
                          values={scoresB}
                          winner={
                            match.winnerSide ===
                            "B"
                          }
                        />
                      </div>
                    </div>
                  </>
                )

                if (match.isBye) {
                  return (
                    <div
                      key={match.id}
                      className="block cursor-default border border-slate-200 bg-slate-50 p-3 sm:p-4"
                    >
                      {content}
                    </div>
                  )
                }

                return (
                  <Link
                    key={match.id}
                    href={href}
                    className="block min-h-11 border border-slate-200 bg-white p-3 shadow-sm transition sm:p-4 hover:-translate-y-px hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                  >
                    {content}
                  </Link>
                )                  
                  
                  
                })}
              </div>
            </div>
          ))
        : null}

    </section>
  )
}
