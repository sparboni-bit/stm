"use client"

import { FormEvent, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { saveBestOf3ResultAction } from "../actions"
import type { MatchDetailView } from "../view"

type Props = {
  match: MatchDetailView
}

type DraftSet = {
  a: string
  b: string
}

function parseScore(value: string, label: string): number {
  const normalized = value.trim()

  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${label} must be a non-negative integer.`)
  }

  const parsed = Number(normalized)

  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${label} is too large.`)
  }

  return parsed
}

function storedSets(score: Record<string, unknown>): DraftSet[] {
  if (!Array.isArray(score.sets)) {
    return [
      { a: "", b: "" },
      { a: "", b: "" },
      { a: "", b: "" },
    ]
  }

  const rows = score.sets.slice(0, 3).map((item) => {
    const row =
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : {}

    return {
      a: typeof row.a === "number" ? String(row.a) : "",
      b: typeof row.b === "number" ? String(row.b) : "",
    }
  })

  while (rows.length < 3) {
    rows.push({ a: "", b: "" })
  }

  return rows
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

export function BestOf3ScoreForm({
  match,
}: Props) {
  const router = useRouter()

  const initial = useMemo(
    () => storedSets(match.score),
    [match.score],
  )

  const [sets, setSets] = useState<DraftSet[]>(initial)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const resolved =
    isResolvedParticipant(match.sideA) &&
    isResolvedParticipant(match.sideB)

  const disabled =
    pending ||
    match.isBye ||
    !resolved

  function updateSet(
    index: number,
    side: "a" | "b",
    value: string,
  ) {
    setSets((current) =>
      current.map((set, setIndex) =>
        setIndex === index
          ? { ...set, [side]: value }
          : set,
      ),
    )
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    try {
      const completed: Array<{
        scoreA: number
        scoreB: number
      }> = []

      let setsA = 0
      let setsB = 0

      for (let index = 0; index < sets.length; index += 1) {
        const set = sets[index]
        const empty = set.a.trim() === "" && set.b.trim() === ""

        if (empty) {
          continue
        }

        if (set.a.trim() === "" || set.b.trim() === "") {
          throw new Error(
            `Set ${index + 1} must contain both scores.`,
          )
        }

        if (setsA === 2 || setsB === 2) {
          throw new Error(
            "Do not enter a set after the match is already decided.",
          )
        }

        const scoreA = parseScore(
          set.a,
          `Set ${index + 1} score A`,
        )
        const scoreB = parseScore(
          set.b,
          `Set ${index + 1} score B`,
        )

        if (scoreA === scoreB) {
          throw new Error(
            `Set ${index + 1} cannot end in a draw.`,
          )
        }

        if (scoreA > scoreB) {
          setsA += 1
        } else {
          setsB += 1
        }

        completed.push({ scoreA, scoreB })
      }

      if (setsA !== 2 && setsB !== 2) {
        throw new Error(
          "Best of 3 is incomplete: one player must win two sets.",
        )
      }

      startTransition(async () => {
        try {
          await saveBestOf3ResultAction({
            competitionId: match.competitionId,
            stageId: match.stageId,
            matchId: match.id,
            sets: completed,
          })

          setMessage("Best of 3 result saved.")
          router.refresh()
        } catch (caughtError) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to save the result.",
          )
        }
      })
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Invalid Best of 3 result.",
      )
    }
  }

  return (
    <section className="border border-slate-200 bg-white p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Best of 3
      </p>

      <h2 className="mt-1 text-base font-bold text-slate-950">
        Score
      </h2>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        Enter sets in order. The third set is only needed at 1–1.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="overflow-x-auto">
          <div className="min-w-[420px]">
            <div className="grid grid-cols-[1fr_6rem_6rem] gap-2 border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              <span>Set</span>
              <span className="text-center">
                {match.sideA.displayName}
              </span>
              <span className="text-center">
                {match.sideB.displayName}
              </span>
            </div>

            {sets.map((set, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_6rem_6rem] items-center gap-2 border-b border-slate-100 py-3"
              >
                <span className="text-sm font-semibold text-slate-700">
                  Set {index + 1}
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={set.a}
                  disabled={disabled}
                  onChange={(event) =>
                    updateSet(index, "a", event.target.value)
                  }
                  className="h-11 border border-slate-300 px-2 text-center font-mono text-lg font-bold outline-none focus:border-slate-950 disabled:bg-slate-100"
                />

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={set.b}
                  disabled={disabled}
                  onChange={(event) =>
                    updateSet(index, "b", event.target.value)
                  }
                  className="h-11 border border-slate-300 px-2 text-center font-mono text-lg font-bold outline-none focus:border-slate-950 disabled:bg-slate-100"
                />
              </div>
            ))}
          </div>
        </div>

        {error ? (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex min-h-11 w-full items-center justify-center bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            {pending ? "Saving..." : "Save Best of 3"}
          </button>
        </div>
      </form>
    </section>
  )
}
