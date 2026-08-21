"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { startMatchAction } from "../actions"
import type { MatchDetailView } from "../view"

type Props = {
  match: MatchDetailView
}

export function MatchLiveControls({ match }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (match.isBye || match.status === "completed") {
    return null
  }

  function run(action: () => Promise<void>) {
    setError(null)

    startTransition(async () => {
      try {
        await action()
        router.refresh()
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to update match status.",
        )
      }
    })
  }

  return (
    <section className="border border-slate-200 bg-white p-4 sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Live operations
      </p>
      <h2 className="mt-1 text-base font-bold text-slate-950">
        Match flow
      </h2>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {match.status === "pending" || match.status === "ready" ? (
          <button
            type="button"
            disabled={pending || !match.courtId}
            onClick={() =>
              run(() =>
                startMatchAction({
                  competitionId: match.competitionId,
                  stageId: match.stageId,
                  matchId: match.id,
                }),
              )
            }
            className="min-h-11 w-full bg-slate-950 px-5 text-sm font-bold text-white disabled:bg-slate-300 sm:w-auto"
          >
            {pending ? "Starting..." : "Start match"}
          </button>
        ) : null}

        {match.status === "on_court" ? (
          <div className="border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">
            ● LIVE
            {match.courtLabel ? ` · ${match.courtLabel}` : ""}
          </div>
        ) : null}
      </div>

      {(match.status === "pending" || match.status === "ready") &&
      !match.courtId ? (
        <p className="mt-3 text-sm font-medium text-amber-700">
          Assign an available court before starting the match.
        </p>
      ) : null}

      {error ? (
        <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
    </section>
  )
}
