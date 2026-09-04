"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

import { updateCompetitionAction } from "../actions/updateCompetition"
import { setCompetitionClosedAction } from "../actions/setCompetitionClosed"

type Props = {
  competitionId: string
  title: string
  description: string | null
  startAt: string | null
  endAt: string | null
  organizerName: string
  isClosed: boolean
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

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M8 3.5v4M16 3.5v4M3.5 10h17" />
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
  isClosed,
  readOnly = false,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const startDateRef = useRef<HTMLInputElement>(null)
  const endDateRef = useRef<HTMLInputElement>(null)

  const dates = formatDateRange(startAt, endAt)

  function openDatePicker(input: HTMLInputElement | null) {
    if (!input || input.disabled) return

    input.focus()

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker()
        return
      } catch {
        // Fall back to the browser's native click handling below.
      }
    }

    input.click()
  }

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

  function handleEventStatusChange() {
    setError(null)

    startTransition(async () => {
      try {
        await setCompetitionClosedAction(
          competitionId,
          !isClosed,
        )
        setStatusDialogOpen(false)
        router.refresh()
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to update event status.",
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

                <div className="relative">
                  <input
                    ref={startDateRef}
                    id="event-edit-start-date"
                    name="start_date"
                    type="date"
                    onPointerDown={(event) => {
                      if (event.pointerType === "mouse") {
                        openDatePicker(event.currentTarget)
                      }
                    }}
                    required
                    defaultValue={dateInputValue(startAt)}
                    disabled={pending}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-950 outline-none focus:border-slate-950 disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    aria-label="Open Date From calendar"
                    disabled={pending}
                    onClick={() => openDatePicker(startDateRef.current)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CalendarIcon />
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="event-edit-end-date"
                  className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-950"
                >
                  Date To
                </label>

                <div className="relative">
                  <input
                    ref={endDateRef}
                    id="event-edit-end-date"
                    name="end_date"
                    type="date"
                    onPointerDown={(event) => {
                      if (event.pointerType === "mouse") {
                        openDatePicker(event.currentTarget)
                      }
                    }}
                    defaultValue={dateInputValue(endAt)}
                    disabled={pending}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-950 outline-none focus:border-slate-950 disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    aria-label="Open Date To calendar"
                    disabled={pending}
                    onClick={() => openDatePicker(endDateRef.current)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CalendarIcon />
                  </button>
                </div>
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

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Event status
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={[
                      "inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                      isClosed
                        ? "bg-slate-100 text-slate-600"
                        : "bg-[var(--arena-yellow)] text-slate-950",
                    ].join(" ")}
                  >
                    {isClosed ? "Closed" : "Open"}
                  </span>

                  <p className="text-sm text-slate-500">
                    {isClosed
                      ? "Reopening moves this event back to Open Events."
                      : "Closing moves this event to Past Events. Stages and results are not changed."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={pending}
                onClick={() => setStatusDialogOpen(true)}
                className={[
                  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                  isClosed
                    ? "border border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
                    : "border border-red-200 bg-white text-red-700 hover:bg-red-50",
                ].join(" ")}
              >
                {isClosed ? "Reopen event" : "Close event"}
              </button>
            </div>
          </div>

          <ConfirmDialog
            open={statusDialogOpen}
            title={
              isClosed
                ? `Reopen "${title}"?`
                : `Close "${title}"?`
            }
            description={
              isClosed
                ? "This event will move back to Open Events. Its stages and results will not be changed."
                : "This event will move to Past Events. Its stages, matches and results will not be changed."
            }
            confirmLabel={
              isClosed
                ? "Reopen event"
                : "Close event"
            }
            pending={pending}
            onCancel={() => {
              if (!pending) {
                setStatusDialogOpen(false)
              }
            }}
            onConfirm={handleEventStatusChange}
          />
        </section>
      ) : null}
    </>
  )
}
