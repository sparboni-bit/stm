"use client"

import { FormEvent, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { saveRetirementResultAction } from "../actions"
import type { MatchSide } from "../types"
import type { MatchDetailView } from "../view"

type Props = {
  match: MatchDetailView
}

type ScoreFormat = "single_set" | "best_of_3"

type DraftSet = {
  a: string
  b: string
}

function initialSets(match: MatchDetailView): DraftSet[] {
  const stored = Array.isArray(match.score.sets)
    ? match.score.sets.slice(0, 3).map((item) => {
        const row =
          typeof item === "object" && item !== null
            ? (item as Record<string, unknown>)
            : {}

        return {
          a:
            typeof row.a === "number" || typeof row.a === "string"
              ? String(row.a)
              : "",
          b:
            typeof row.b === "number" || typeof row.b === "string"
              ? String(row.b)
              : "",
        }
      })
    : []

  while (stored.length < 3) stored.push({ a: "", b: "" })
  return stored
}

function parseScore(value: string, label: string): number {
  if (!/^\d+$/.test(value.trim())) {
    throw new Error(`${label} must be a non-negative integer.`)
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${label} is too large.`)
  }

  return parsed
}

function isResolvedParticipant(
  participant: MatchDetailView["sideA"],
): boolean {
  if (participant.slotType === "entry") {
    return participant.entryId !== null
  }

  if (participant.slotType === "rotation_team") {
    return (
      participant.members?.length === 2 &&
      participant.members.every(
        (member) => Boolean(member.entryId),
      )
    )
  }

  return false
}

export function RetirementScoreForm({ match }: Props) {
  const router = useRouter()

  const individualRotation =
    match.matchType === "individual_rotation"

  const initialFormat: ScoreFormat =
    individualRotation
      ? "single_set"
      : match.score.format === "best_of_3"
        ? "best_of_3"
        : "single_set"

  const initialRetiredSide: MatchSide | "" =
    match.finishType === "retirement" &&
    (match.retiredSide === "A" || match.retiredSide === "B")
      ? match.retiredSide
      : ""

  const [scoreFormat, setScoreFormat] = useState<ScoreFormat>(initialFormat)
  const [sets, setSets] = useState<DraftSet[]>(() => initialSets(match))
  const [retiredSide, setRetiredSide] =
    useState<MatchSide | "">(initialRetiredSide)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const resolved =
    isResolvedParticipant(match.sideA) &&
    isResolvedParticipant(match.sideB)

  const disabled = pending || match.isBye || !resolved
  const visibleSets =
    individualRotation || scoreFormat === "single_set" ? 1 : 3

  const winnerName = useMemo(() => {
    if (retiredSide === "A") return match.sideB.displayName
    if (retiredSide === "B") return match.sideA.displayName
    return null
  }, [match.sideA.displayName, match.sideB.displayName, retiredSide])

  function updateSet(index: number, side: "a" | "b", value: string) {
    setSets((current) =>
      current.map((set, i) =>
        i === index ? { ...set, [side]: value } : set,
      ),
    )
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (retiredSide !== "A" && retiredSide !== "B") {
      setError("Select the participant who retired.")
      return
    }

    try {
      const completed = sets.slice(0, visibleSets).flatMap((set, index) => {
        const a = set.a.trim()
        const b = set.b.trim()

        if (!a && !b) return []

        if (!a || !b) {
          throw new Error(`Set ${index + 1} must contain both scores.`)
        }

        return [{
          scoreA: parseScore(a, `Set ${index + 1} score A`),
          scoreB: parseScore(b, `Set ${index + 1} score B`),
        }]
      })

      startTransition(async () => {
        try {
          await saveRetirementResultAction({
            competitionId: match.competitionId,
            stageId: match.stageId,
            matchId: match.id,
            retiredSide,
            scoreFormat: individualRotation ? "single_set" : scoreFormat,
            sets: completed,
          })

          setMessage("Retirement saved.")
          router.refresh()
        } catch (caughtError) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to save retirement.",
          )
        }
      })
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Invalid partial score.",
      )
    }
  }

  return (
    <section className="border border-slate-200 bg-white p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Retirement
      </p>

      <h2 className="mt-1 text-base font-bold text-slate-950">
        Match retirement
      </h2>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        Enter the optional partial score, then select the participant who retired.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setScoreFormat("single_set")}
            className={[
              "min-h-10 px-4 text-sm font-bold",
              scoreFormat === "single_set"
                ? "bg-slate-950 text-white"
                : "border border-slate-300 bg-white text-slate-700",
            ].join(" ")}
          >
            Single set
          </button>

          {!individualRotation ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setScoreFormat("best_of_3")}
            className={[
              "min-h-10 px-4 text-sm font-bold",
              scoreFormat === "best_of_3"
                ? "bg-slate-950 text-white"
                : "border border-slate-300 bg-white text-slate-700",
            ].join(" ")}
          >
            Best of 3
          </button>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[420px]">
            <div className="grid grid-cols-[1fr_6rem_6rem] gap-2 border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              <span>Score at retirement</span>
              <span className="truncate text-center">{match.sideA.displayName}</span>
              <span className="truncate text-center">{match.sideB.displayName}</span>
            </div>

            {sets.slice(0, visibleSets).map((set, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_6rem_6rem] items-center gap-2 border-b border-slate-100 py-3"
              >
                <span className="text-sm font-semibold text-slate-700">
                  {scoreFormat === "single_set" ? "Score" : `Set ${index + 1}`}
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={set.a}
                  disabled={disabled}
                  onChange={(event) => updateSet(index, "a", event.target.value)}
                  className="h-11 border border-slate-300 px-2 text-center font-mono text-lg font-bold outline-none focus:border-slate-950 disabled:bg-slate-100"
                />

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={set.b}
                  disabled={disabled}
                  onChange={(event) => updateSet(index, "b", event.target.value)}
                  className="h-11 border border-slate-300 px-2 text-center font-mono text-lg font-bold outline-none focus:border-slate-950 disabled:bg-slate-100"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(["A", "B"] as const).map((side) => {
            const participant = side === "A" ? match.sideA : match.sideB

            return (
              <button
                key={side}
                type="button"
                disabled={disabled}
                onClick={() => setRetiredSide(side)}
                className={[
                  "min-h-16 border px-4 py-3 text-left",
                  retiredSide === side
                    ? "border-amber-500 bg-amber-50 text-amber-950"
                    : "border-slate-300 bg-white text-slate-800",
                  disabled ? "cursor-not-allowed opacity-50" : "",
                ].join(" ")}
              >
                <span className="block text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Retired
                </span>
                <span className="mt-1 block font-semibold">
                  {participant.seed !== null ? `(${participant.seed}) ` : ""}
                  {participant.displayName}
                </span>
              </button>
            )
          })}
        </div>

        {winnerName ? (
          <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-bold">RET</span>
            {" · "}
            Winner: <span className="font-bold">{winnerName}</span>
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div role="status" className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={disabled || !retiredSide}
            className="inline-flex min-h-11 w-full items-center justify-center bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            {pending ? "Saving..." : "Save retirement"}
          </button>
        </div>
      </form>
    </section>
  )
}
