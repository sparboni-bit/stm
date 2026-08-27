"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { deleteCompetitionAction } from "../actions/deleteCompetition"

type Props = {
  competitionId: string
  eventTitle: string
}

export function DeleteCompetitionButton({
  competitionId,
  eventTitle,
}: Props) {
  const router = useRouter()

  const [pending, setPending] =
    useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      [
        `Delete "${eventTitle}"?`,
        "",
        "This will permanently delete the event, all its stages, matches, results and related data.",
        "This action cannot be undone.",
      ].join("\n"),
    )

    if (!confirmed) {
      return
    }

    setPending(true)

    try {
      await deleteCompetitionAction(
        competitionId,
      )

      router.refresh()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to delete the event.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`Delete ${eventTitle}`}
      title="Delete event"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "…" : "🗑"}
    </button>
  )
}