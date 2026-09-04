"use client"

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react"
import { useRouter } from "next/navigation"

import {
  completeStageAction,
  getStageCompletionStateAction,
  type StageCompletionState,
} from "../actions/stageCompletion"
import { useStage } from "../hooks"

export function StageCompletionPanel() {
  const stage = useStage()
  const router = useRouter()
  const [state, setState] = useState<StageCompletionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setState(await getStageCompletionStateAction(stage.id))
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to evaluate stage progress.",
      )
    } finally {
      setLoading(false)
    }
  }, [stage.id])

  useEffect(() => {
    void load()
  }, [load])

  function complete() {
    setError(null)

    startTransition(async () => {
      try {
        setState(await completeStageAction(stage.id))
        router.refresh()
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to complete the stage.",
        )
      }
    })
  }

  if (loading) {
    return (
      <div className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Checking stage progress...
      </div>
    )
  }

  if (!state) {
    return (
      <div className="border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
        {error ?? "Stage progress unavailable."}
      </div>
    )
  }

  return (
    <section className="border border-slate-200 bg-white p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Stage progress
      </p>

      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-950">
            {state.alreadyCompleted
              ? "Stage completed"
              : state.canComplete
                ? "Ready to complete"
                : "Stage still in progress"}
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {state.completedMatches} / {state.playableMatches} playable matches completed
            {state.byeMatches > 0 ? ` · ${state.byeMatches} BYE` : ""}
          </p>
        </div>

        {state.canComplete ? (
          <button
            type="button"
            disabled={pending}
            onClick={complete}
            className="min-h-11 bg-slate-950 px-5 text-sm font-bold text-white disabled:bg-slate-300"
          >
            {pending ? "Completing..." : "Complete stage"}
          </button>
        ) : null}
      </div>

      {state.championDisplayName ? (
        <div className="mt-4 border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            Stage winner
          </p>
          <p className="mt-1 text-lg font-bold text-emerald-950">
            {state.championDisplayName}
          </p>
        </div>
      ) : null}

      {!state.alreadyCompleted && state.blockers.length > 0 ? (
        <div className="mt-4 border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
            Completion requirements
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {state.blockers.map((blocker) => (
              <li key={blocker}>• {blocker}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
    </section>
  )
}
