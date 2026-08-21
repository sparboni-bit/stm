"use client"

import { FormEvent, useState, useTransition } from "react"
import type { CompetitionEntry } from "../types"
import { addCompetitionEntryAction } from "../actions/addCompetitionEntry"
import {
  bulkAddCompetitionEntriesAction,
  type BulkCompetitionEntryInput,
} from "../actions/bulkAddCompetitionEntries"
import { removeCompetitionEntryAction } from "../actions/removeCompetitionEntry"
import { renameCompetitionEntryAction } from "../actions/renameCompetitionEntry"

import { useRouter } from "next/navigation"


type BulkMode = "player" | "team"

function parseBulkEntries(text: string, mode: BulkMode) {
  const rows: BulkCompetitionEntryInput[] = []
  const errors: string[] = []

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim()
    if (!line) return
    const columns = line.split(",").map((value) => value.trim())

    if (mode === "player") {
      if (columns.length !== 1 || !columns[0]) {
        errors.push(`Row ${index + 1}: expected "Player".`)
        return
      }
      rows.push({ displayName: columns[0], entryType: "player" })
      return
    }

    if (columns.length !== 2 || !columns[0] || !columns[1]) {
      errors.push(`Row ${index + 1}: expected "Player 1, Player 2".`)
      return
    }
    rows.push({
      displayName: `${columns[0]} / ${columns[1]}`,
      entryType: "team",
    })
  })

  return { rows, errors }
}

type Props = {
  competitionId: string
  entries: CompetitionEntry[]
  locked?: boolean
}

export function CompetitionEntriesManager({
  competitionId,
  entries,
  locked = false,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<BulkMode>("player")
  const [bulkText, setBulkText] = useState("")
  const preview = parseBulkEntries(bulkText, bulkMode)

  function run(action: () => Promise<void>) {
    setError(null)
    startTransition(async () => {
      try {
        await action()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Operation failed")
      }
    })
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = displayName.trim()
    if (!name) return
    const formData = new FormData()
    formData.set("displayName", name)
    run(async () => {
      await addCompetitionEntryAction(
        competitionId,
        formData,
      )

      setDisplayName("")
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Tournament roster ({entries.length})
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add players or teams to this tournament. They can then be assigned to one or more phases.
        </p>
      </div>

      {locked && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          The tournament roster is locked.
        </div>
      )}

      <form onSubmit={handleAdd} className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input
          value={displayName}
          disabled={locked || isPending}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Participant name"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm"
        />
        <button
          disabled={locked || isPending || !displayName.trim()}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add participant
        </button>
      </form>

      {!locked && (
        <div className="mb-5 border-t border-slate-200 pt-5">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setBulkOpen((v) => !v)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold"
          >
            {bulkOpen ? "Close Bulk Import" : "Bulk Import"}
          </button>

          {bulkOpen && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex gap-2">
                {(["player", "team"] as BulkMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBulkMode(mode)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                      bulkMode === mode
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {mode === "player" ? "Singles" : "Doubles"}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-600">
                {bulkMode === "player"
                  ? "One player per line."
                  : "One team per line: Player 1, Player 2."}
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={10}
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-mono text-sm"
              />
              {preview.errors.length > 0 && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {preview.errors.map((x) => <div key={x}>{x}</div>)}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {preview.rows.length} valid entries
                </span>
                <button
                  type="button"
                  disabled={isPending || preview.rows.length === 0 || preview.errors.length > 0}
                  onClick={() => run(async () => {
                    await bulkAddCompetitionEntriesAction(
                      competitionId,
                      preview.rows,
                    )

                    setBulkText("")
                    setBulkOpen(false)

                    router.refresh()
                  })}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Import {preview.rows.length} entries
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div key={entry.id} className="rounded-xl border border-slate-200 px-3 py-3">
            {editingId === entry.id ? (
              <div className="flex gap-2">
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => run(async () => {
                    await renameCompetitionEntryAction(competitionId, entry.id, editingName)
                    setEditingId(null)
                  })}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                >
                  Save
                </button>
                <button type="button" onClick={() => setEditingId(null)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{index + 1}. {entry.display_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{entry.entry_type} · {entry.status}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={locked || isPending}
                    onClick={() => { setEditingId(entry.id); setEditingName(entry.display_name) }}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium">
                    Rename
                  </button>
                  <button type="button" disabled={locked || isPending}
                    onClick={() => {
                      if (!window.confirm(`Remove "${entry.display_name}" from this tournament?`)) return
                      run(() => removeCompetitionEntryAction(competitionId, entry.id))
                    }}
                    className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700">
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {entries.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            No entries yet.
          </div>
        )}
      </div>
    </section>
  )
}
