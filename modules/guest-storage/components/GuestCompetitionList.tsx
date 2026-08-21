"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import {
  deleteGuestCompetition,
} from "@/modules/guest-storage"

import {
  listGuestCompetitionWorkspaces,
} from "@/modules/guest-storage/services"

import type {
  GuestTournamentDocument,
} from "@/modules/guest-storage/types"

function formatUpdatedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Recently updated"
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date)
}

export function GuestCompetitionList() {
  const [documents, setDocuments] = useState<
    GuestTournamentDocument[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(
    null,
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const items =
        await listGuestCompetitionWorkspaces()

      setDocuments(items)
     } 
      catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load guest tournaments.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleDelete(
    competitionId: string,
    title: string,
  ) {
    if (
      !window.confirm(
        `Delete "${title}" from this device? This cannot be undone.`,
      )
    ) {
      return
    }

    try {
      await deleteGuestCompetition(competitionId)
      await load()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to delete the tournament.",
      )
    }
  }

  if (loading) {
    return (
      <div className="border border-neutral-200 bg-white p-5 text-sm text-neutral-500 shadow-sm">
        Loading guest tournaments...
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="border border-dashed border-neutral-300 bg-white px-5 py-10 text-center">
        <h2 className="text-lg font-bold text-neutral-950">
          No tournaments yet
        </h2>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-600">
          Create your first tournament. No registration
          required.
        </p>

        <Link
          href="/guest/new"
          className="mt-5 inline-flex min-h-12 items-center justify-center bg-[var(--arena-yellow)] px-5 py-3 font-semibold text-[var(--arena-black)] transition hover:brightness-95"
        >
          + New Tournament
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {documents.map((document) => {
        const { competition } = document

        return (
          <article
            key={competition.id}
            className="border border-neutral-200 bg-white shadow-sm"
          >
            <div className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                  Guest tournament
                </p>

                <h2 className="mt-1 break-words text-lg font-bold text-neutral-950">
                  {competition.title}
                </h2>

                <p className="mt-2 text-xs text-neutral-500">
                  {document.entries.length} participants ·{" "}
                  {document.stages.length} phases
                </p>
              </div>

              <span className="shrink-0 border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                {competition.status === "draft"
                  ? "Setup"
                  : competition.status}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3">
              <p className="truncate text-xs text-neutral-500">
                Updated {formatUpdatedAt(document.updatedAt)}
              </p>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void handleDelete(
                      competition.id,
                      competition.title,
                    )
                  }
                  className="min-h-9 border border-red-200 px-3 text-xs font-semibold text-red-700"
                >
                  Delete
                </button>

                <Link
                  href={`/guest/competitions/${competition.id}`}
                  className="inline-flex min-h-9 items-center bg-neutral-950 px-3 text-xs font-semibold text-white"
                >
                  Open →
                </Link>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
