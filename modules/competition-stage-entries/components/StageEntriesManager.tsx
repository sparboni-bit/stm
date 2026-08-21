"use client"

import { useRouter } from "next/navigation"

import {
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react"

import type {
  CompetitionEntry,
} from "@/modules/competition-entries/types"

import {
  StageContext,
} from "@/modules/competition-stages/context/StageContext"

import type {
  CompetitionStageEntry,
} from "../types"

import {
  assignStageEntriesAction,
  removeAllStageEntriesAction,
  removeStageEntryAction,
  setStageEntrySeedAction,
} from "../actions/stageEntryActions"

type Props = {
  competitionId: string
  stageId: string
  roster: CompetitionEntry[]
  stageEntries: CompetitionStageEntry[]
  locked: boolean
}

export function StageEntriesManager({
  competitionId,
  stageId,
  roster,
  stageEntries,
  locked,
}: Props) {
  const router = useRouter()

  const stageContext =
    useContext(StageContext)

  if (!stageContext) {
    throw new Error(
      "StageEntriesManager must be used inside StageProvider.",
    )
  }

  const {
    stage,
    actions: {
      generateStage,
    },
  } = stageContext

  const [selected, setSelected] =
    useState<string[]>([])

  const [seedValues, setSeedValues] =
    useState<Record<string, string>>({})

  const [error, setError] =
    useState<string | null>(null)

  const [message, setMessage] =
    useState<string | null>(null)

  const [isPending, startTransition] =
    useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLocked = Boolean(locked)
  const controlsDisabled =
    !mounted || isLocked || Boolean(isPending)

  const byId = useMemo(
    () =>
      new Map(
        roster.map(
          (entry) => [
            entry.id,
            entry,
          ],
        ),
      ),
    [roster],
  )

  const assignedIds = useMemo(
    () =>
      new Set(
        stageEntries.map(
          (entry) =>
            entry.competition_entry_id,
        ),
      ),
    [stageEntries],
  )

  const available =
    roster.filter(
      (entry) =>
        entry.status === "active" &&
        !assignedIds.has(entry.id),
    )

  const activeStageEntries =
    stageEntries.filter(
      (entry) =>
        entry.status === "active",
    )

  const assignedCompetitionEntries =
    activeStageEntries
      .map((stageEntry) =>
        byId.get(stageEntry.competition_entry_id),
      )
      .filter(
        (entry): entry is CompetitionEntry =>
          Boolean(entry),
      )

  const assignedEntryTypes = new Set(
    assignedCompetitionEntries.map(
      (entry) => entry.entry_type,
    ),
  )

  const hasMixedEntryTypes =
    assignedEntryTypes.size > 1

  const stageEntryMode:
    | "singles"
    | "doubles"
    | null =
    assignedEntryTypes.size === 1
      ? assignedEntryTypes.has("team")
        ? "doubles"
        : "singles"
      : null

  const seededCount =
    activeStageEntries.filter(
      (entry) =>
        entry.seed !== null,
    ).length

  const canGenerate =
    !isLocked &&
    !hasMixedEntryTypes &&
    stage.status === "configured" &&
    activeStageEntries.length >= 2


  const generationHandledByEngine =
    stage.stageType === "round_robin"

  function run(
    fn: () => Promise<void>,
  ) {
    setError(null)
    setMessage(null)

    startTransition(async () => {
      try {
        await fn()
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Operation failed",
        )
      }
    })
  }

  function isEntryCompatible(
    entry: CompetitionEntry,
  ): boolean {
    if (stageEntryMode === null) {
      return true
    }

    return stageEntryMode === "doubles"
      ? entry.entry_type === "team"
      : entry.entry_type === "player"
  }

  function handleAssignSelected() {
    if (
      controlsDisabled ||
      selected.length === 0
    ) {
      return
    }

    const selectedEntries = selected
      .map((id) => byId.get(id))
      .filter(
        (entry): entry is CompetitionEntry =>
          Boolean(entry),
      )

    const selectedTypes = new Set(
      selectedEntries.map(
        (entry) => entry.entry_type,
      ),
    )

    if (selectedTypes.size > 1) {
      setError(
        "A phase cannot mix Singles and Doubles. Select only players or only teams.",
      )
      return
    }

    if (
      stageEntryMode === "singles" &&
      selectedTypes.has("team")
    ) {
      setError(
        "This phase is Singles. Remove its current participants before assigning Doubles teams.",
      )
      return
    }

    if (
      stageEntryMode === "doubles" &&
      selectedTypes.has("player")
    ) {
      setError(
        "This phase is Doubles. Remove its current participants before assigning Singles players.",
      )
      return
    }

    run(async () => {
      await assignStageEntriesAction(
        competitionId,
        stageId,
        selected,
      )

      setSelected([])
      router.refresh()
    })
  }

  function handleSaveSeeds() {
    if (controlsDisabled || stageEntries.length === 0) {
      return
    }

    const updates = stageEntries.map((stageEntry) => {
      const raw =
        seedValues[stageEntry.id] ??
        (stageEntry.seed === null
          ? ""
          : String(stageEntry.seed))

      const trimmed = raw.trim()
      const seed =
        trimmed === "" ? null : Number(trimmed)

      if (
        seed !== null &&
        (!Number.isInteger(seed) || seed < 1)
      ) {
        throw new Error(
          "Seed must be a positive integer.",
        )
      }

      return {
        stageEntry,
        seed,
      }
    })

    const nonNullSeeds = updates
      .map((item) => item.seed)
      .filter((seed): seed is number => seed !== null)

    if (
      new Set(nonNullSeeds).size !==
      nonNullSeeds.length
    ) {
      setError("Seeds must be unique.")
      return
    }

    run(async () => {
      for (const { stageEntry, seed } of updates) {
        if (seed === stageEntry.seed) {
          continue
        }

        await setStageEntrySeedAction(
          competitionId,
          stageId,
          stageEntry.id,
          seed,
        )
      }

      setMessage("Seeds saved successfully.")
      router.refresh()
    })
  }

  function handleGenerate() {
    if (
      !canGenerate ||
      isPending
    ) {
      return
    }

    run(async () => {
      await generateStage()

      setMessage(
        "Phase generated successfully.",
      )

      router.refresh()
    })
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Roster ({stageEntries.length})
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Choose who plays in this phase and set seeds when needed.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Format
          </span>

          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {hasMixedEntryTypes
              ? "Mixed — not allowed"
              : stageEntryMode === "doubles"
                ? "Doubles"
                : stageEntryMode === "singles"
                  ? "Singles"
                  : "Not set"}
          </span>
        </div>
      </div>

      {hasMixedEntryTypes && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          This phase contains both Singles and Doubles participants.
          Remove one type before generating the phase.
        </div>
      )}

      {isLocked && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          This phase has already been generated.
          Roster and seeds are locked.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-slate-200 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">
                Available
              </h3>

              <p className="text-xs text-slate-500">
                {available.length} available
              </p>
            </div>

            <button
              type="button"
              disabled={
                controlsDisabled ||
                available.length === 0
              }
              onClick={() =>
                setSelected(
                  available
                    .filter(isEntryCompatible)
                    .map(
                      (entry) =>
                        entry.id,
                    ),
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-50"
            >
              Select all
            </button>
          </div>

          <div className="max-h-96 space-y-2 overflow-auto">
            {available.map(
              (entry) => (
                <label
                  key={entry.id}
                  className={[
                    "flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2",
                    isEntryCompatible(entry)
                      ? "cursor-pointer"
                      : "cursor-not-allowed bg-slate-50 opacity-50",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    disabled={
                      controlsDisabled ||
                      !isEntryCompatible(entry)
                    }
                    checked={selected.includes(
                      entry.id,
                    )}
                    onChange={(e) =>
                      setSelected(
                        (old) =>
                          e.target.checked
                            ? [
                                ...old,
                                entry.id,
                              ]
                            : old.filter(
                                (id) =>
                                  id !==
                                  entry.id,
                              ),
                      )
                    }
                  />

                  <span className="min-w-0 flex-1 break-words text-sm font-medium leading-5">
                    {entry.display_name}
                  </span>

                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {entry.entry_type === "team"
                      ? "Doubles"
                      : "Singles"}
                  </span>
                </label>
              ),
            )}

            {available.length ===
              0 && (
              <p className="py-6 text-center text-sm text-slate-500">
                Everyone is already assigned.
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={
              controlsDisabled ||
              selected.length === 0
            }
            onClick={handleAssignSelected}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add selected (
            {selected.length})
          </button>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">
                In this phase
              </h3>

              <p className="text-xs text-slate-500">
                {stageEntries.length} participants
              </p>
            </div>

            <button
              type="button"
              disabled={
                controlsDisabled ||
                stageEntries.length === 0
              }
              onClick={() => {
                if (
                  !window.confirm(
                    "Remove all participants from this phase?",
                  )
                ) {
                  return
                }

                run(async () => {
                  await removeAllStageEntriesAction(
                    competitionId,
                    stageId,
                  )

                  router.refresh()
                })
              }}
              className="min-h-11 shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
            >
              Remove all
            </button>
          </div>

          <div className="space-y-2">
            {stageEntries.map(
              (stageEntry) => {
                const entry =
                  byId.get(
                    stageEntry.competition_entry_id,
                  )

                const raw =
                  seedValues[
                    stageEntry.id
                  ] ??
                  (stageEntry.seed ===
                  null
                    ? ""
                    : String(
                        stageEntry.seed,
                      ))

                return (
                  <div
                    key={
                      stageEntry.id
                    }
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="min-w-0 flex-1 break-words text-sm font-medium leading-5 text-slate-900">
                            {entry?.display_name ??
                              "Unknown entry"}
                          </p>

                          {entry ? (
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              {entry.entry_type === "team"
                                ? "Doubles"
                                : "Singles"}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={raw}
                        disabled={
                          controlsDisabled
                        }
                        onChange={(
                          e,
                        ) => {
                          const v =
                            e.target
                              .value

                          if (
                            v ===
                              "" ||
                            /^\d+$/.test(
                              v,
                            )
                          ) {
                            setSeedValues(
                              (
                                old,
                              ) => ({
                                ...old,
                                [stageEntry.id]:
                                  v,
                              }),
                            )
                          }
                        }}
                        placeholder="Seed"
                        className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 px-2 py-2 text-center text-sm font-semibold sm:w-20"
                      />


                      <button
                        type="button"
                        disabled={
                          controlsDisabled
                        }
                        onClick={() =>
                          run(
                            async () => {
                              await removeStageEntryAction(
                                competitionId,
                                stageId,
                                stageEntry.id,
                              )

                              router.refresh()
                            },
                          )
                        }
                        className="min-h-11 shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              },
            )}

            {stageEntries.length ===
              0 && (
              <p className="py-6 text-center text-sm text-slate-500">
                No participants in this phase.
              </p>
            )}
          </div>

          {stageEntries.length > 0 && !isLocked && (
            <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                disabled={controlsDisabled}
                onClick={() => {
                  try {
                    handleSaveSeeds()
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Unable to save seeds.",
                    )
                  }
                }}
                className="min-h-11 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isPending ? "Saving..." : "Save seeds"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GENERATION */}

      {generationHandledByEngine ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Next step
          </p>

          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            Groups
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Assign the groups, make any manual swaps, then generate the Round Robin
            matches from the Groups section.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Next step
              </p>

              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                Ready to generate
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Generate the phase using the participants and seeds shown above.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {activeStageEntries.length} participants
                </span>

                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {stageEntryMode === "doubles"
                    ? "Doubles"
                    : stageEntryMode === "singles"
                      ? "Singles"
                      : "Mode not set"}
                </span>

                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {seededCount} seeded
                </span>
              </div>

              {!isLocked && activeStageEntries.length < 2 && (
                <p className="mt-3 text-sm font-medium text-amber-700">
                  Add at least two participants before generating the phase.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!mounted || !canGenerate || isPending}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isPending
                ? "Generating..."
                : isLocked
                  ? "Phase generated"
                  : "Generate phase"}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}