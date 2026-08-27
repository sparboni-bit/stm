"use client"

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react"

import type {
  Roster,
  RosterEntry,
} from "../types"

import {
  getRosterForStageAction,
} from "../actions/getRosterForStage"

import {
  importRosterEntriesToStageAction,
} from "../actions/importRosterEntriesToStage"

type Props = {
  competitionId: string
  stageId: string
  savedRosters: Roster[]
  disabled?: boolean
  onImported?: () => void
}

export function SavedRosterPicker({
  competitionId,
  stageId,
  savedRosters,
  disabled = false,
  onImported,
}: Props) {
  const [rosterId, setRosterId] =
    useState("")
  const [entries, setEntries] =
    useState<RosterEntry[]>([])
  const [selected, setSelected] =
    useState<string[]>([])
  const [message, setMessage] =
    useState<string | null>(null)
  const [error, setError] =
    useState<string | null>(null)

  const [loadingRoster, startRosterTransition] =
    useTransition()
  const [importing, startImportTransition] =
    useTransition()

  const activeEntries = useMemo(
    () =>
      entries.filter(
        (entry) => entry.status === "active",
      ),
    [entries],
  )

  useEffect(() => {
    setSelected([])
    setEntries([])
    setMessage(null)
    setError(null)

    if (!rosterId) return

    startRosterTransition(async () => {
      try {
        const roster =
          await getRosterForStageAction(rosterId)
        setEntries(roster.entries)
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load the roster.",
        )
      }
    })
  }, [rosterId])

  const allSelected =
    activeEntries.length > 0 &&
    activeEntries.every((entry) =>
      selected.includes(entry.id),
    )

  function toggleAll() {
    setSelected(
      allSelected
        ? []
        : activeEntries.map((entry) => entry.id),
    )
  }

  function toggleEntry(entryId: string) {
    setSelected((current) =>
      current.includes(entryId)
        ? current.filter((id) => id !== entryId)
        : [...current, entryId],
    )
  }

  function handleImport() {
    if (
      disabled ||
      !rosterId ||
      selected.length === 0
    ) {
      return
    }

    setMessage(null)
    setError(null)

    startImportTransition(async () => {
      try {
        const result =
          await importRosterEntriesToStageAction(
            competitionId,
            stageId,
            rosterId,
            selected,
          )

        setMessage(
          result.imported > 0
            ? `${result.imported} player${
                result.imported === 1 ? "" : "s"
              } added to this stage.${
                result.alreadyPresent > 0
                  ? ` ${result.alreadyPresent} already present.`
                  : ""
              }`
            : "The selected players are already in this stage.",
        )

        setSelected([])
        onImported?.()
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to add players to this stage.",
        )
      }
    })
  }

  if (savedRosters.length === 0) {
    return (
      <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Saved rosters
        </p>
        <h2 className="mt-1 text-base font-bold text-slate-950">
          No saved rosters
        </h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">
          Create a roster from the main Roster section, then return here to select players for this stage.
        </p>
      </section>
    )
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        Saved rosters
      </p>

      <h2 className="mt-1 text-lg font-black text-slate-950">
        Add players from a roster
      </h2>

      <p className="mt-1 text-sm leading-5 text-slate-500">
        Choose one of your saved rosters and add the players you want to this stage.
      </p>

      <div className="mt-4">
        <label
          htmlFor="saved-roster-picker"
          className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-950"
        >
          Roster
        </label>

        <select
          id="saved-roster-picker"
          value={rosterId}
          disabled={disabled || loadingRoster || importing}
          onChange={(event) =>
            setRosterId(event.target.value)
          }
          className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-slate-950 disabled:bg-slate-100"
        >
          <option value="">Select a roster…</option>
          {savedRosters.map((roster) => (
            <option key={roster.id} value={roster.id}>
              {roster.name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {loadingRoster ? (
        <p className="mt-4 text-sm text-slate-500">
          Loading roster…
        </p>
      ) : null}

      {!loadingRoster &&
      rosterId &&
      activeEntries.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
          This roster has no active players.
        </p>
      ) : null}

      {!loadingRoster &&
      activeEntries.length > 0 ? (
        <>
          <button
            type="button"
            disabled={disabled || importing}
            onClick={toggleAll}
            className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-950 disabled:opacity-50"
          >
            <span
              className={[
                "grid h-6 w-6 place-items-center rounded-md border border-slate-950 text-sm font-black",
                allSelected
                  ? "bg-[var(--arena-yellow)]"
                  : "bg-white",
              ].join(" ")}
            >
              {allSelected ? "✓" : ""}
            </span>

            {allSelected ? "Deselect all" : "Select all"}
          </button>

          <div className="mt-2 grid gap-x-6 lg:grid-cols-2">
            {activeEntries.map((entry) => {
              const checked = selected.includes(entry.id)

              return (
                <button
                  key={entry.id}
                  type="button"
                  disabled={disabled || importing}
                  onClick={() => toggleEntry(entry.id)}
                  className="flex min-h-12 items-center gap-3 border-b border-slate-200 text-left disabled:opacity-50"
                >
                  <span
                    className={[
                      "grid h-6 w-6 shrink-0 place-items-center rounded-md border border-slate-950 text-sm font-black",
                      checked
                        ? "bg-[var(--arena-yellow)]"
                        : "bg-white",
                    ].join(" ")}
                  >
                    {checked ? "✓" : ""}
                  </span>

                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-950">
                    {entry.display_name}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {selected.length} player
              {selected.length === 1 ? "" : "s"} selected
            </p>

            <button
              type="button"
              disabled={
                disabled ||
                importing ||
                selected.length === 0
              }
              onClick={handleImport}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-40"
            >
              {importing ? "Adding..." : "Add selected players"}
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}
