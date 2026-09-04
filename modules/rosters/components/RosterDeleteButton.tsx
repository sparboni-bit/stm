"use client"

import { useState } from "react"

import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { deleteRosterAction } from "../actions/deleteRoster"

type Props = {
  rosterId: string
  rosterName: string
}

export function RosterDeleteButton({
  rosterId,
  rosterName,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (pending) return

    setPending(true)
    setError(null)

    deleteRosterAction(rosterId).catch((caught) => {
      setPending(false)
      setOpen(false)
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to delete roster.",
      )
    })
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
        className="flex min-h-11 items-center justify-center rounded-xl border border-red-300 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>

      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={open}
        title={`Delete ${rosterName}?`}
        description="The saved roster will be deleted. Players already imported into Events or Stages are not deleted."
        confirmLabel="Delete roster"
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}
