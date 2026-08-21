"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react"

import {
  useStage,
  useStageActions,
} from "@/modules/competition-stages/hooks"

import {
  assignRoundRobinGroupsAction,
  getRoundRobinGroupsAction,
  swapRoundRobinGroupEntriesAction,
  type RoundRobinGroupView,
} from "../actions/groupActions"

type SelectedEntry = {
  stageEntryId: string
  displayName: string
  groupKey: string
}

export function RoundRobinGroupsSection() {
  const stage = useStage()
  const stageActions = useStageActions()

  const [groups, setGroups] =
    useState<RoundRobinGroupView[]>([])
  const [selected, setSelected] =
    useState<SelectedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] =
    useState<string | null>(null)
  const [isPending, startTransition] =
    useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const editable =
    stage.status === "draft" ||
    stage.status === "configured"

  const load = useCallback(async () => {
    setLoading(true)

    try {
      setGroups(
        await getRoundRobinGroupsAction(stage.id),
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load groups.",
      )
    } finally {
      setLoading(false)
    }
  }, [stage.id])

  useEffect(() => {
    void load()
  }, [load])

  const assignedCount = useMemo(
    () =>
      groups.reduce(
        (total, group) =>
          total + group.entries.length,
        0,
      ),
    [groups],
  )

  function toggleEntry(entry: SelectedEntry) {
    if (!editable || isPending) {
      return
    }

    setMessage(null)

    setSelected((current) => {
      const alreadySelected = current.some(
        (item) =>
          item.stageEntryId ===
          entry.stageEntryId,
      )

      if (alreadySelected) {
        return current.filter(
          (item) =>
            item.stageEntryId !==
            entry.stageEntryId,
        )
      }

      if (current.length === 0) {
        return [entry]
      }

      if (current[0].groupKey === entry.groupKey) {
        setMessage(
          "Choose the second entry from a different group.",
        )
        return current
      }

      return [current[0], entry]
    })
  }

  function assignGroups() {
    setMessage(null)
    setSelected([])

    startTransition(async () => {
      try {
        const result =
          await assignRoundRobinGroupsAction(
            stage.id,
          )

        setMessage(
          `Groups assigned · ${result.entryCount} entries · ` +
            result.sizes
              .map(
                (size, index) =>
                  `${String.fromCharCode(65 + index)} ${size}`,
              )
              .join(" · "),
        )

        await load()
        stageActions.refresh()
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to assign groups.",
        )
      }
    })
  }

  function generateMatches() {
    if (!editable || assignedCount === 0 || isPending) {
      return
    }

    setMessage(null)
    setSelected([])

    startTransition(async () => {
      try {
        await stageActions.generateStage()

        setMessage(
          "Round Robin matches generated successfully.",
        )

        stageActions.refresh()
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to generate Round Robin matches.",
        )
      }
    })
  }

  function swapEntries() {
    if (selected.length !== 2) {
      return
    }

    const [first, second] = selected
    setMessage(null)

    startTransition(async () => {
      try {
        await swapRoundRobinGroupEntriesAction(
          stage.id,
          first.stageEntryId,
          second.stageEntryId,
        )

        setMessage(
          `${first.displayName} ↔ ${second.displayName} · groups updated.`,
        )
        setSelected([])
        await load()
        stageActions.refresh()
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to swap entries.",
        )
      }
    })
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Round Robin
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Groups
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Review the balanced assignment and make manual swaps before generating matches.
          </p>
        </div>

        <button
          type="button"
          onClick={assignGroups}
          disabled={!mounted || !editable || isPending}
          className="min-h-11 border border-slate-950 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending
            ? "Working..."
            : assignedCount > 0
              ? "Reassign groups"
              : "Assign groups"}
        </button>
      </div>

      {assignedCount > 0 && editable ? (
        <div className="border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Manual swap
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Select one entry, then a second entry from another group.
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {selected.length === 0
                  ? "No entries selected."
                  : selected.length === 1
                    ? `${selected[0].displayName} · Group ${selected[0].groupKey} selected`
                    : `${selected[0].displayName} · Group ${selected[0].groupKey} ↔ ${selected[1].displayName} · Group ${selected[1].groupKey}`}
              </p>
            </div>

            <div className="flex gap-2">
              {selected.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  disabled={!mounted || isPending}
                  className="min-h-10 border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                >
                  Clear
                </button>
              ) : null}

              <button
                type="button"
                onClick={swapEntries}
                disabled={
                  selected.length !== 2 ||
                  isPending
                }
                className="min-h-10 border border-slate-950 bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Swap entries
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          Loading groups...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <article
              key={group.key}
              className="border border-slate-200 bg-white"
            >
              <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="font-semibold text-slate-950">
                  {group.name}
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {group.entries.length}{" "}
                  {group.entries.length === 1
                    ? "entry"
                    : "entries"}
                </span>
              </header>

              {group.entries.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">
                  No entries assigned.
                </div>
              ) : (
                <ol className="divide-y divide-slate-100">
                  {group.entries.map(
                    (entry, index) => {
                      const isSelected =
                        selected.some(
                          (item) =>
                            item.stageEntryId ===
                            entry.stageEntryId,
                        )

                      const firstSelection =
                        selected.length === 1
                          ? selected[0]
                          : null

                      const wrongGroup =
                        firstSelection !== null &&
                        firstSelection.groupKey ===
                          group.key &&
                        firstSelection.stageEntryId !==
                          entry.stageEntryId

                      return (
                        <li key={entry.stageEntryId}>
                          <button
                            type="button"
                            onClick={() =>
                              toggleEntry({
                                stageEntryId:
                                  entry.stageEntryId,
                                displayName:
                                  entry.displayName,
                                groupKey: group.key,
                              })
                            }
                            disabled={
                              !mounted ||
                              !editable ||
                              isPending ||
                              wrongGroup
                            }
                            className={`flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left ${
                              isSelected
                                ? "bg-slate-100"
                                : "bg-white"
                            } disabled:cursor-not-allowed disabled:opacity-45`}
                          >
                            <span className="w-6 text-xs font-semibold text-slate-400">
                              {index + 1}
                            </span>

                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                              {entry.displayName}
                            </span>

                            {entry.seed !== null ? (
                              <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">
                                Seed {entry.seed}
                              </span>
                            ) : null}

                            {isSelected ? (
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                                Selected
                              </span>
                            ) : null}
                          </button>
                        </li>
                      )
                    },
                  )}
                </ol>
              )}
            </article>
          ))}
        </div>
      )}

      {editable && assignedCount > 0 ? (
        <div className="border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Match generation
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-950">
                Groups ready
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                When the group composition is final, generate the Round Robin
                schedule. After generation, group assignment becomes locked and
                Matches will be enabled.
              </p>
            </div>

            <button
              type="button"
              onClick={generateMatches}
              disabled={!mounted || isPending}
              className="min-h-11 shrink-0 border border-slate-950 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? "Generating..." : "Generate matches"}
            </button>
          </div>
        </div>
      ) : null}

      {!editable ? (
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          Group assignment is locked because this Stage has already been generated.
        </div>
      ) : null}
    </section>
  )
}
