"use client"

import Link from "next/link"

import { CompetitionCompletionPanel } from "@/modules/competitions/components/CompetitionCompletionPanel"

import {
  useActionState,
  useEffect,
  useRef,
} from "react"

import {
  createCompetitionStageAction,
  type CreateCompetitionStageActionState,
} from "../actions/createCompetitionStage"

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
    value: "round_robin",
    label: "Round Robin",
  },
  {
    value: "elimination",
    label: "Elimination",
  },
  {
    value: "consolation",
    label: "Consolation",
  },
  {
    value: "individual_rotation",
    label: "Individual Rotation",
  },
  {
    value: "swiss",
    label: "Swiss",
  },
  {
    value: "ladder",
    label: "Ladder",
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

const stageStatusLabels: Record<
  CompetitionStageStatus,
  string
> = {
  draft: "Draft",
  configured: "Configured",
  generated: "Generated",
  running: "Running",
  completed: "Completed",
}

function canDeleteStage(
  status: CompetitionStageStatus,
): boolean {
  return (
    status === "draft" ||
    status === "configured"
  )
}

export function CompetitionStagesManager({
  competitionId,
  stages,
  locked = false,
}: CompetitionStagesManagerProps) {
  const formRef =
    useRef<HTMLFormElement>(null)

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
      <CompetitionCompletionPanel
        competitionId={competitionId}
      />
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tournament format
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            Stages
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Add the phases that make up this tournament. Each phase can use a different format.
          </p>
        </div>

        {locked ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Tournament format locked
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Phases cannot be added after the tournament has been generated.
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
                htmlFor="phase-name"
                className="block text-sm font-semibold text-slate-700"
              >
                Phase name
              </label>

              <input
                id="phase-name"
                name="name"
                type="text"
                required
                maxLength={100}
                placeholder="Example: Qualification"
                disabled={createPending}
                className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="phase-type"
                className="block text-sm font-semibold text-slate-700"
              >
                Format
              </label>

              <select
                id="phase-type"
                name="stageType"
                defaultValue="round_robin"
                disabled={createPending}
                className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
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
              className="inline-flex h-11 items-center justify-center bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {createPending
                ? "Creating..."
                : "Add phase"}
            </button>

            {createState.message ? (
              <div
                className={[
                  "md:col-span-3 rounded-lg border px-3 py-2 text-sm",
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

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Tournament phases
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {stages.length === 1
                ? "1 phase configured."
                : `${stages.length} phases configured.`}
            </p>
          </div>
        </div>

        {stages.length === 0 ? (
          <div className="mt-5 border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="text-base font-semibold text-slate-900">
              No phases yet
            </p>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Add the first phase and choose its format. A simple tournament may need only one phase.
            </p>
          </div>
        ) : (
          <ol className="mt-5 space-y-3">
            {stages.map((stage) => {
              const deletable =
                !locked &&
                canDeleteStage(stage.status)

              const deleteAction =
                deleteCompetitionStageAction.bind(
                  null,
                  competitionId,
                )

              return (
                <li
                  key={stage.id}
                  className="flex flex-col gap-3 border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-slate-900 text-sm font-bold text-white">
                      {stage.sortOrder}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {stage.name}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {
                            stageTypeLabels[
                              stage.stageType
                            ]
                          }
                        </span>

                        <span className="border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                          {
                            stageStatusLabels[
                              stage.status
                            ]
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Link
                      href={`/competitions/${competitionId}/stages/${stage.id}`}
                      className="inline-flex h-10 w-full items-center justify-center bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 sm:w-auto"
                    >
                      Open phase
                    </Link>

                    {deletable ? (
                      <form action={deleteAction}>
                        <input
                          type="hidden"
                          name="stageId"
                          value={stage.id}
                        />

                        <button
                          type="submit"
                          className="inline-flex h-10 w-full items-center justify-center border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 sm:w-auto"
                        >
                          Delete
                        </button>
                      </form>
                    ) : (
                      <span className="inline-flex h-10 items-center justify-center px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Locked
                      </span>
                    )}
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