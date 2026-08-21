"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

import {
  createGuestCompetition,
} from "@/modules/guest-storage"

export function GuestCompetitionForm() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] =
    useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(
    null,
  )

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const normalizedTitle = title.trim()

    if (!normalizedTitle) {
      setError("Tournament name is required.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const competition =
        await createGuestCompetition({
          title: normalizedTitle,
          description:
            description.trim() || null,
        })

      router.push(
        `/guest/competitions/${competition.id}`,
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to create the tournament.",
      )
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
    >
      {error ? (
        <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="guest-tournament-title"
          className="mb-2 block text-sm font-semibold text-neutral-950"
        >
          Tournament name
        </label>

        <input
          id="guest-tournament-title"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          required
          maxLength={150}
          autoFocus
          className="min-h-12 w-full border border-neutral-300 bg-white px-4 py-3 text-neutral-950 outline-none focus:border-neutral-950"
        />
      </div>

      <div>
        <label
          htmlFor="guest-tournament-description"
          className="mb-2 block text-sm font-semibold text-neutral-950"
        >
          Description
        </label>

        <textarea
          id="guest-tournament-description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          rows={4}
          maxLength={2000}
          placeholder="Optional description"
          className="w-full resize-y border border-neutral-300 bg-white px-4 py-3 text-neutral-950 outline-none focus:border-neutral-950"
        />
      </div>

      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="min-h-12 w-full bg-[var(--arena-yellow)] px-5 py-3 font-semibold text-[var(--arena-black)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {saving
          ? "Creating..."
          : "Create Tournament"}
      </button>
    </form>
  )
}
