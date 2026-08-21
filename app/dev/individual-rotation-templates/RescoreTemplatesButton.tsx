"use client"

import { useState, useTransition } from "react"

import {
  rescoreIndividualRotationTemplatesAction,
} from "@/modules/stage-engines/engines/individual-rotation/actions/rescoreTemplateActions"

export function RescoreTemplatesButton() {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function run() {
    setMessage(null)
    setError(null)

    startTransition(async () => {
      try {
        const result =
          await rescoreIndividualRotationTemplatesAction({
            minPlayers: 13,
            maxPlayers: 14,
          })

        setMessage(
          `Rescore completato: ${result.updated} template aggiornati.`,
        )
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Rescore failed.",
        )
      }
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="min-h-11 border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 disabled:opacity-50"
      >
        {pending ? "Rescoring..." : "Rescore 13–14"}
      </button>

      {message ? (
        <p className="text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
