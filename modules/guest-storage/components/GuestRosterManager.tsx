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

import {
  addGuestCompetitionEntry,
  bulkAddGuestCompetitionEntries,
  removeGuestCompetitionEntry,
  renameGuestCompetitionEntry,
} from "@/modules/guest-storage/services"

import { GuestTeamBuilder } from "./GuestTeamBuilder"

function parseBulkPlayers(text: string) {
  const rows: Array<{
    displayName: string
    entryType: "player"
  }> = []
  const errors: string[] = []

  text
    .split(/\r?\n/)
    .forEach((rawLine, index) => {
      const line = rawLine.trim()
      if (!line) return

      if (line.includes(",")) {
        errors.push(
          `Row ${index + 1}: enter one player per line.`,
        )
        return
      }

      rows.push({
        displayName: line,
        entryType: "player",
      })
    })

  return { rows, errors }
}

export function GuestRosterManager({
  competitionId,
  entries,
  onChanged,
}: {
  competitionId: string
  entries: CompetitionEntry[]
  onChanged: () => Promise<void>
}) {
  const [displayName, setDisplayName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState("")
  const [teamsOpen, setTeamsOpen] = useState(false)

  const players = useMemo(
    () => entries.filter((entry) => entry.entry_type === "player"),
    [entries],
  )

  const teams = useMemo(
    () => entries.filter((entry) => entry.entry_type === "team"),
    [entries],
  )

  const preview = useMemo(
    () => parseBulkPlayers(bulkText),
    [bulkText],
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

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = displayName.trim()
    if (!name) return

    void run(async () => {
      await addGuestCompetitionEntry({
        competitionId,
        displayName: name,
        entryType: "player",
      })
      setDisplayName("")
    })
  }

  return (
    <section className="w-full">
      <div className="mb-5 rounded-[18px] bg-neutral-100 px-5 py-4">
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
            Add players here once, then reuse the same roster across all stages.
            Doubles teams are built from these players.
          </p>
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Tournament roster
        </p>
        <h2 className="mt-1 text-[28px] font-black leading-none tracking-[-0.03em] text-neutral-950">
          Players
        </h2>
        <p className="mt-2 text-sm leading-5 text-slate-500">
          Add players to the tournament roster. Teams are always built from these players.
        </p>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleAdd}
        className="mb-5 flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={displayName}
          disabled={working}
          onChange={(event) =>
            setDisplayName(event.target.value)
          }
          placeholder="Player name"
          className="min-h-12 min-w-0 flex-1 border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-950"
        />

        <button
          disabled={working || !displayName.trim()}
          className="min-h-12 bg-[var(--arena-yellow)] px-4 py-3 text-sm font-semibold text-[var(--arena-black)] disabled:opacity-50"
        >
          Add player
        </button>
      </form>

      <div className="mb-5 flex flex-wrap gap-2 border-t border-neutral-200 pt-5">
        <button
          type="button"
          disabled={working}
          onClick={() => setBulkOpen((value) => !value)}
          className="min-h-10 border border-neutral-300 px-4 text-sm font-semibold text-neutral-900"
        >
          {bulkOpen ? "Close Bulk Add" : "Bulk Add Players"}
        </button>

        <button
          type="button"
          disabled={working || players.length < 2}
          onClick={() => setTeamsOpen((value) => !value)}
          className="min-h-10 border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          {teamsOpen
            ? "Close Teams"
            : `Build Teams${teams.length > 0 ? ` (${teams.length})` : ""}`}
        </button>
      </div>

      {bulkOpen ? (
        <div className="mb-5 border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-neutral-950">
            Bulk add players
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            One player per line.
          </p>

          <textarea
            value={bulkText}
            onChange={(event) =>
              setBulkText(event.target.value)
            }
            rows={8}
            className="mt-3 w-full border border-neutral-300 bg-white px-3 py-3 font-mono text-sm"
          />

          {preview.errors.length > 0 ? (
            <div className="mt-3 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {preview.errors.map((message) => (
                <div key={message}>{message}</div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm text-neutral-500">
              {preview.rows.length} valid players
            </span>

            <button
              type="button"
              disabled={
                working ||
                preview.rows.length === 0 ||
                preview.errors.length > 0
              }
              onClick={() =>
                void run(async () => {
                  await bulkAddGuestCompetitionEntries({
                    competitionId,
                    entries: preview.rows,
                  })
                  setBulkText("")
                  setBulkOpen(false)
                })
              }
              className="min-h-10 bg-[var(--arena-yellow)] px-4 text-sm font-semibold text-[var(--arena-black)] disabled:opacity-50"
            >
              Add {preview.rows.length}
            </button>
          </div>
        </div>
      ) : null}

      {teamsOpen ? (
        <div className="mb-5">
          <GuestTeamBuilder
            competitionId={competitionId}
            entries={entries}
            onChanged={onChanged}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        {players.map((entry, index) => (
          <div
            key={entry.id}
            className="border-b border-neutral-200 px-1 py-3"
          >
            {editingId === entry.id ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={editingName}
                  onChange={(event) =>
                    setEditingName(event.target.value)
                  }
                  className="min-h-10 min-w-0 flex-1 border border-neutral-300 px-3"
                />

                <button
                  type="button"
                  disabled={working || !editingName.trim()}
                  onClick={() =>
                    void run(async () => {
                      await renameGuestCompetitionEntry({
                        competitionId,
                        entryId: entry.id,
                        displayName: editingName,
                      })
                      setEditingId(null)
                    })
                  }
                  className="min-h-10 bg-[var(--arena-yellow)] px-3 text-xs font-semibold text-[var(--arena-black)]"
                >
                  Save
                </button>

                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="min-h-10 border border-neutral-300 px-3 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 break-words font-medium text-neutral-950">
                  {index + 1}. {entry.display_name}
                </p>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => {
                      setEditingId(entry.id)
                      setEditingName(entry.display_name)
                    }}
                    className="min-h-10 border border-neutral-300 px-3 text-sm font-medium"
                  >
                    Rename
                  </button>

                  <button
                    type="button"
                    disabled={working}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Remove "${entry.display_name}" from this tournament?`,
                        )
                      ) {
                        return
                      }

                      void run(() =>
                        removeGuestCompetitionEntry({
                          competitionId,
                          entryId: entry.id,
                        }),
                      )
                    }}
                    className="min-h-10 border border-red-200 px-3 text-sm font-medium text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {players.length === 0 ? (
          <div className="border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500">
            No players yet.
          </div>
        ) : null}
      </div>
    </section>
  )
}
