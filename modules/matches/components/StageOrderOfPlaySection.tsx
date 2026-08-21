"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { useStage } from "../../competition-stages/hooks"
import {
  listCompetitionCourtsAction,
} from "../../competition-courts/actions"
import type {
  CompetitionCourt,
} from "../../competition-courts/types"
import { listStageMatchesAction } from "../actions"
import type {
  MatchDetailView,
  MatchParticipantView,
} from "../view"

function participantLabel(
  participant: MatchParticipantView,
): string {
  const seed =
    participant.seed !== null
      ? `(${participant.seed}) `
      : ""

  return `${seed}${participant.displayName}`
}

function matchLabel(match: MatchDetailView): string {
  return `M${match.visibleMatchNumber ?? match.matchNumber}`
}

function statusLabel(match: MatchDetailView): string {
  if (match.isBye) return "BYE"

  switch (match.status) {
    case "pending":
      return "Pending"
    case "ready":
      return "Ready"
    case "on_court":
      return "Live"
    case "completed":
      return "Completed"
    default:
      return match.status
  }
}

function localDayKey(value: string): string {
  const date = new Date(value)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function localTimeKey(value: string): string {
  const date = new Date(value)
  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join(":")
}

function formatDay(value: string): string {
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

function MatchCard({
  match,
  compact = false,
}: {
  match: MatchDetailView
  compact?: boolean
}) {
  const stage = useStage()
  const href =
    `/competitions/${stage.competitionId}` +
    `/stages/${stage.id}` +
    `/matches/${match.id}`

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {matchLabel(match)} · Round{" "}
            {match.roundNumber}
          </p>

          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            {statusLabel(match)}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <p
          className={[
            "truncate text-sm",
            match.winnerSide === "A"
              ? "font-bold text-slate-950"
              : "font-semibold text-slate-700",
          ].join(" ")}
        >
          {participantLabel(
            match.sideA,
          )}
        </p>

        <p
          className={[
            "truncate text-sm",
            match.winnerSide === "B"
              ? "font-bold text-slate-950"
              : "font-semibold text-slate-700",
          ].join(" ")}
        >
          {participantLabel(
            match.sideB,
          )}
        </p>
      </div>
    </>
  )

  if (match.isBye) {
    return (
      <div
        className={[
          "border border-slate-200 bg-slate-50",
          compact ? "p-3" : "p-4",
        ].join(" ")}
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={[
        "block border border-slate-200 bg-white transition",
        "hover:border-slate-400 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-slate-950 focus-visible:ring-offset-2",
        compact ? "p-3" : "p-4",
      ].join(" ")}
    >
      {content}
    </Link>
  )
}

export function StageOrderOfPlaySection() {
  const stage = useStage()

  const [matches, setMatches] = useState<MatchDetailView[]>([])
  const [courts, setCourts] = useState<CompetitionCourt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [matchRows, courtRows] = await Promise.all([
          listStageMatchesAction(stage.id),
          listCompetitionCourtsAction(stage.competitionId),
        ])

        if (active) {
          setMatches(matchRows)
          setCourts(courtRows)
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load Order of Play.",
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [stage.id, stage.competitionId])

  const activeCourts = useMemo(
    () =>
      courts
        .filter((court) => court.status === "available")
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder ||
            a.courtNumber - b.courtNumber,
        ),
    [courts],
  )

  const unavailableCourts = useMemo(
    () =>
      courts
        .filter((court) => court.status !== "available")
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder ||
            a.courtNumber - b.courtNumber,
        ),
    [courts],
  )

  const scheduled = useMemo(
    () =>
      matches.filter(
        (match) =>
          match.scheduledAt !== null &&
          match.courtLabel !== null,
      ),
    [matches],
  )

  const unscheduled = useMemo(
    () =>
      matches
        .filter(
          (match) =>
            !match.isBye &&
            (match.scheduledAt === null ||
              match.courtLabel === null),
        )
        .sort(
          (a, b) =>
            a.roundNumber - b.roundNumber ||
            a.matchOrder - b.matchOrder,
        ),
    [matches],
  )

  const days = useMemo(() => {
    const grouped = new Map<string, MatchDetailView[]>()

    for (const match of scheduled) {
      const key = localDayKey(match.scheduledAt!)
      const current = grouped.get(key) ?? []
      current.push(match)
      grouped.set(key, current)
    }

    return Array.from(grouped.entries()).sort(
      ([dayA], [dayB]) => dayA.localeCompare(dayB),
    )
  }, [scheduled])

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tournament scheduling
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Order of Play
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          ATP-style schedule by day, time and court. Open a match to
          change its court or scheduled time.
        </p>
      </div>

      {loading ? (
        <div className="border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          Loading Order of Play...
        </div>
      ) : null}

      {error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && days.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
          <p className="text-sm font-semibold text-slate-900">
            No scheduled matches
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Assign a court and date/time from Match management.
          </p>
        </div>
      ) : null}

      {!loading && !error
        ? days.map(([day, dayMatches]) => {
            const times = Array.from(
              new Set(
                dayMatches.map((match) =>
                  localTimeKey(match.scheduledAt!),
                ),
              ),
            ).sort()

            return (
              <section
                key={day}
                className="space-y-4 border-t border-slate-300 pt-5"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Order of Play
                  </p>
                  <h3 className="mt-1 text-lg font-bold capitalize text-slate-950">
                    {formatDay(day)}
                  </h3>
                </div>

                {/* Desktop / tablet ATP grid */}
                <div className="hidden overflow-x-auto lg:block">
                  <div
                    className="grid min-w-[900px] gap-px bg-slate-200 border border-slate-200"
                    style={{
                      gridTemplateColumns:
                        `88px repeat(${Math.max(activeCourts.length, 1)}, minmax(220px, 1fr))`,
                    }}
                  >
                    <div className="bg-slate-950 px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-white">
                      Time
                    </div>

                    {activeCourts.length > 0 ? (
                      activeCourts.map((court) => (
                        <div
                          key={court.id}
                          className="bg-slate-950 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-white"
                        >
                          {court.name}
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-950 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white">
                        No active courts
                      </div>
                    )}

                    {times.flatMap((time) => {
                      const cells = [
                        <div
                          key={`${day}-${time}-label`}
                          className="bg-slate-50 px-3 py-4 font-mono text-sm font-bold tabular-nums text-slate-800"
                        >
                          {time}
                        </div>,
                      ]

                      if (activeCourts.length === 0) {
                        cells.push(
                          <div
                            key={`${day}-${time}-none`}
                            className="min-h-28 bg-white p-3 text-sm text-slate-400"
                          >
                            Configure an available court.
                          </div>,
                        )
                        return cells
                      }

                      for (const court of activeCourts) {
                        const cellMatches = dayMatches
                          .filter(
                            (match) =>
                              localTimeKey(match.scheduledAt!) ===
                                time &&
                              match.courtLabel === court.name,
                          )
                          .sort(
                            (a, b) =>
                              a.matchOrder - b.matchOrder,
                          )

                        cells.push(
                          <div
                            key={`${day}-${time}-${court.id}`}
                            className="min-h-28 bg-slate-50 p-2"
                          >
                            {cellMatches.length > 0 ? (
                              <div className="space-y-2">
                                {cellMatches.map((match) => (
                                  <MatchCard
                                    key={match.id}
                                    match={match}
                                    compact
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="flex min-h-24 items-center justify-center text-xs font-medium text-slate-300">
                                —
                              </div>
                            )}
                          </div>,
                        )
                      }

                      return cells
                    })}
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-5 lg:hidden">
                  {times.map((time) => {
                    const timeMatches = dayMatches
                      .filter(
                        (match) =>
                          localTimeKey(match.scheduledAt!) === time,
                      )
                      .sort((a, b) => {
                        const courtA =
                          activeCourts.findIndex(
                            (court) =>
                              court.name === a.courtLabel,
                          )
                        const courtB =
                          activeCourts.findIndex(
                            (court) =>
                              court.name === b.courtLabel,
                          )
                        return courtA - courtB
                      })

                    return (
                      <div key={`${day}-${time}`}>
                        <div className="border-b border-slate-200 pb-2">
                          <span className="font-mono text-base font-bold tabular-nums text-slate-950">
                            {time}
                          </span>
                        </div>

                        <div className="mt-3 space-y-3">
                          {timeMatches.map((match) => (
                            <div key={match.id}>
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                {match.courtLabel}
                              </p>
                              <MatchCard match={match} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })
        : null}

      {!loading && !error && unscheduled.length > 0 ? (
        <section className="border-t border-slate-300 pt-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Scheduling queue
              </p>
              <h3 className="mt-1 text-base font-bold text-slate-950">
                Unscheduled matches
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {unscheduled.length}
            </span>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {unscheduled.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ) : null}

      {!loading && !error && unavailableCourts.length > 0 ? (
        <section className="border-t border-slate-300 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Courts
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-950">
            Unavailable courts
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {unavailableCourts.map((court) => (
              <span
                key={court.id}
                className="border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500"
              >
                {court.name}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
