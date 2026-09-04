"use client"

import { useRouter } from "next/navigation"
import { useContext, useMemo, useState, useTransition } from "react"

import type { CompetitionEntry } from "@/modules/competition-entries/types"
import { StageContext } from "@/modules/competition-stages/context/StageContext"
import type { CompetitionStageEntry } from "@/modules/competition-stage-entries/types"
import type { Roster } from "@/modules/rosters/types"
import { SavedRosterPicker } from "@/modules/rosters/components/SavedRosterPicker"
import {
  assignStageEntriesAction,
  removeAllStageEntriesAction,
  removeStageEntryAction,
  setStageEntrySeedAction,
} from "@/modules/competition-stage-entries/actions/stageEntryActions"

type Props = {
  competitionId: string
  stageId: string
  roster: CompetitionEntry[]
  stageEntries: CompetitionStageEntry[]
  savedRosters: Roster[]
  locked: boolean
}

export function IndividualRotationRosterPanel({
  competitionId,
  stageId,
  roster,
  stageEntries,
  savedRosters,
  locked,
}: Props) {
  const router = useRouter()
  const stageContext = useContext(StageContext)

  if (!stageContext) {
    throw new Error(
      "IndividualRotationRosterPanel must be used inside StageProvider.",
    )
  }

  const { stage } = stageContext

  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isLocked = Boolean(locked)
  const controlsDisabled = isLocked || isPending

  const activeStageEntries = useMemo(
    () => stageEntries.filter((entry) => entry.status === "active"),
    [stageEntries],
  )

  const seededCount = activeStageEntries.filter(
    (entry) => entry.seed !== null,
  ).length

  function refreshStageData() {
    window.dispatchEvent(
      new Event("stage-entries-changed"),
    )
    router.refresh()
  }

  function run(fn: () => Promise<void>) {
    setError(null)
    setMessage(null)

    startTransition(async () => {
      try {
        await fn()
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Operation failed",
        )
      }
    })
  }

  const players = roster.filter(
    (entry) =>
      entry.status === "active" &&
      entry.entry_type === "player" &&
      activeStageEntries.some(
        (stageEntry) =>
          stageEntry.competition_entry_id === entry.id,
      ),
  )

  const activeIds = new Set(
    activeStageEntries.map(
      (item) => item.competition_entry_id,
    ),
  )

  function toggleProtected(
    stageEntry: CompetitionStageEntry,
  ) {
    const protectedPlayer =
      stageEntry.seed !== null

    const nextSeed = protectedPlayer
      ? null
      : Math.max(
          1,
          ...activeStageEntries.map(
            (item) => item.seed ?? 0,
          ),
        ) + 1

    run(async () => {
      await setStageEntrySeedAction(
        competitionId,
        stageId,
        stageEntry.id,
        nextSeed,
      )
      refreshStageData()
    })
  }

  return (
    <section className="min-w-0 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Individual Rotation
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">
            Select Players
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-7 items-center rounded-xl bg-[var(--arena-yellow)] px-2.5 text-xs font-black text-slate-950">
            {activeStageEntries.length} selected
          </span>

          <span className="inline-flex min-h-7 items-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-600">
            Keep Apart {seededCount}/4
          </span>
        </div>
      </div>

      <SavedRosterPicker
        competitionId={competitionId}
        stageId={stageId}
        savedRosters={savedRosters}
        disabled={controlsDisabled}
        onImported={refreshStageData}
      />

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {players.length > 0 ? (
        <div className="mt-3 border-t border-neutral-200">
          {players.map((entry) => {
            const stageEntry =
              activeStageEntries.find(
                (item) =>
                  item.competition_entry_id ===
                  entry.id,
              )

            const checked = Boolean(stageEntry)
            const protectedPlayer =
              stageEntry?.seed !== null &&
              stageEntry?.seed !== undefined

            return (
              <div
                key={entry.id}
                className="flex min-h-11 items-center gap-2.5 border-b border-neutral-200"
              >
                <button
                  type="button"
                  disabled={controlsDisabled}
                  onClick={() => {
                    if (stageEntry) {
                      run(async () => {
                        await removeStageEntryAction(
                          competitionId,
                          stageId,
                          stageEntry.id,
                        )
                        refreshStageData()
                      })
                    } else {
                      run(async () => {
                        await assignStageEntriesAction(
                          competitionId,
                          stageId,
                          [entry.id],
                        )
                        refreshStageData()
                      })
                    }
                  }}
                  aria-label={
                    checked
                      ? `Remove ${entry.display_name} from stage`
                      : `Add ${entry.display_name} to stage`
                  }
                  title={checked ? "Remove from stage" : "Add to stage"}
                  className={[
                    "grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-neutral-950 text-sm font-black",
                    checked
                      ? "bg-[var(--arena-yellow)]"
                      : "bg-white",
                    controlsDisabled
                      ? "cursor-not-allowed opacity-50"
                      : "",
                  ].join(" ")}
                >
                  {checked ? "✓" : ""}
                </button>

                <span className="min-w-0 flex-1 truncate text-sm font-bold text-neutral-950">
                  {entry.display_name}
                </span>

                <button
                  type="button"
                  aria-label={`Keep ${entry.display_name} apart`}
                  title="Keep Apart"
                  disabled={
                    controlsDisabled ||
                    !stageEntry
                  }
                  onClick={() => {
                    if (stageEntry) {
                      toggleProtected(stageEntry)
                    }
                  }}
                  className={[
                    "grid h-8 min-w-8 shrink-0 place-items-center rounded-xl border px-2 text-sm font-bold",
                    protectedPlayer
                      ? "border-neutral-950 bg-[var(--arena-yellow)] text-neutral-950"
                      : "border-neutral-200 bg-white text-neutral-500",
                    !stageEntry ? "opacity-40" : "",
                    controlsDisabled
                      ? "cursor-not-allowed opacity-50"
                      : "",
                  ].join(" ")}
                >
                  🚩
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Select a roster and add players
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Then mark up to 4 players as Keep Apart.
          </p>
        </div>
      )}
    </section>
  )
}
