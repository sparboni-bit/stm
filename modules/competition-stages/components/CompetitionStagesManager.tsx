"use client"

import Link from "next/link"

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react"

import {
  createCompetitionStageAction,
  type CreateCompetitionStageActionState,
} from "../actions/createCompetitionStage"

import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

import {
  deleteCompetitionStageAction,
} from "../actions/deleteCompetitionStage"

import type {
  CompetitionStage,
  CompetitionStageStatus,
  CompetitionStageType,
} from "../types"

type CompetitionStagesManagerProps = {
  competitionId: string
  stages: CompetitionStage[]
  locked?: boolean
}

const initialCreateState: CreateCompetitionStageActionState = {
  success: false,
  message: "",
}

const stageTypeOptions: Array<{
  value: CompetitionStageType
  label: string
}> = [
  {
    value: "individual_rotation",
    label: "Individual Rotation",
  },
  {
    value: "round_robin",
    label: "Round Robin",
  },
  {
    value: "elimination",
    label: "Elimination",
  },
]

const stageTypeLabels: Record<
  CompetitionStageType,
  string
> = {
  round_robin: "Round Robin",
  elimination: "Elimination",
  consolation: "Consolation",
  swiss: "Swiss",
  ladder: "Ladder",
  individual_rotation: "Individual Rotation",
}

/*
 * DB values remain unchanged.
 *
 * draft       -> Setup
 * configured  -> Ready
 * generated   -> Generated
 * running     -> Running
 * completed   -> Completed
 */
const stageStatusLabels: Record<
  CompetitionStageStatus,
  string
> = {
  draft: "Setup",
  configured: "Ready",
  generated: "Generated",
  running: "Running",
  completed: "Completed",
}

const stageStatusClasses: Record<
  CompetitionStageStatus,
  string
> = {
  draft:
    "border-slate-200 bg-slate-50 text-slate-600",

  configured:
    "border-amber-300 bg-amber-50 text-amber-900",

  generated:
    "border-sky-200 bg-sky-50 text-sky-800",

  running:
    "border-emerald-200 bg-emerald-50 text-emerald-800",

  completed:
    "border-slate-300 bg-slate-200 text-slate-700",
}

export function CompetitionStagesManager({
  competitionId,
  stages,
  locked = false,
}: CompetitionStagesManagerProps) {
  const formRef =
    useRef<HTMLFormElement>(null)

  const deleteFormRef =
    useRef<HTMLFormElement>(null)

  const [
    stageToDelete,
    setStageToDelete,
  ] = useState<CompetitionStage | null>(
    null,
  )

  const createAction =
    createCompetitionStageAction.bind(
      null,
      competitionId,
    )

  const [
    createState,
    createFormAction,
    createPending,
  ] = useActionState(
    createAction,
    initialCreateState,
  )

  useEffect(() => {
    if (createState.success) {
      formRef.current?.reset()
    }
  }, [createState.success])

  return (
    <div className="space-y-4">
      {/* EVENT FORMAT */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Event format
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            Stages
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Add the stages that make up this event.
            Each stage can use a different format.
          </p>
        </div>

        {locked ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Event format locked
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Stages cannot be added after the event
              has been generated.
            </p>
          </div>
        ) : (
          <form
            ref={formRef}
            action={createFormAction}
            className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)_auto] md:items-end"
          >
            <div>
              <label
                htmlFor="stage-name"
                className="block text-sm font-semibold text-slate-700"
              >
                Stage name
              </label>

              <input
                id="stage-name"
                name="name"
                type="text"
                maxLength={100}
                placeholder="Optional — e.g. IR1, RR1, EL1 is generated automatically"
                disabled={createPending}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="stage-type"
                className="block text-sm font-semibold text-slate-700"
              >
                Format
              </label>

              <select
                id="stage-type"
                name="stageType"
                defaultValue="round_robin"
                disabled={createPending}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {stageTypeOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={createPending}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {createPending
                ? "Creating..."
                : "Add stage"}
            </button>

            {createState.message ? (
              <div
                className={[
                  "rounded-lg border px-3 py-2 text-sm md:col-span-3",
                  createState.success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700",
                ].join(" ")}
                role={
                  createState.success
                    ? "status"
                    : "alert"
                }
              >
                {createState.message}
              </div>
            ) : null}
          </form>
        )}
      </section>

      {/* STAGE LIST */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Stages
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {stages.length === 1
                ? "1 stage configured."
                : `${stages.length} stages configured.`}
            </p>
          </div>
        </div>

        {stages.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="text-base font-semibold text-slate-900">
              No stages yet
            </p>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Add the first stage and choose its
              format. A simple event may need only
              one stage.
            </p>
          </div>
        ) : (
          <ol className="mt-5 space-y-3">
            {stages.map((stage) => {
              const deleteAction =
                deleteCompetitionStageAction.bind(
                  null,
                  competitionId,
                )

              return (
                <li
                  key={stage.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    {/* STAGE NUMBER */}

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-[var(--arena-yellow)]">
                      {stage.sortOrder}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-slate-950">
                        {stage.name}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {/* FORMAT */}

                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {
                            stageTypeLabels[
                              stage.stageType
                            ]
                          }
                        </span>

                        {/* STATUS */}

                        <span
                          className={[
                            "rounded-lg border px-2.5 py-1 text-xs font-bold",
                            stageStatusClasses[
                              stage.status
                            ],
                          ].join(" ")}
                        >
                          {
                            stageStatusLabels[
                              stage.status
                            ]
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <Link
                      href={`/competitions/${competitionId}/stages/${stage.id}`}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 sm:flex-none"
                    >
                      Open stage
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        setStageToDelete(stage)
                      }
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Delete
                    </button>

                    {stageToDelete?.id ===
                    stage.id ? (
                      <>
                        <form
                          ref={deleteFormRef}
                          action={deleteAction}
                          className="hidden"
                        >
                          <input
                            type="hidden"
                            name="stageId"
                            value={stage.id}
                          />
                        </form>

                        <ConfirmDialog
                          open
                          title={`Delete stage "${stage.name}"?`}
                          description="This will permanently delete the stage, its matches, results and related data."
                          onCancel={() =>
                            setStageToDelete(null)
                          }
                          onConfirm={() => {
                            deleteFormRef.current?.requestSubmit()
                          }}
                        />
                      </>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </div>
  )
}