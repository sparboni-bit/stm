"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  useStage,
  useStageActions,
} from "../../../../competition-stages/hooks"
import {
  getIndividualRotationFairnessPreviewAction,
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

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string | number
  detail?: string
}) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs font-medium text-slate-500">
          {detail}
        </p>
      ) : null}
    </div>
  )
}

function PlayRestMatrix({
  matrix,
}: {
  matrix: IndividualRotationFairnessReport["playRestMatrix"]
}) {
  return (
    <div className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Participation by round
        </p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950">
          Play / Rest matrix
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          A round-by-round view of who plays and who rests.
          Consecutive rests are highlighted.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <th className="sticky left-0 z-20 min-w-[150px] border-r border-slate-200 bg-slate-50 px-3 py-3 text-left sm:min-w-[190px]">
                Player
              </th>
              {matrix.rounds.map((roundNumber) => (
                <th
                  key={roundNumber}
                  className="min-w-14 px-3 py-3 text-center"
                >
                  R{roundNumber}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {matrix.players.map((player) => (
              <tr
                key={player.playerId}
                className="border-b border-slate-200 last:border-b-0"
              >
                <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-3 font-semibold text-slate-900">
                  {player.seed ? (
                    <span className="mr-2 text-xs font-bold text-slate-400">
                      ({player.seed})
                    </span>
                  ) : null}
                  {player.displayName}
                </td>

                {player.states.map((state, index) => (
                  <td
                    key={`${player.playerId}-${matrix.rounds[index]}`}
                    className="px-3 py-3 text-center"
                    title={
                      state === "play"
                        ? `Plays round ${matrix.rounds[index]}`
                        : state === "warning"
                          ? `Consecutive rest around round ${matrix.rounds[index]}`
                          : `Rests round ${matrix.rounds[index]}`
                    }
                  >
                    {state === "play" ? (
                      <span
                        aria-label="Plays"
                        className="inline-flex h-7 w-7 items-center justify-center border border-slate-900 bg-slate-900 text-xs font-bold text-white"
                      >
                        ✓
                      </span>
                    ) : state === "warning" ? (
                      <span
                        aria-label="Consecutive rest"
                        className="inline-flex h-7 w-7 items-center justify-center border border-amber-300 bg-amber-50 text-xs font-bold text-amber-800"
                      >
                        !
                      </span>
                    ) : (
                      <span
                        aria-label="Rests"
                        className="inline-flex h-7 w-7 items-center justify-center border border-slate-200 bg-slate-50 text-xs font-bold text-slate-400"
                      >
                        —
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 px-4 py-3 text-xs font-medium text-slate-500">
        <span>
          <strong className="text-slate-900">✓</strong> Plays
        </span>
        <span>
          <strong className="text-slate-500">—</strong> Rests
        </span>
        <span>
          <strong className="text-amber-700">!</strong> Consecutive rest
        </span>
      </div>
    </div>
  )
}

export function IndividualRotationFairnessSection() {
  const stage = useStage()
  const router = useRouter()
  const { generateStage, refresh } =
    useStageActions()

  const generated =
    stage.status === "generated" ||
    stage.status === "running" ||
    stage.status === "completed"

  const [report, setReport] =
    useState<IndividualRotationFairnessReport | null>(
      null,
    )
  const [loading, setLoading] = useState(true)
  const [error, setError] =
    useState<string | null>(null)
  const [generating, setGenerating] =
    useState(false)
  const [generationMessage, setGenerationMessage] =
    useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const result =
          generated
            ? await getIndividualRotationFairnessReportAction(
                stage.id,
              )
            : await getIndividualRotationFairnessPreviewAction(
                stage.id,
              )

        if (active) {
          setReport(result)
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to calculate fairness.",
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
  }, [generated, stage.id])

  async function handleApproveAndGenerate() {
    if (generated || generating) {
      return
    }

    setGenerating(true)
    setGenerationMessage(null)
    setError(null)

    try {
      await generateStage()
      setGenerationMessage(
        "Phase generated successfully.",
      )
      refresh()
      router.push("?section=play")
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to generate the phase.",
      )
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <section>
        <div className="border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          Calculating fairness...
        </div>
      </section>
    )
  }

  if (error || !report) {
    return (
      <section>
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error ?? "Unable to calculate fairness."}
        </div>
      </section>
    )
  }

  const { metrics } = report

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Fairness analysis
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          {generated
            ? "Generated schedule audit"
            : "Fairness Preview"}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          {generated
            ? "Analysis of the schedule generated for this phase. Match results do not affect these metrics."
            : "Review the selected schedule before creating the phase matches. No matches have been saved yet."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Score"
          value={report.score}
          detail={gradeLabel(report.grade)}
        />
        <MetricCard
          label="Games / player"
          value={`${metrics.minMatchesPerPlayer}–${metrics.maxMatchesPerPlayer}`}
          detail={`${metrics.totalRounds} rounds · ${metrics.totalMatches} matches`}
        />
        <MetricCard
          label="Partner repeats"
          value={metrics.repeatedPartnerRelations}
          detail={`Max partner count ${metrics.maxPartnerCount}`}
        />
        <MetricCard
          label="Opponent repeats"
          value={metrics.repeatedOpponentRelations}
          detail={`Max opponent count ${metrics.maxOpponentCount}`}
        />
      </div>

      <div className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Participation
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            Rotation balance
          </h3>
        </div>

        <dl className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [
              "Matches / player",
              `${metrics.minMatchesPerPlayer}–${metrics.maxMatchesPerPlayer}`,
            ],
            [
              "Participation spread",
              metrics.participationSpread,
            ],
            [
              "Sitouts / player",
              `${metrics.minSitoutsPerPlayer}–${metrics.maxSitoutsPerPlayer}`,
            ],
            [
              "Sitout spread",
              metrics.sitoutSpread,
            ],
            [
              "Consecutive sitouts",
              metrics.consecutiveSitouts,
            ],
            [
              "Seeded partnerships",
              metrics.seededPartnerships,
            ],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="bg-white px-4 py-4"
            >
              <dt className="text-xs font-semibold text-slate-500">
                {label}
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-slate-950">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <PlayRestMatrix matrix={report.playRestMatrix} />

      <div className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Player report
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            Individual rotation detail
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {report.playerCount} active players.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3">Player</th>
                <th className="px-3 py-3 text-center">P</th>
                <th className="px-3 py-3 text-center">Rest</th>
                <th className="px-3 py-3 text-center">Partners</th>
                <th className="px-3 py-3 text-center">Opponents</th>
                <th className="px-3 py-3 text-center">Partner rep.</th>
                <th className="px-3 py-3 text-center">Opponent rep.</th>
              </tr>
            </thead>
            <tbody>
              {metrics.playerStats.map((row) => (
                <tr
                  key={row.playerId}
                  className="border-b border-slate-200 last:border-b-0"
                >
                  <td className="px-3 py-3 font-semibold text-slate-900">
                    {row.seed ? (
                      <span className="mr-2 text-xs font-bold text-slate-400">
                        ({row.seed})
                      </span>
                    ) : null}
                    {row.displayName}
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums">
                    {row.played}
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums">
                    {row.rested}
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums">
                    {row.uniquePartners}
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums">
                    {row.uniqueOpponents}
                  </td>
                  <td className="px-3 py-3 text-center font-semibold tabular-nums">
                    {row.repeatedPartnerRelations}
                  </td>
                  <td className="px-3 py-3 text-center font-semibold tabular-nums">
                    {row.repeatedOpponentRelations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!generated ? (
        <div className="border border-slate-300 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Stage generation
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                Approve this fairness proposal
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Generate the matches only after reviewing this preview.
                Entries, seeds and Planner settings remain unchanged.
              </p>
            </div>

            <button
              type="button"
              onClick={handleApproveAndGenerate}
              disabled={generating}
              className="inline-flex min-h-11 w-full items-center justify-center bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
            >
              {generating
                ? "Generating..."
                : "Approve & Generate"}
            </button>
          </div>

          {generationMessage ? (
            <div className="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {generationMessage}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
