"use client"

import { FormEvent, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  createCompetitionCourtAction,
  listCompetitionCourtsAction,
} from "../../competition-courts/actions"
import type {
  CompetitionCourt,
} from "../../competition-courts/types"
import {
  getMatchScheduleAction,
  saveMatchScheduleAction,
} from "../actions"
import type { MatchDetailView } from "../view"

type Props = {
  match: MatchDetailView
}

function localDateTimeValue(value: string | null): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  )
  return local.toISOString().slice(0, 16)
}

function splitLocalDateTime(value: string): {
  date: string
  time: string
} {
  if (!value) {
    return { date: "", time: "" }
  }

  const [date = "", time = ""] = value.split("T")

  return {
    date,
    time: time.slice(0, 5),
  }
}

function joinLocalDateTime(
  date: string,
  time: string,
): string {
  if (!date) return ""
  return `${date}T${time || "00:00"}`
}

export function MatchScheduleEditor({ match }: Props) {
  const router = useRouter()
  const [courts, setCourts] = useState<CompetitionCourt[]>([])
  const [courtId, setCourtId] = useState("")
  const initialSchedule = splitLocalDateTime(
    localDateTimeValue(match.scheduledAt),
  )
  const [scheduleDate, setScheduleDate] = useState(initialSchedule.date)
  const [scheduleTime, setScheduleTime] = useState(initialSchedule.time)
  const [newCourtName, setNewCourtName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const isPending = Boolean(pending)
  const addCourtDisabled =
    isPending || newCourtName.trim().length === 0

  async function reload() {
    const [courtRows, schedule] = await Promise.all([
      listCompetitionCourtsAction(match.competitionId),
      getMatchScheduleAction(match.id),
    ])
    setCourts(courtRows)
    setCourtId(schedule.courtId ?? "")

    const localSchedule = splitLocalDateTime(
      localDateTimeValue(schedule.scheduledAt),
    )
    setScheduleDate(localSchedule.date)
    setScheduleTime(localSchedule.time)
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : "Unable to load courts."),
    )
  }, [match.id, match.competitionId])

  function save(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    startTransition(async () => {
      try {
        await saveMatchScheduleAction({
          competitionId: match.competitionId,
          stageId: match.stageId,
          matchId: match.id,
          courtId: courtId || null,
          scheduledAt:
            scheduleDate
              ? joinLocalDateTime(scheduleDate, scheduleTime)
              : null,
        })
        setMessage("Schedule saved.")
        await reload()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to save schedule.")
      }
    })
  }


  function addCourt() {
    const name = newCourtName.trim()
    if (!name) return

    startTransition(async () => {
      try {
        setError(null)
        setMessage(null)
        await createCompetitionCourtAction(match.competitionId, name)
        setNewCourtName("")
        await reload()
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Unable to create court.",
        )
      }
    })
  }

  return (
    <section className="border border-slate-200 bg-white p-4 sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Scheduling
      </p>
      <h2 className="mt-1 text-base font-bold text-slate-950">
        Court & time
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Court and scheduled time are independent from the match result.
      </p>

      <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Court
          </span>
          <select
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
            disabled={isPending}
            className="mt-1 h-11 w-full border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
          >
            <option value="">Not assigned</option>
            {courts.map((court) => (
              <option
                key={court.id}
                value={court.id}
                disabled={court.status !== "available"}
              >
                {court.name}
                {court.status !== "available" ? " — unavailable" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 min-[430px]:grid-cols-[minmax(0,1fr)_8.5rem]">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Date
            </span>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              disabled={isPending}
              className="mt-1 h-11 w-full border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Time
            </span>
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              disabled={isPending || !scheduleDate}
              step={60}
              className="mt-1 h-11 w-full border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </label>
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="min-h-11 w-full bg-slate-950 px-5 text-sm font-bold text-white disabled:bg-slate-300 sm:w-auto"
          >
            {pending ? "Saving..." : "Save schedule"}
          </button>
        </div>
      </form>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Add court
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={newCourtName}
            onChange={(e) => setNewCourtName(e.target.value)}
            placeholder="New court name"
            disabled={isPending}
            className="h-11 flex-1 border border-slate-300 px-3 text-sm"
          />
          <button
            type="button"
            onClick={addCourt}
            disabled={addCourtDisabled}
            className="min-h-11 w-full border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 disabled:opacity-50 sm:w-auto"
          >
            Add court
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      ) : null}
    </section>
  )
}
