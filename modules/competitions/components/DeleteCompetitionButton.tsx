"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

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

  const [confirmOpen, setConfirmOpen] =
    useState(false)

  async function handleDelete() {
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
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={pending}
        aria-label={`Delete ${eventTitle}`}
        title="Delete event"
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${eventTitle}"?`}
        description="This will permanently delete the event, all its stages, matches, results and related data."
        pending={pending}
        onCancel={() => {
          if (!pending) {
            setConfirmOpen(false)
          }
        }}
        onConfirm={handleDelete}
      />
    </>
  )
}