"use client"

import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { saveSingleSetResultAction } from "../actions"
import type { MatchDetailView } from "../view"

type Props = { match: MatchDetailView }

function stored(score: Record<string, unknown>, key: "scoreA" | "scoreB") {
  const value = score[key]
  return typeof value === "number" && Number.isFinite(value) ? String(value) : ""
}

function parseScore(value: string, label: string) {
  const normalized = value.trim()
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${label} must be a non-negative integer.`)
  }
  const parsed = Number(normalized)
  if (!Number.isSafeInteger(parsed)) throw new Error(`${label} is too large.`)
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

export function SingleSetScoreForm({ match }: Props) {
  const router = useRouter()
  const [scoreA, setScoreA] = useState(stored(match.score, "scoreA"))
  const [scoreB, setScoreB] = useState(stored(match.score, "scoreB"))
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const resolved =
    isResolvedParticipant(match.sideA) &&
    isResolvedParticipant(match.sideB)

  const disabled = pending || match.isBye || !resolved

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    let a: number
    let b: number
    try {
      a = parseScore(scoreA, "Score A")
      b = parseScore(scoreB, "Score B")
      if (a === b && match.matchType !== "individual_rotation") {
        throw new Error("A completed match cannot end in a draw.")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid score.")
      return
    }

    startTransition(async () => {
      try {
        await saveSingleSetResultAction({
          competitionId: match.competitionId,
          stageId: match.stageId,
          matchId: match.id,
          scoreA: a,
          scoreB: b,
        })
        setMessage("Result saved.")
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to save the result.")
      }
    })
  }

  return (
    <section className="border border-slate-200 bg-white p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Single set
      </p>
      <h2 className="mt-1 text-base font-bold text-slate-950">Score</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        {match.matchType === "individual_rotation"
          ? "Enter the final score. Draws are allowed."
          : "Enter the final score. The winner is determined automatically."}
      </p>

      {!resolved && !match.isBye ? (
        <div className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          Both participants must be resolved before entering a result.
        </div>
      ) : null}

      {match.isBye ? (
        <div className="mt-4 border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          BYE matches do not require a score.
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-5 space-y-4">
        {[
          { id: "score-a", label: match.sideA.displayName, seed: match.sideA.seed, value: scoreA, set: setScoreA },
          { id: "score-b", label: match.sideB.displayName, seed: match.sideB.seed, value: scoreB, set: setScoreB },
        ].map((row) => (
          <div key={row.id} className="grid gap-3 sm:grid-cols-[1fr_7rem] sm:items-center">
            <label htmlFor={row.id} className="min-w-0 truncate text-sm font-semibold text-slate-800">
              {row.seed !== null ? `(${row.seed}) ` : ""}{row.label}
            </label>
            <input
              id={row.id}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={row.value}
              onChange={(e) => row.set(e.target.value)}
              disabled={disabled}
              className="h-12 w-full border border-slate-300 bg-white px-3 text-center font-mono text-xl font-bold text-slate-950 outline-none focus:border-slate-950 disabled:bg-slate-100"
            />
          </div>
        ))}

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
            disabled={disabled}
            className="inline-flex min-h-11 w-full items-center justify-center bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            {pending ? "Saving..." : "Save result"}
          </button>
        </div>
      </form>
    </section>
  )
}
