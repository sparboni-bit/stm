"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import type {
  BulkRosterPairInput,
  RosterEntry,
  RosterWithEntries,
} from "../types"

import { addRosterEntryAction } from "../actions/addRosterEntry"
import { addRosterEntriesBulkAction } from "../actions/addRosterEntriesBulk"
import { addRosterPairsBulkAction } from "../actions/addRosterPairsBulk"
import { removeRosterEntryAction } from "../actions/removeRosterEntry"
import { removeRosterPairAction } from "../actions/removeRosterPair"
import { renameRosterEntryAction } from "../actions/renameRosterEntry"

type Props = {
  roster: RosterWithEntries
  section: "players" | "teams"
}

function parseSingles(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseTeams(text: string): {
  pairs: BulkRosterPairInput[]
  invalidRows: number
} {
  const pairs: BulkRosterPairInput[] = []
  let invalidRows = 0

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    const parts = line
      .split(/[;\t|]/)
      .map((part) => part.trim())
      .filter(Boolean)

    if (parts.length !== 2) {
      invalidRows += 1
      continue
    }

    pairs.push({
      playerAName: parts[0],
      playerBName: parts[1],
    })
  }

  return { pairs, invalidRows }
}

export function RosterEntriesManager({
  roster,
  section,
}: Props) {
  const router = useRouter()

  const [busy, setBusy] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState("")

  const entryById = useMemo(
    () =>
      new Map<string, RosterEntry>(
        roster.entries.map((entry) => [
          entry.id,
          entry,
        ]),
      ),
    [roster.entries],
  )

  const singlesPreview = useMemo(
    () => parseSingles(bulkText),
    [bulkText],
  )

  const teamsPreview = useMemo(
    () => parseTeams(bulkText),
    [bulkText],
  )

  async function run(
    task: () => Promise<unknown>,
  ) {
    if (busy) return

    setBusy(true)

    try {
      await task()
      router.refresh()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Operation failed.",
      )
    } finally {
      setBusy(false)
    }
  }

  async function handlePlayersBulkImport() {
    if (busy) return

    if (singlesPreview.length === 0) {
      window.alert(
        "Add at least one valid participant.",
      )
      return
    }

    setBusy(true)

    try {
      await addRosterEntriesBulkAction(
        roster.id,
        singlesPreview,
      )

      setBulkText("")
      setBulkOpen(false)
      router.refresh()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to import participants.",
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleTeamsBulkImport() {
    if (busy) return

    if (teamsPreview.invalidRows > 0) {
      window.alert(
        `${teamsPreview.invalidRows} row(s) are invalid. Use: Player A ; Player B`,
      )
      return
    }

    if (teamsPreview.pairs.length === 0) {
      window.alert(
        "Add at least one valid team.",
      )
      return
    }

    setBusy(true)

    try {
      await addRosterPairsBulkAction(
        roster.id,
        teamsPreview.pairs,
      )

      setBulkText("")
      setBulkOpen(false)
      router.refresh()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to import teams.",
      )
    } finally {
      setBusy(false)
    }
  }



  if (section === "teams") {
    return (
      <>
        <section className="mt-6 rounded-[18px] border border-neutral-200 bg-white p-4 md:mt-0 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Add teams
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Teams are saved roster pairs. The actual
            competition team will be created only inside
            an Event / Stage.
          </p>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setBulkOpen((value) => !value)
                setBulkText("")
              }}
              className="min-h-10 w-full border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-50 sm:w-auto"
            >
              {bulkOpen
                ? "Close Bulk Import"
                : "Bulk Import Teams"}
            </button>

            {bulkOpen ? (
              <div className="mt-4">
                <p className="text-sm text-slate-500">
                  One team per line. Separate the two
                  player names with <strong>;</strong>.
                  Existing players with the same name are
                  reused.
                </p>

                <textarea
                  value={bulkText}
                  onChange={(event) =>
                    setBulkText(
                      event.target.value,
                    )
                  }
                  rows={5}
                  spellCheck={false}
                  placeholder={
                    "Mario Rossi ; Luca Bianchi\nAnna Verdi ; Paolo Neri"
                  }
                  className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900"
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">
                    {teamsPreview.pairs.length} valid
                    {" "}
                    {teamsPreview.pairs.length === 1
                      ? "team"
                      : "teams"}
                    {teamsPreview.invalidRows > 0
                      ? ` · ${teamsPreview.invalidRows} invalid`
                      : ""}
                  </span>

                  <button
                    type="button"
                    disabled={
                      busy ||
                      teamsPreview.pairs.length === 0 ||
                      teamsPreview.invalidRows > 0
                    }
                    onClick={
                      handleTeamsBulkImport
                    }
                    className="min-h-10 bg-[var(--arena-yellow)] px-4 text-sm font-semibold text-[var(--arena-black)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Import{" "}
                    {
                      teamsPreview.pairs.length
                    }
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Teams ({roster.pairs.length})
          </p>

          {roster.pairs.length === 0 ? (
            <div className="mt-3 border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              No saved teams.
            </div>
          ) : (
            <div className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
              {roster.pairs.map(
                (pair, index) => {
                  const playerA =
                    entryById.get(
                      pair.player_a_entry_id,
                    )

                  const playerB =
                    entryById.get(
                      pair.player_b_entry_id,
                    )

                  if (!playerA || !playerB) {
                    return null
                  }

                  const label = `${playerA.display_name} / ${playerB.display_name}`

                  return (
                    <article
                      key={pair.id}
                      className="py-3"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        Team {index + 1}
                      </p>

                      <h3 className="mt-1 text-base font-bold text-slate-950">
                        {label}
                      </h3>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Remove team "${label}"?`,
                            )
                          ) {
                            return
                          }

                          void run(() =>
                            removeRosterPairAction(
                              roster.id,
                              pair.id,
                            ),
                          )
                        }}
                        className="mt-2 min-h-9 border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Remove team
                      </button>
                    </article>
                  )
                },
              )}
            </div>
          )}
        </section>

      </>
    )
  }

  return (
    <>
      <section className="mt-6 rounded-[18px] border border-neutral-200 bg-white p-4 md:mt-0 sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Add a player
        </p>

        <form
          action={async (formData) => {
            setBusy(true)

            try {
              await addRosterEntryAction(
                roster.id,
                formData,
              )

              const form =
                document.getElementById(
                  "add-roster-entry-form",
                ) as HTMLFormElement | null

              form?.reset()
              router.refresh()
            } catch (error) {
              window.alert(
                error instanceof Error
                  ? error.message
                  : "Unable to add participant.",
              )
            } finally {
              setBusy(false)
            }
          }}
          id="add-roster-entry-form"
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <input
            name="displayName"
            required
            maxLength={160}
            placeholder="Participant name"
            className="min-h-12 min-w-0 flex-1 border border-neutral-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-950"
          />

          <button
            type="submit"
            disabled={busy}
            className="min-h-12 bg-[var(--arena-yellow)] px-5 py-3 text-sm font-semibold text-[var(--arena-black)] transition hover:brightness-95 disabled:opacity-50"
          >
            Add participant
          </button>
        </form>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBulkOpen((value) => !value)
              setBulkText("")
            }}
            className="min-h-10 w-full border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-50 sm:w-auto"
          >
            {bulkOpen
              ? "Close Bulk Import"
              : "Bulk Import Players"}
          </button>

          {bulkOpen ? (
            <div className="mt-4">
              <p className="text-sm text-slate-500">
                One player per line.
              </p>

              <textarea
                value={bulkText}
                onChange={(event) =>
                  setBulkText(
                    event.target.value,
                  )
                }
                rows={5}
                spellCheck={false}
                placeholder={
                  "Mario Rossi\nLuca Bianchi\nAnna Verdi"
                }
                className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900"
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">
                  {singlesPreview.length} valid
                  {" "}
                  {singlesPreview.length === 1
                    ? "entry"
                    : "entries"}
                </span>

                <button
                  type="button"
                  disabled={
                    busy ||
                    singlesPreview.length === 0
                  }
                  onClick={
                    handlePlayersBulkImport
                  }
                  className="min-h-10 bg-[var(--arena-yellow)] px-4 text-sm font-semibold text-[var(--arena-black)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Import{" "}
                  {singlesPreview.length}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Players ({roster.entries.length})
        </p>

        {roster.entries.length === 0 ? (
          <div className="mt-3 border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No saved players.
          </div>
        ) : (
          <div className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
            {roster.entries.map(
              (entry, index) => (
                <article
                  key={entry.id}
                  className="py-3"
                >
                  <h3 className="text-base font-bold text-slate-950">
                    {index + 1}.{" "}
                    {entry.display_name}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        const name =
                          window
                            .prompt(
                              "Participant name",
                              entry.display_name,
                            )
                            ?.trim()

                        if (
                          !name ||
                          name ===
                            entry.display_name
                        ) {
                          return
                        }

                        void run(() =>
                          renameRosterEntryAction(
                            roster.id,
                            entry.id,
                            name,
                          ),
                        )
                      }}
                      className="min-h-9 border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      Rename
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Remove "${entry.display_name}"? Saved teams containing this player will also be removed.`,
                          )
                        ) {
                          return
                        }

                        void run(() =>
                          removeRosterEntryAction(
                            roster.id,
                            entry.id,
                          ),
                        )
                      }}
                      className="min-h-9 border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>

    </>
  )
}
