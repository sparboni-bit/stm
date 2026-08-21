"use client"

import {
  useState,
  useTransition,
} from "react"

import {
  useStage,
  useStageActions,
} from "@/modules/competition-stages/hooks"

import {
  saveRoundRobinStructureAction,
} from "../actions/saveRoundRobinStructureAction"

function readInitialGroupCount(
  settings: Record<string, unknown>,
): number {
  const value = settings.groupCount

  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 4
    ? value
    : 1
}

export function RoundRobinStructureSection() {
  const stage = useStage()
  const stageActions = useStageActions()

  const [groupCount, setGroupCount] =
    useState(() =>
      readInitialGroupCount(stage.settings),
    )

  const [message, setMessage] =
    useState<string | null>(null)

  const [isPending, startTransition] =
    useTransition()

  const editable =
    stage.status === "draft" ||
    stage.status === "configured"

  function changeGroupCount(delta: number) {
    setGroupCount((current) =>
      Math.min(
        4,
        Math.max(1, current + delta),
      ),
    )
  }

  function save() {
    setMessage(null)

    startTransition(async () => {
      try {
        await saveRoundRobinStructureAction({
          stageId: stage.id,
          groupCount,
        })

        setMessage("Structure saved.")
        stageActions.refresh()
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to save the Round Robin structure.",
        )
      }
    })
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Round Robin
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Structure
        </h2>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Configure how entries will be divided into groups before generating
          the Round Robin schedule.
        </p>
      </div>

      <div className="border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Play mode
            </p>

            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-900">
                <span className="h-2 w-2 rounded-full bg-slate-900" />
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Singles / Doubles
                </p>
                <p className="text-xs text-slate-500">
                  Play mode is determined by the participants in this phase.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Groups
            </p>

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => changeGroupCount(-1)}
                disabled={!editable || isPending || groupCount <= 1}
                className="h-10 w-10 border border-slate-300 bg-white text-lg font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease group count"
              >
                −
              </button>

              <div className="min-w-14 text-center">
                <div className="text-2xl font-bold text-slate-950">
                  {groupCount}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {groupCount === 1 ? "group" : "groups"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => changeGroupCount(1)}
                disabled={!editable || isPending || groupCount >= 4}
                className="h-10 w-10 border border-slate-300 bg-white text-lg font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase group count"
              >
                +
              </button>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Minimum 1, maximum 4 groups.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Distribution
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              Balanced
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Entries will be distributed as evenly as possible across groups.
            </p>
          </div>

          <div className="border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Seeding
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              Snake distribution
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Seeded entries will be spread across groups before unseeded
              entries are assigned.
            </p>
          </div>
        </div>

        {!editable && (
          <div className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            Structure is locked because this Stage has already been generated.
          </div>
        )}

        {message && (
          <div className="mt-4 border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {message}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={!editable || isPending}
            className="min-h-11 border border-slate-950 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "Saving..." : "Save structure"}
          </button>
        </div>
      </div>
    </section>
  )
}
