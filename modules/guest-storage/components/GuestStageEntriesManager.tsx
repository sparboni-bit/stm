"use client"

import Image from "next/image"
import {
  useMemo,
  useState,
} from "react"

import type {
  CompetitionEntry,
} from "@/modules/competition-entries/types"
import type {
  CompetitionStage,
} from "@/modules/competition-stages/types"
import type {
  CompetitionStageEntry,
} from "@/modules/competition-stage-entries/types"

import {
  assignGuestStageEntries,
  removeAllGuestStageEntries,
  removeGuestStageEntry,
  setGuestStageEntrySeeds,
} from "@/modules/guest-storage/services/guestStageEntries.service"

export function GuestStageEntriesManager({
  competitionId,
  stage,
  roster,
  stageEntries,
  onChanged,
}: {
  competitionId: string
  stage: CompetitionStage
  roster: CompetitionEntry[]
  stageEntries: CompetitionStageEntry[]
  onChanged: () => Promise<void>
}) {
  const [selected, setSelected] =
    useState<string[]>([])
  const [seedValues, setSeedValues] =
    useState<Record<string, string>>({})
  const [working, setWorking] =
    useState(false)
  const [error, setError] =
    useState<string | null>(null)
  const [message, setMessage] =
    useState<string | null>(null)
  const [entrySearch, setEntrySearch] =
    useState("")

  const locked =
    stage.status !== "draft" &&
    stage.status !== "configured"

  const byId = useMemo(
    () =>
      new Map(
        roster.map((entry) => [
          entry.id,
          entry,
        ]),
      ),
    [roster],
  )

  const assignedIds = useMemo(
    () =>
      new Set(
        stageEntries.map(
          (item) =>
            item.competition_entry_id,
        ),
      ),
    [stageEntries],
  )

  const available = roster.filter(
    (entry) =>
      entry.status === "active" &&
      !assignedIds.has(entry.id),
  )

  const activeStageEntries =
    stageEntries.filter(
      (item) =>
        item.status === "active",
    )

  const assignedEntries =
    activeStageEntries
      .map((item) =>
        byId.get(
          item.competition_entry_id,
        ),
      )
      .filter(
        (
          entry,
        ): entry is CompetitionEntry =>
          Boolean(entry),
      )

  const stageEntryMode: "singles" | "doubles" =
    stage.stageType === "individual_rotation"
      ? "singles"
      : stage.settings?.playMode === "doubles"
        ? "doubles"
        : "singles"

  const expectedEntryType =
    stageEntryMode === "doubles" ? "team" : "player"

  const seedMode =
    stage.stageType === "individual_rotation"
      ? "keep_apart"
      : stage.stageType === "round_robin"
        ? "group_protection"
        : "numbered"

  const groupCount =
    typeof stage.settings?.groupCount === "number" &&
    Number.isInteger(stage.settings.groupCount) &&
    stage.settings.groupCount > 0
      ? stage.settings.groupCount
      : typeof stage.settings?.groups === "number" &&
          Number.isInteger(stage.settings.groups) &&
          stage.settings.groups > 0
        ? stage.settings.groups
        : 1

  const selectedSeedCount = activeStageEntries.filter(
    (item) => item.seed !== null,
  ).length

  const compatibleAvailable = available.filter(
    (entry) => entry.entry_type === expectedEntryType,
  )

  const incompatibleAssignedEntries =
    assignedEntries.filter(
      (entry) => entry.entry_type !== expectedEntryType,
    )

  function isCompatible(
    entry: CompetitionEntry,
  ) {
    return entry.entry_type === expectedEntryType
  }

  async function run(
    operation: () => Promise<void>,
    success?: string,
  ) {
    setWorking(true)
    setError(null)
    setMessage(null)

    try {
      await operation()
      setSelected([])
      if (success) setMessage(success)
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

  async function saveSeeds() {
    const updates = activeStageEntries.map((stageEntry) => {
      const raw =
        seedValues[stageEntry.id] ??
        (stageEntry.seed === null ? "" : String(stageEntry.seed))
      const trimmed = raw.trim()
      const seed = trimmed === "" ? null : Number(trimmed)

      if (seed !== null && (!Number.isInteger(seed) || seed < 1)) {
        throw new Error("Seed must be a positive integer.")
      }

      return { stageEntryId: stageEntry.id, seed }
    })

    await setGuestStageEntrySeeds({
      competitionId,
      stageId: stage.id,
      updates,
    })
  }

  async function toggleProtected(stageEntry: CompetitionStageEntry) {
    const selectedIds = new Set(
      activeStageEntries
        .filter((item) => item.seed !== null)
        .map((item) => item.id),
    )

    if (selectedIds.has(stageEntry.id)) {
      selectedIds.delete(stageEntry.id)
    } else {
      if (seedMode === "keep_apart" && selectedIds.size >= 4) {
        throw new Error("Keep Apart allows a maximum of 4 players.")
      }
      if (seedMode === "group_protection" && selectedIds.size >= groupCount) {
        throw new Error(
          `You can protect at most ${groupCount} entries for ${groupCount} groups.`,
        )
      }
      selectedIds.add(stageEntry.id)
    }

    const updates = activeStageEntries.map((item, index) => ({
      stageEntryId: item.id,
      seed: selectedIds.has(item.id) ? index + 1 : null,
    }))

    await setGuestStageEntrySeeds({
      competitionId,
      stageId: stage.id,
      updates,
    })
  }

  if (stage.stageType === "individual_rotation") {
    const players = roster.filter((entry) => entry.status === "active" && entry.entry_type === "player")
    const activeIds = new Set(activeStageEntries.map((item) => item.competition_entry_id))
    const allSelected = players.length > 0 && players.every((entry) => activeIds.has(entry.id))

    return (
      <section className="bg-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Tournament roster</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">Select Players</h1>

        <div className="mt-5 rounded-2xl bg-neutral-100 p-4">
          <div className="flex items-start gap-3">
            <Image
              src="/brand/logo_round_black.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0"
            />
            <p className="text-sm leading-5 text-neutral-800">
              <strong>You&apos;re browsing as a guest.</strong>{" "}
              Nothing you create is saved — starting over means starting from scratch. Guest mode keeps things simple, with fewer settings than a full account.
            </p>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}

        <button
          type="button"
          disabled={working || locked || players.length === 0}
          onClick={() => {
            if (allSelected) {
              void run(() => removeAllGuestStageEntries({ competitionId, stageId: stage.id }))
            } else {
              void run(() => assignGuestStageEntries({ competitionId, stageId: stage.id, entryIds: players.map((entry) => entry.id) }))
            }
          }}
          className="mt-6 inline-flex min-h-11 items-center gap-3 font-bold disabled:opacity-50"
        >
          <span className="grid h-6 w-6 place-items-center rounded-md border border-neutral-950 bg-[var(--arena-yellow)] text-sm">✓</span>
          {allSelected ? "Deselect All" : "Select All"}
        </button>

        <p className="mt-2 text-sm leading-5 text-slate-500">
          🚩 Tap the flag to mark an entry as a seed. Seeds are kept apart when matches are generated.
        </p>

        <div className="mt-4 grid gap-x-6 lg:grid-cols-2">
          {players.map((entry) => {
            const stageEntry = activeStageEntries.find((item) => item.competition_entry_id === entry.id)
            const checked = Boolean(stageEntry)
            const protectedPlayer = Boolean(stageEntry?.seed)

            return (
              <div key={entry.id} className="flex min-h-14 items-center gap-3 border-b border-neutral-200">
                <button
                  type="button"
                  disabled={working || locked}
                  onClick={() => {
                    if (stageEntry) {
                      void run(() => removeGuestStageEntry({ competitionId, stageId: stage.id, stageEntryId: stageEntry.id }))
                    } else {
                      void run(() => assignGuestStageEntries({ competitionId, stageId: stage.id, entryIds: [entry.id] }))
                    }
                  }}
                  className={[
                    "grid h-6 w-6 shrink-0 place-items-center rounded-md border border-neutral-950 text-sm font-black",
                    checked ? "bg-[var(--arena-yellow)]" : "bg-white",
                  ].join(" ")}
                >
                  {checked ? "✓" : ""}
                </button>

                <span className="min-w-0 flex-1 truncate font-bold text-neutral-950">{entry.display_name}</span>

                <button
                  type="button"
                  aria-label={`Keep ${entry.display_name} apart`}
                  disabled={working || locked || !stageEntry}
                  onClick={() => stageEntry ? void run(() => toggleProtected(stageEntry), "Protection updated.") : undefined}
                  className={[
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-sm font-bold",
                    protectedPlayer ? "border-neutral-950 bg-[var(--arena-yellow)] text-neutral-950" : "border-neutral-200 bg-white text-neutral-500",
                    !stageEntry ? "opacity-40" : "",
                  ].join(" ")}
                >
                  ⚑
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">{activeStageEntries.length} players selected</p>
          <span className="text-xs font-bold text-slate-500">Keep Apart {selectedSeedCount} / 4</span>
        </div>
      </section>
    )
  }

  const normalizedEntrySearch = entrySearch.trim().toLocaleLowerCase()
  const visibleStageEntries =
    seedMode === "numbered" && normalizedEntrySearch
      ? stageEntries.filter((stageEntry) => {
          const entry = byId.get(stageEntry.competition_entry_id)
          return (entry?.display_name ?? "").toLocaleLowerCase().includes(normalizedEntrySearch)
        })
      : stageEntries

  return (
    <section className="border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
            Stage roster
          </p>

          <h2 className="mt-1 text-lg font-bold text-neutral-950">
            {stage.name}
          </h2>

          <p className="mt-1 text-sm text-neutral-600">
            {stageEntryMode === "doubles"
              ? "Choose the teams that play in this stage."
              : "Choose the players that play in this stage."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700">
            {activeStageEntries.length} {stageEntryMode === "doubles" ? "teams" : "players"}
          </span>

          <span className="border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700">
            {stageEntryMode === "doubles" ? "Doubles" : "Singles"}
          </span>
        </div>
      </div>

      {locked ? (
        <div className="mt-4 border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          This stage has already been
          generated. Roster and seeds are
          locked.
        </div>
      ) : null}

      {incompatibleAssignedEntries.length > 0 ? (
        <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          This stage contains entries that do not match its {stageEntryMode} play mode.
          Remove them before generating the stage.
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 border border-neutral-200 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-neutral-950">
                Available
              </h3>
              <p className="text-xs text-neutral-500">
                {compatibleAvailable.length} available
              </p>
            </div>

            <button
              type="button"
              disabled={
                working ||
                locked ||
                compatibleAvailable.length === 0
              }
              onClick={() =>
                setSelected(
                  compatibleAvailable.map(
                    (entry) => entry.id,
                  ),
                )
              }
              className="min-h-10 border border-neutral-300 px-3 text-xs font-semibold disabled:opacity-50"
            >
              Select all
            </button>
          </div>

          <div className="max-h-96 space-y-2 overflow-auto">
            {compatibleAvailable.map((entry) => (
              <label
                key={entry.id}
                className={[
                  "flex min-h-11 items-center gap-3 border border-neutral-200 px-3 py-2",
                  "cursor-pointer",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  disabled={
                    working ||
                    locked
                  }
                  checked={selected.includes(
                    entry.id,
                  )}
                  onChange={(event) =>
                    setSelected(
                      (current) =>
                        event.target
                          .checked
                          ? [
                              ...current,
                              entry.id,
                            ]
                          : current.filter(
                              (id) =>
                                id !==
                                entry.id,
                            ),
                    )
                  }
                />

                <span className="min-w-0 flex-1 break-words text-sm font-medium">
                  {entry.display_name}
                </span>

                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                  {entry.entry_type ===
                  "team"
                    ? "Doubles"
                    : "Singles"}
                </span>
              </label>
            ))}

            {compatibleAvailable.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                {stageEntryMode === "doubles"
                  ? "No teams available. Build teams from the Tournament roster first."
                  : "No players available."}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={
              working ||
              locked ||
              selected.length === 0
            }
            onClick={() =>
              void run(() =>
                assignGuestStageEntries({
                  competitionId,
                  stageId: stage.id,
                  entryIds: selected,
                }),
              )
            }
            className="mt-4 min-h-11 w-full bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add selected (
            {selected.length})
          </button>
        </div>

        <div className="min-w-0 border border-neutral-200 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-neutral-950">
                In this stage
              </h3>
              <p className="text-xs text-neutral-500">
                {activeStageEntries.length} {stageEntryMode === "doubles" ? "teams" : "players"}
              </p>
            </div>

            <button
              type="button"
              disabled={
                working ||
                locked ||
                stageEntries.length === 0
              }
              onClick={() => {
                if (
                  !window.confirm(
                    "Remove all participants from this stage?",
                  )
                ) {
                  return
                }

                void run(() =>
                  removeAllGuestStageEntries({
                    competitionId,
                    stageId:
                      stage.id,
                  }),
                )
              }}
              className="min-h-10 border border-red-200 px-3 text-xs font-semibold text-red-700 disabled:opacity-50"
            >
              Remove all
            </button>
          </div>

          {stageEntries.length > 0 ? (
            <div className="mb-3 border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-600">
                  {seedMode === "keep_apart"
                    ? "Keep Apart"
                    : seedMode === "group_protection"
                      ? "Group protection"
                      : "Seeds"}
                </p>
                {seedMode !== "numbered" ? (
                  <span className="text-xs font-semibold text-neutral-500">
                    {selectedSeedCount}
                    {seedMode === "keep_apart" ? " / 4" : ` / ${groupCount}`}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                {seedMode === "keep_apart"
                  ? "Select 2 to 4 players that should not be paired together."
                  : seedMode === "group_protection"
                    ? `Select up to ${groupCount} ${stageEntryMode === "doubles" ? "teams" : "players"} to keep in different groups.`
                    : "Assign numbered seeds in bracket order: 1, 2, 3..."}
              </p>
            </div>
          ) : null}

          {seedMode === "numbered" && stageEntries.length > 0 ? (
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="search"
                value={entrySearch}
                onChange={(event) => setEntrySearch(event.target.value)}
                placeholder={`Search ${stageEntryMode === "doubles" ? "team" : "player"}...`}
                className="min-h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              />
              <span className="shrink-0 text-xs font-semibold text-neutral-500">
                {activeStageEntries.length} selected · {selectedSeedCount} seeds
              </span>
            </div>
          ) : null}

          <div className={seedMode === "numbered" ? "max-h-[34rem] overflow-y-auto border-y border-neutral-200" : "space-y-2"}>
            {visibleStageEntries.map(
              (stageEntry) => {
                const entry = byId.get(
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
                    className={seedMode === "numbered" ? "border-b border-neutral-200 px-1 py-2 last:border-b-0" : "border border-neutral-200 p-3"}
                  >
                    <div className={seedMode === "numbered" ? "grid min-w-0 grid-cols-[minmax(0,1fr)_4.5rem_2.75rem] items-center gap-2" : "min-w-0"}>
                      <div className={seedMode === "numbered" ? "min-w-0" : "min-w-0 border-b border-neutral-100 pb-3"}>
                        <p className="break-words text-sm font-medium leading-5 text-neutral-950">
                          {entry?.display_name ??
                            "Unknown entry"}
                        </p>

                        {entry ? (
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                            {entry.entry_type ===
                            "team"
                              ? "Doubles"
                              : "Singles"}
                          </p>
                        ) : null}
                      </div>

                      <div className={seedMode === "numbered" ? "contents" : "mt-3 flex flex-wrap items-center gap-2"}>
                      {seedMode === "numbered" ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={raw}
                          disabled={working || locked}
                          onChange={(event) => {
                            const value = event.target.value
                            if (value === "" || /^\d+$/.test(value)) {
                              setSeedValues((current) => ({
                                ...current,
                                [stageEntry.id]: value,
                              }))
                            }
                          }}
                          placeholder="Seed"
                          className="min-h-11 w-full border border-neutral-300 px-2 text-center text-sm font-semibold sm:w-20"
                        />
                      ) : (
                        <button
                          type="button"
                          disabled={working || locked}
                          onClick={() =>
                            void run(
                              () => toggleProtected(stageEntry),
                              "Protection updated.",
                            )
                          }
                          className={[
                            "min-h-11 shrink-0 border px-3 text-xs font-bold",
                            stageEntry.seed !== null
                              ? "border-neutral-950 bg-neutral-950 text-white"
                              : "border-neutral-300 bg-white text-neutral-700",
                          ].join(" ")}
                        >
                          {stageEntry.seed !== null
                            ? seedMode === "keep_apart"
                              ? "KEEP APART ✓"
                              : "PROTECTED ✓"
                            : seedMode === "keep_apart"
                              ? "KEEP APART"
                              : "PROTECT"}
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={
                          working ||
                          locked
                        }
                        onClick={() =>
                          void run(() =>
                            removeGuestStageEntry({
                              competitionId,
                              stageId:
                                stage.id,
                              stageEntryId:
                                stageEntry.id,
                            }),
                          )
                        }
                        aria-label={`Remove ${entry?.display_name ?? "entry"}`}
                        title="Remove"
                        className={seedMode === "numbered" ? "grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-lg leading-none text-red-600 disabled:opacity-50" : "min-h-11 border border-red-200 px-3 text-xs font-semibold text-red-700 disabled:opacity-50"}
                      >
                        {seedMode === "numbered" ? "×" : "Remove"}
                      </button>
                      </div>
                    </div>
                  </div>
                )
              },
            )}

            {stageEntries.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">No participants in this stage.</p>
            ) : seedMode === "numbered" && visibleStageEntries.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">No selected entries match your search.</p>
            ) : null}
          </div>

          {stageEntries.length > 0 &&
          !locked &&
          seedMode === "numbered" ? (
            <div className="mt-4 flex justify-end border-t border-neutral-200 pt-4">
              <button
                type="button"
                disabled={working}
                onClick={() =>
                  void run(
                    saveSeeds,
                    "Elimination seeds saved successfully.",
                  )
                }
                className="min-h-11 bg-[var(--arena-yellow)] px-5 text-sm font-semibold text-[var(--arena-black)] disabled:opacity-50"
              >
                {working
                  ? "Saving..."
                  : "Save seeds"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
          Next step
        </p>
        <h3 className="mt-1 font-bold text-neutral-950">
          Generate stage
        </h3>
        <p className="mt-1 text-sm leading-5 text-neutral-600">
          Guest generation will be connected
          in R2B.4B. This step only prepares
          and persists the stage roster and
          seeds.
        </p>
      </div>
    </section>
  )
}
