"use client"

import Image from "next/image"
import {
  FormEvent,
  useMemo,
  useState,
} from "react"

import type {
  CompetitionEntry,
} from "@/modules/competition-entries/types"
import type {
  CompetitionStage,
  CompetitionStageType,
} from "@/modules/competition-stages/types"
import type {
  CompetitionStageEntry,
} from "@/modules/competition-stage-entries/types"

import {
  createGuestCompetitionStage,
  deleteGuestCompetitionStage,
} from "@/modules/guest-storage/services"

const availableStageTypes: Array<{
  value: CompetitionStageType
  label: string
}> = [
  { value: "individual_rotation", label: "Individual Rotation" },
  { value: "elimination", label: "Elimination" },
  { value: "round_robin", label: "Round Robin" },
]

function stageTypeLabel(value: CompetitionStageType) {
  return availableStageTypes.find((type) => type.value === value)?.label ?? value
}

function defaultStageName(
  type: CompetitionStageType,
  stages: CompetitionStage[],
) {
  const short =
    type === "individual_rotation"
      ? "IR"
      : type === "round_robin"
        ? "RR"
        : "EL"

  const count = stages.filter(
    (stage) => stage.stageType === type,
  ).length

  return `${short}${count + 1}`
}

function stageStatusLabel(status: CompetitionStage["status"]) {
  if (status === "draft") return "Setup"
  if (status === "configured") return "Ready"
  if (status === "generated") return "Generated"
  if (status === "running") return "In progress"
  if (status === "completed") return "Completed"
  return status
}

function stagePlayMode(stage: CompetitionStage): "singles" | "doubles" {
  if (stage.stageType === "individual_rotation") return "singles"
  return stage.settings?.playMode === "doubles" ? "doubles" : "singles"
}

export function GuestStagesManager({
  competitionId,
  stages,
  roster,
  stageEntries,
  matches,
  onChanged,
  onOpenStage,
  onOpenRoster,
}: {
  competitionId: string
  stages: CompetitionStage[]
  roster: CompetitionEntry[]
  stageEntries: CompetitionStageEntry[]
  matches: Array<{ stage_id: string }>
  onChanged: () => Promise<void>
  onOpenStage: (stageId: string) => void
  onOpenRoster?: () => void
}) {
  const [adding, setAdding] = useState(true)
  const [stageType, setStageType] =
    useState<CompetitionStageType>("individual_rotation")
  const [name, setName] = useState("")
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stageToDelete, setStageToDelete] = useState<CompetitionStage | null>(null)

  const suggestedName = useMemo(
    () => defaultStageName(stageType, stages),
    [stageType, stages],
  )

  async function run(operation: () => Promise<void>) {
    setWorking(true)
    setError(null)

    try {
      await operation()
      await onChanged()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Operation failed.",
      )
    } finally {
      setWorking(false)
    }
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const stageName = name.trim() || suggestedName

    void run(async () => {
      await createGuestCompetitionStage({
        competitionId,
        name: stageName,
        stageType,
        playMode: "singles",
      })

      setName("")
    })
  }

  return (
    <div className="mx-auto w-full max-w-[1040px]">
      <div className="mb-6 rounded-[18px] bg-neutral-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <Image
            src="/brand/logo_round_black.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0"
          />
          <p className="text-[13px] leading-5 text-neutral-950">
            <strong>Guest tournament.</strong>{" "}
            You can add as many stages as you like — Individual Rotation,
            Elimination, or Round Robin — and reuse the same player roster
            across all of them, picking whichever players you want for each stage.
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Tournament Management
            </p>
            <h1 className="mt-1 text-[28px] font-black leading-none tracking-[-0.03em] text-neutral-950 sm:text-[30px]">
              Stages
            </h1>
          </div>

          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="min-h-11 bg-[var(--arena-yellow)] px-4 text-sm font-bold text-[var(--arena-black)]"
            >
              + Add Stage
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {adding ? (
          <form
            onSubmit={handleCreate}
            className="mt-4 border border-neutral-200 bg-neutral-50 p-5 sm:max-w-[620px]"
          >
            <h2 className="text-lg font-bold text-neutral-950">
              Add Stage
            </h2>

            <div className="mt-4">
              <label
                htmlFor="guest-stage-type"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-950"
              >
                Format
              </label>

              <select
                id="guest-stage-type"
                value={stageType}
                disabled={working}
                onChange={(event) => {
                  setStageType(
                    event.target.value as CompetitionStageType,
                  )
                  setName("")
                }}
                className="min-h-[46px] w-full border border-neutral-300 bg-white px-3 text-sm font-semibold"
              >
                {availableStageTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label
                htmlFor="guest-stage-name"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-950"
              >
                Name{" "}
                <span className="font-normal normal-case text-slate-500">
                  (optional)
                </span>
              </label>

              <input
                id="guest-stage-name"
                value={name}
                disabled={working}
                onChange={(event) => setName(event.target.value)}
                placeholder={suggestedName}
                className="min-h-[46px] w-full border border-neutral-300 bg-white px-3 text-sm"
              />
            </div>

            <button
              disabled={working}
              className="mt-4 min-h-[46px] w-full bg-[var(--arena-yellow)] px-4 text-sm font-bold text-[var(--arena-black)] disabled:opacity-50"
            >
              Add Stage
            </button>
          </form>
        ) : null}

        <p className="mt-4 text-sm text-slate-500">
          <strong className="font-bold text-neutral-950">
            {roster.length} player{roster.length === 1 ? "" : "s"}
          </strong>{" "}
          available in the Tournament roster.
        </p>
      </section>

      {stages.length > 0 ? (
        <section className="mt-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Select the working stage
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {stages.map((stage) => {
              const assignedEntries = stageEntries.filter(
                (item) => item.stage_id === stage.id,
              ).length

              const entryLabel =
                stage.stageType !== "individual_rotation" &&
                stagePlayMode(stage) === "doubles"
                  ? "team"
                  : "player"

              const matchCount = matches.filter(
                (item) => item.stage_id === stage.id,
              ).length

              return (
                <article
                  key={stage.id}
                  className="border border-neutral-200 bg-white p-4"
                >
                  <button
                    type="button"
                    onClick={() => onOpenStage(stage.id)}
                    className="block w-full text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-neutral-950 text-sm font-black text-[var(--arena-yellow)]">
                        {stage.sortOrder}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          {stageTypeLabel(stage.stageType)}
                          {stage.stageType !== "individual_rotation"
                            ? ` · ${
                                stagePlayMode(stage) === "doubles"
                                  ? "Doubles"
                                  : "Singles"
                              }`
                            : ""}
                        </p>

                        <h2 className="mt-0.5 break-words text-lg font-black leading-tight text-neutral-950">
                          {stage.name}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {assignedEntries} {entryLabel}
                          {assignedEntries === 1 ? "" : "s"}
                          {matchCount > 0
                            ? ` · ${matchCount} matches`
                            : ""}
                          {" · "}
                          {stageStatusLabel(stage.status)}
                        </p>
                      </div>

                      <span
                        aria-hidden="true"
                        className="shrink-0 text-xl leading-none text-slate-500"
                      >
                        ›
                      </span>
                    </div>
                  </button>

                  <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3">
                    <button
                      type="button"
                      onClick={() => onOpenStage(stage.id)}
                      className="min-h-9 rounded-[7px] bg-neutral-950 px-5 text-sm font-bold text-white"
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      disabled={working}
                      onClick={() => setStageToDelete(stage)}
                      className="px-2 py-2 text-xs font-semibold text-slate-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : (
        !adding ? (
          <section className="mt-5 border border-dashed border-neutral-300 px-4 py-10 text-center">
            <p className="font-bold text-neutral-950">
              No stages yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first tournament stage.
            </p>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="mt-4 min-h-11 bg-[var(--arena-yellow)] px-5 text-sm font-bold text-[var(--arena-black)]"
            >
              + Add Stage
            </button>
          </section>
        ) : null
      )}
    
      {stageToDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="guest-delete-stage-title" className="w-full max-w-sm rounded-[18px] border border-neutral-200 bg-white p-5 shadow-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-600">Delete stage</p>
            <h2 id="guest-delete-stage-title" className="mt-1 text-xl font-black text-neutral-950">
              Delete {stageToDelete.name}?
            </h2>
            <p className="mt-3 text-sm leading-5 text-slate-600">
              All matches and results for this stage will also be removed. This cannot be undone.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={working}
                onClick={() => setStageToDelete(null)}
                className="min-h-11 rounded-[9px] border border-neutral-300 bg-white px-4 text-sm font-bold text-neutral-950"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={working}
                onClick={() => {
                  const stage = stageToDelete
                  setStageToDelete(null)
                  void run(() => deleteGuestCompetitionStage({ competitionId, stageId: stage.id }))
                }}
                className="min-h-11 rounded-[9px] border border-red-300 bg-white px-4 text-sm font-black text-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
</div>
  )
}
