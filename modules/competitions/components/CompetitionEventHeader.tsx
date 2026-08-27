"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { updateCompetitionAction } from "../actions/updateCompetition"

type Props = {
  competitionId: string
  title: string
  description: string | null
  startAt: string | null
  endAt: string | null
  organizerName: string
  readOnly?: boolean
}

function dateInputValue(value: string | null): string {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date)
}

function formatDateRange(startAt: string | null, endAt: string | null) {
  const start = formatDate(startAt)
  const end = formatDate(endAt)

  if (start && end && start !== end) return `${start} – ${end}`
  return start ?? end
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m4 20 4.2-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
      <path d="m14.5 6.5 3 3" />
    </svg>
  )
}

export function CompetitionEventHeader({
  competitionId,
  title,
  description,
  startAt,
  endAt,
  organizerName,
  readOnly = false,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const dates = formatDateRange(startAt, endAt)

  function handleSubmit(formData: FormData) {
    setError(null)

    startTransition(async () => {
      try {
        await updateCompetitionAction(competitionId, formData)
        setEditing(false)
        router.refresh()
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to update the event.",
        )
      }
    })
  }

  return (
    <>
      <header className="mt-5 md:mt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Event
            </p>

            <h1 className="mt-1 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {title}
            </h1>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Organizer · {organizerName}
              {dates ? ` · ${dates}` : ""}
            </p>
          </div>

          {!readOnly ? (
            <button
              type="button"
              onClick={() => {
                setError(null)
                setEditing((value) => !value)
              }}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-950 bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-50"
            >
              <PencilIcon />
              Edit
            </button>
          ) : null}
        </div>
      </header>

      {editing ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Event details
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-950">
            Edit event
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update the basic information for this event.
          </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <form action={handleSubmit} className="mt-5 space-y-5">
            <div>
              <label
                htmlFor="event-edit-name"
                className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-950"
              >
                Name
              </label>

              <input
                id="event-edit-name"
                name="title"
                required
                maxLength={150}
                defaultValue={title}
                disabled={pending}
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="event-edit-description"
                className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-950"
              >
                Description{" "}
                <span className="normal-case font-medium text-slate-500">
                  (optional)
                </span>
              </label>

              <textarea
                id="event-edit-description"
                name="description"
                rows={3}
                maxLength={2000}
                defaultValue={description ?? ""}
                placeholder="What's this event about?"
                disabled={pending}
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950 disabled:bg-slate-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="event-edit-start-date"
                  className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-950"
                >
                  Date From
                </label>

                <input
                  id="event-edit-start-date"
                  name="start_date"
                  type="date"
                  required
                  defaultValue={dateInputValue(startAt)}
                  disabled={pending}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="event-edit-end-date"
                  className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-950"
                >
                  Date To
                </label>

                <input
                  id="event-edit-end-date"
                  name="end_date"
                  type="date"
                  required
                  defaultValue={dateInputValue(endAt ?? startAt)}
                  disabled={pending}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-950 bg-[var(--arena-yellow)] px-5 text-sm font-black text-slate-950 transition hover:brightness-95 disabled:opacity-50"
              >
                {pending ? "Saving..." : "Save changes"}
              </button>

              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setError(null)
                  setEditing(false)
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-950 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </>
  )
}
