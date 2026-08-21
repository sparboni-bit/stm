"use client"

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react"
import { useRouter } from "next/navigation"

import {
  completeCompetitionAction,
  getCompetitionCompletionStateAction,
  type CompetitionCompletionState,
} from "../actions/competitionCompletion"

type Props = {
  competitionId: string
}

export function CompetitionCompletionPanel({
  competitionId,
}: Props) {
  const router = useRouter()

  const [state, setState] =
    useState<CompetitionCompletionState | null>(
      null,
    )
  const [loading, setLoading] = useState(true)
  const [error, setError] =
    useState<string | null>(null)
  const [pending, startTransition] =
    useTransition()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setState(
        await getCompetitionCompletionStateAction(
          competitionId,
        ),
      )
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to evaluate Competition completion.",
      )
    } finally {
      setLoading(false)
    }
  }, [competitionId])

  useEffect(() => {
    void load()
  }, [load])

  function complete() {
    setError(null)

    startTransition(async () => {
      try {
        setState(
          await completeCompetitionAction(
            competitionId,
          ),
        )
        router.refresh()
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to complete the Competition.",
        )
      }
    })
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        Checking Competition completion...
      </section>
    )
  }

  if (!state) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
        {error ??
          "Competition completion state unavailable."}
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Competition completion
      </p>

      <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {state.alreadyCompleted
              ? "Competition completed"
              : state.canComplete
                ? "Ready to complete"
                : "Competition still in progress"}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {state.completedStages} /{" "}
            {state.totalStages} Stages completed
          </p>
        </div>

        {state.canComplete ? (
          <button
            type="button"
            disabled={pending}
            onClick={complete}
            className="inline-flex min-h-11 items-center justify-center bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {pending
              ? "Completing..."
              : "Complete Competition"}
          </button>
        ) : null}
      </div>

      {state.stages.length > 0 ? (
        <div className="mt-5 divide-y divide-slate-100 border border-slate-200">
          {state.stages.map((stage) => (
            <div
              key={stage.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {stage.sortOrder}. {stage.name}
                </p>
                {stage.championDisplayName ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    Winner:{" "}
                    {stage.championDisplayName}
                  </p>
                ) : null}
              </div>

              <span className="shrink-0 border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                {stage.status}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {!state.alreadyCompleted &&
      state.blockers.length > 0 ? (
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
