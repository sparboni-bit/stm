"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { undoMatchResultAction } from "../actions"
import type { MatchDetailView } from "../view"

type Props = {
  match: MatchDetailView
}

export function MatchUndoResult({ match }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (match.status !== "completed" || match.isBye) {
    return null
  }

  function undo() {
    setError(null)

    startTransition(async () => {
      try {
        await undoMatchResultAction({
          competitionId: match.competitionId,
          stageId: match.stageId,
          matchId: match.id,
        })

        setConfirming(false)
        router.refresh()
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to undo the result.",
        )
      }
    })
  }

  return (
    <section className="border border-amber-200 bg-amber-50 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
        Result correction
      </p>
      <h2 className="mt-1 text-base font-bold text-slate-950">
        Undo result
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Removes the saved score and winner propagation so the result can
        be entered again. Undo is blocked if the next match has already
        started or is completed.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 min-h-11 border border-amber-400 bg-white px-5 text-sm font-bold text-amber-800"
        >
          Undo result
        </button>
      ) : (
        <div className="mt-4 border border-amber-300 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">
            Remove this result and its propagated winner?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={undo}
              className="min-h-10 bg-slate-950 px-4 text-sm font-bold text-white disabled:bg-slate-300"
            >
              {pending ? "Undoing..." : "Confirm undo"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(false)}
              className="min-h-10 border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error ? (
        <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
    </section>
  )
}
