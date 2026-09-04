"use client"

import { useState, useTransition } from "react"
import { useStage } from "../../../../competition-stages/hooks"
import { StageMatchesSection } from "../../../../matches/components/StageMatchesSection"
import { addIndividualRotationRoundAction } from "../actions/addRoundAction"

export function IndividualRotationPlaySection() {
  const stage = useStage()
  const [matchesRevision, setMatchesRevision] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canAddRound = stage.status === "generated" || stage.status === "running"

  function handleAddRound() {
    if (!canAddRound || isPending) return
    setMessage(null)
    setError(null)
    startTransition(async () => {
      try {
        const result = await addIndividualRotationRoundAction(stage.id)
        setMessage(`Round ${result.roundNumber} added · ${result.matchCount} ${result.matchCount === 1 ? "match" : "matches"}`)
        setMatchesRevision((value) => value + 1)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to add another round.")
      }
    })
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Continue play</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Add another round</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Create one additional round using the current match history to preserve the best available player rotation and fairness.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddRound}
            disabled={!canAddRound || isPending}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            {isPending ? "Adding round..." : "Add Round"}
          </button>
        </div>
        {message ? <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</div> : null}
        {error ? <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
      </section>

      <StageMatchesSection refreshKey={matchesRevision} />
    </div>
  )
}
