"use client"

import { useEffect, useMemo, useState } from "react"

import { useStage } from "../../../../competition-stages/hooks"
import { getEliminationReportViewAction } from "../actions/getEliminationReportViewAction"
import type {
  BracketViewMatch,
  BracketViewModel,
  BracketViewParticipant,
} from "../view"

function participantLabel(
  participant: BracketViewParticipant,
): string {
  if (
    participant.slotType === "bye" ||
    participant.displayName === "BYE"
  ) {
    return "BYE"
  }

  const seed =
    participant.seed !== null
      ? `(${participant.seed}) `
      : ""

  return `${seed}${participant.displayName}`
}

function scoreLabel(match: BracketViewMatch): string {
  if (match.isBye) {
    return "BYE"
  }

  if (match.score.sets.length > 0) {
    return match.score.sets
      .map(
        (set) =>
          `${set.a ?? "–"}-${set.b ?? "–"}`,
      )
      .join("  ")
  }

  if (
    match.score.valueA !== null ||
    match.score.valueB !== null
  ) {
    return `${match.score.valueA ?? "–"}-${match.score.valueB ?? "–"}`
  }

  return "—"
}

function winner(
  match: BracketViewMatch,
): BracketViewParticipant | null {
  if (match.winnerSide === "A") {
    return match.sideA
  }

  if (match.winnerSide === "B") {
    return match.sideB
  }

  return null
}

function loser(
  match: BracketViewMatch,
): BracketViewParticipant | null {
  if (match.winnerSide === "A") {
    return match.sideB
  }

  if (match.winnerSide === "B") {
    return match.sideA
  }

  return null
}

export function EliminationReportsSection() {
  const stage = useStage()

  const [view, setView] =
    useState<BracketViewModel | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)

    void getEliminationReportViewAction(stage.id)
      .then((result) => {
        if (active) {
          setView(result)
        }
      })
      .catch((cause) => {
        if (!active) return

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load Elimination report.",
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

  const finalMatch =
    useMemo(() => {
      if (!view || view.rounds.length === 0) {
        return null
      }

      const finalRound =
        view.rounds[
          view.rounds.length - 1
        ]

      return (
        finalRound.matches.find(
          (match) =>
            !match.isBye &&
            match.status === "completed" &&
            match.winnerSide !== null,
        ) ??
        finalRound.matches[0] ??
        null
      )
    }, [view])

  const champion =
    finalMatch
      ? winner(finalMatch)
      : null

  const finalist =
    finalMatch
      ? loser(finalMatch)
      : null

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

          .elimination-report-root,
          .elimination-report-root * {
            visibility: visible !important;
          }

          .elimination-report-root {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .elimination-report-no-print {
            display: none !important;
          }

          .elimination-report-round,
          .elimination-report-match {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>

      <section className="elimination-report-root space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Single Elimination · Final report
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {view?.stageName ?? stage.name}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Final result, bracket summary and match results.
            </p>
          </div>

          <button
            type="button"
            onClick={printReport}
            className="elimination-report-no-print min-h-11 border border-slate-950 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
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
        (!view || view.rounds.length === 0) ? (
          <div className="border border-dashed border-slate-300 px-4 py-10 text-center">
            <h3 className="font-semibold text-slate-950">
              No report available
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              No generated Elimination bracket was found for this Stage.
            </p>
          </div>
        ) : null}

        {!loading &&
        !error &&
        view &&
        view.rounds.length > 0 ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Champion
                </p>
                <p className="mt-2 text-xl font-bold text-slate-950">
                  {champion
                    ? participantLabel(champion)
                    : "—"}
                </p>
              </div>

              <div className="border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Finalist
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {finalist
                    ? participantLabel(finalist)
                    : "—"}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Final bracket
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">
                  Bracket summary
                </h3>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {view.rounds.map((round) => (
                  <article
                    key={round.number}
                    className="elimination-report-round border border-slate-200 bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <h4 className="font-bold text-slate-950">
                        {round.name}
                      </h4>
                      <span className="text-xs font-semibold text-slate-500">
                        {round.matches.length}{" "}
                        {round.matches.length === 1
                          ? "match"
                          : "matches"}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {round.matches.map((match) => (
                        <div
                          key={match.id}
                          className="elimination-report-match p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Match{" "}
                              {match.visibleMatchNumber ??
                                match.matchNumber}
                            </span>

                            {match.courtLabel ? (
                              <span className="text-[10px] font-semibold text-slate-500">
                                {match.courtLabel}
                              </span>
                            ) : null}
                          </div>

                          <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
                            <div
                              className={
                                match.winnerSide === "A"
                                  ? "font-bold text-slate-950"
                                  : "font-medium text-slate-700"
                              }
                            >
                              {participantLabel(match.sideA)}
                            </div>

                            <div
                              className={
                                match.winnerSide === "A"
                                  ? "font-bold tabular-nums text-slate-950"
                                  : "tabular-nums text-slate-700"
                              }
                            >
                              {match.score.sets.length > 0
                                ? match.score.sets
                                    .map(
                                      (set) =>
                                        set.a ?? "–",
                                    )
                                    .join("  ")
                                : match.score.valueA ?? "–"}
                            </div>

                            <div
                              className={
                                match.winnerSide === "B"
                                  ? "font-bold text-slate-950"
                                  : "font-medium text-slate-700"
                              }
                            >
                              {participantLabel(match.sideB)}
                            </div>

                            <div
                              className={
                                match.winnerSide === "B"
                                  ? "font-bold tabular-nums text-slate-950"
                                  : "tabular-nums text-slate-700"
                              }
                            >
                              {match.score.sets.length > 0
                                ? match.score.sets
                                    .map(
                                      (set) =>
                                        set.b ?? "–",
                                    )
                                    .join("  ")
                                : match.score.valueB ?? "–"}
                            </div>
                          </div>

                          {match.finishType === "retirement" ? (
                            <div className="mt-2 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                              Retirement
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Match results
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">
                  Results by round
                </h3>
              </div>

              {view.rounds.map((round) => (
                <article
                  key={`results-${round.number}`}
                  className="elimination-report-round border border-slate-200 bg-white"
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h4 className="font-semibold text-slate-950">
                      {round.name}
                    </h4>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {round.matches.map((match) => (
                      <div
                        key={`result-${match.id}`}
                        className="elimination-report-match grid gap-1 px-4 py-3 text-sm sm:grid-cols-[90px_1fr_auto]"
                      >
                        <div className="text-xs font-semibold text-slate-500">
                          Match{" "}
                          {match.visibleMatchNumber ??
                            match.matchNumber}
                        </div>

                        <div className="min-w-0 text-slate-900">
                          <span
                            className={
                              match.winnerSide === "A"
                                ? "font-bold"
                                : ""
                            }
                          >
                            {participantLabel(match.sideA)}
                          </span>

                          <span className="mx-2 text-slate-400">
                            vs
                          </span>

                          <span
                            className={
                              match.winnerSide === "B"
                                ? "font-bold"
                                : ""
                            }
                          >
                            {participantLabel(match.sideB)}
                          </span>

                          {match.finishType === "retirement" ? (
                            <span className="ml-2 text-xs font-bold text-amber-700">
                              RET
                            </span>
                          ) : null}
                        </div>

                        <div className="font-mono font-bold tabular-nums text-slate-950">
                          {scoreLabel(match)}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>

            <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">
              {view.rounds.length} rounds · {view.matchCount} matches
            </footer>
          </>
        ) : null}
      </section>
    </>
  )
}
