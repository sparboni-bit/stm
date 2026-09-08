"use client"

import Image from "next/image"
import { useMemo, useState } from "react"

import type { CompetitionEntry } from "@/modules/competition-entries/types"
import type { CompetitionStageEntry } from "@/modules/competition-stage-entries/types"
import type { MatchRow } from "@/modules/matches/types"

import { swapGuestIndividualRotationPlayers } from "@/modules/guest-storage/services"

export function GuestIndividualRotationRotation({
  competitionId,
  stageId,
  matches,
  roster,
  stageEntries,
  onChanged,
}: {
  competitionId: string
  stageId: string
  matches: MatchRow[]
  roster: CompetitionEntry[]
  stageEntries: CompetitionStageEntry[]
  onChanged: () => Promise<void>
}) {
  const [swapRound, setSwapRound] = useState<number | null>(null)
  const [firstEntryId, setFirstEntryId] = useState("")
  const [secondEntryId, setSecondEntryId] = useState("")
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const names = useMemo(
    () =>
      new Map(
        roster.map((entry) => [
          entry.id,
          entry.display_name ?? "Player",
        ]),
      ),
    [roster],
  )

  const activeIds = useMemo(
    () =>
      stageEntries
        .filter((entry) => entry.status === "active")
        .map((entry) => entry.competition_entry_id),
    [stageEntries],
  )

  const protectedIds = useMemo(
    () =>
      new Set(
        stageEntries
          .filter((entry) => entry.status === "active" && entry.seed !== null)
          .map((entry) => entry.competition_entry_id),
      ),
    [stageEntries],
  )

  const rows = useMemo(() => {
    const roundNumbers = Array.from(
      new Set(matches.map((match) => match.round_number)),
    ).sort((a, b) => a - b)

    return roundNumbers.map((roundNumber) => {
      const roundMatches = matches.filter(
        (match) => match.round_number === roundNumber,
      )
      const playing = new Set<string>()

      for (const match of roundMatches) {
        for (const side of [match.side_a, match.side_b]) {
          if (side.entryIds) {
            side.entryIds.forEach((id) => playing.add(id))
          } else if (side.entryId) {
            playing.add(side.entryId)
          }
        }
      }

      const restingIds = activeIds.filter((id) => !playing.has(id))
      const locked = roundMatches.some(
        (match) =>
          match.status === "on_court" ||
          match.status === "completed" ||
          Object.keys(match.score ?? {}).length > 0,
      )

      return {
        roundNumber,
        playing,
        restingIds,
        locked,
      }
    })
  }, [activeIds, matches])

  const selectedRow = rows.find((row) => row.roundNumber === swapRound) ?? null

  const keepApartWarning = useMemo(() => {
    if (!selectedRow || !firstEntryId || !secondEntryId) return false

    const swapId = (id: string) =>
      id === firstEntryId
        ? secondEntryId
        : id === secondEntryId
          ? firstEntryId
          : id

    return matches
      .filter((match) => match.round_number === selectedRow.roundNumber)
      .some((match) =>
        [match.side_a, match.side_b].some((side) => {
          if (!side.entryIds) return false
          const nextIds = side.entryIds.map(swapId)
          return nextIds.filter((id) => protectedIds.has(id)).length > 1
        }),
      )
  }, [firstEntryId, matches, protectedIds, secondEntryId, selectedRow])

  function closeSwap() {
    setSwapRound(null)
    setFirstEntryId("")
    setSecondEntryId("")
    setError(null)
  }

  async function confirmSwap() {
    if (!swapRound || !firstEntryId || !secondEntryId) return

    setWorking(true)
    setError(null)
    setMessage(null)

    try {
      await swapGuestIndividualRotationPlayers({
        competitionId,
        stageId,
        roundNumber: swapRound,
        firstEntryId,
        secondEntryId,
      })
      await onChanged()
      setMessage(`Round ${swapRound} updated.`)
      closeSwap()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not swap players.")
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
          Individual Rotation
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">
          Rotation
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Players resting in each generated round.
        </p>
      </header>

      <div className="rounded-2xl bg-neutral-100 px-4 py-4">
        <div className="flex items-start gap-3">
          <Image
            src="/brand/pickleball-arena-logo.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <p className="text-sm leading-5 text-neutral-800">
            <strong>Rotation.</strong>{" "}
            Check who rests in each round. Before a round starts, use Swap Players to exchange two players or replace a player on court with someone resting.
          </p>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
          Generate the Stage to see the rotation.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {rows.map((row, index) => (
            <div
              key={row.roundNumber}
              className={[
                "px-4 py-3",
                index > 0 ? "border-t border-neutral-200" : "",
              ].join(" ")}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-sm font-black text-neutral-950">
                    Round {row.roundNumber}
                  </span>
                  <p className="mt-1 text-sm text-neutral-600">
                    {row.restingIds.length
                      ? `Out: ${row.restingIds.map((id) => names.get(id) ?? "Player").join(" · ")}`
                      : "Everyone plays"}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={working || row.locked}
                  onClick={() => {
                    setSwapRound(row.roundNumber)
                    setFirstEntryId("")
                    setSecondEntryId("")
                    setError(null)
                    setMessage(null)
                  }}
                  className="min-h-10 rounded-xl border border-neutral-950 bg-white px-4 text-sm font-bold text-neutral-950 disabled:border-neutral-200 disabled:text-neutral-400"
                >
                  {row.locked ? "Round locked" : "Swap Players"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRow ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="swap-players-title" className="w-full max-w-md rounded-[18px] border border-neutral-200 bg-white p-5 shadow-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
              Round {selectedRow.roundNumber}
            </p>
            <h2 id="swap-players-title" className="mt-1 text-xl font-black text-neutral-950">
              Swap Players
            </h2>
            <p className="mt-2 text-sm leading-5 text-neutral-600">
              Choose two players. A player marked Resting can replace a player currently on court.
            </p>

            <label className="mt-5 block text-xs font-black uppercase tracking-wide text-neutral-700">
              First player
            </label>
            <select
              value={firstEntryId}
              disabled={working}
              onChange={(event) => {
                setFirstEntryId(event.target.value)
                if (event.target.value === secondEntryId) setSecondEntryId("")
              }}
              className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm font-semibold"
            >
              <option value="">Select player</option>
              {activeIds.map((id) => (
                <option key={id} value={id}>
                  {names.get(id) ?? "Player"}{selectedRow.restingIds.includes(id) ? " — Resting" : " — Playing"}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-xs font-black uppercase tracking-wide text-neutral-700">
              Swap with
            </label>
            <select
              value={secondEntryId}
              disabled={working || !firstEntryId}
              onChange={(event) => setSecondEntryId(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm font-semibold disabled:bg-neutral-50"
            >
              <option value="">Select player</option>
              {activeIds
                .filter((id) => id !== firstEntryId)
                .map((id) => (
                  <option key={id} value={id}>
                    {names.get(id) ?? "Player"}{selectedRow.restingIds.includes(id) ? " — Resting" : " — Playing"}
                  </option>
                ))}
            </select>

            {keepApartWarning ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
                This swap places two Keep Apart players together. You can still confirm the manual change.
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={working}
                onClick={closeSwap}
                className="min-h-11 rounded-[9px] border border-neutral-300 bg-white px-4 text-sm font-bold text-neutral-950"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={working || !firstEntryId || !secondEntryId}
                onClick={() => void confirmSwap()}
                className="min-h-11 rounded-[9px] bg-[var(--arena-yellow)] px-4 text-sm font-black text-[var(--arena-black)] disabled:opacity-40"
              >
                Confirm Swap
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
