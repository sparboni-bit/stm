"use client"

import { useEffect, useMemo, useState } from "react"

import { useStage } from "../../../../competition-stages/hooks"
import {
  getIndividualRotationFairnessReportAction,
  type IndividualRotationFairnessReport,
} from "../actions/fairnessActions"

type RoundRest = {
  roundNumber: number
  resting: string[]
}

export function IndividualRotationRotationSection() {
  const stage = useStage()
  const [report, setReport] =
    useState<IndividualRotationFairnessReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const result =
          await getIndividualRotationFairnessReportAction(stage.id)

        if (active) {
          setReport(result)
        }
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load rotation.",
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

  const rounds = useMemo<RoundRest[]>(() => {
    if (!report) return []

    return report.playRestMatrix.rounds.map(
      (roundNumber, roundIndex) => ({
        roundNumber,
        resting: report.playRestMatrix.players
          .filter(
            (player) =>
              player.states[roundIndex] !== "play",
          )
          .map((player) => player.displayName),
      }),
    )
  }, [report])

  if (loading) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
        Loading rotation…
      </section>
    )
  }

  if (error || !report) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
        {error ?? "Unable to load rotation."}
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
          Individual Rotation
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">
          Rotation
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Players resting in each generated round.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {rounds.map((round, index) => (
          <div
            key={round.roundNumber}
            className={[
              "flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
              index > 0 ? "border-t border-neutral-200" : "",
            ].join(" ")}
          >
            <span className="text-sm font-black text-neutral-950">
              Round {round.roundNumber}
            </span>

            <span className="text-sm text-neutral-600">
              {round.resting.length > 0
                ? `Out: ${round.resting.join(" · ")}`
                : "Everyone plays"}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
