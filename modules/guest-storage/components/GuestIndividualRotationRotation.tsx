"use client"

import Image from "next/image"
import { useMemo } from "react"

import type { CompetitionEntry } from "@/modules/competition-entries/types"
import type { CompetitionStageEntry } from "@/modules/competition-stage-entries/types"
import type { MatchRow } from "@/modules/matches/types"

export function GuestIndividualRotationRotation({
  matches,
  roster,
  stageEntries,
}: {
  matches: MatchRow[]
  roster: CompetitionEntry[]
  stageEntries: CompetitionStageEntry[]
}) {
  const rows = useMemo(() => {
    const activeIds = new Set(
      stageEntries
        .filter((entry) => entry.status === "active")
        .map((entry) => entry.competition_entry_id),
    )

    const names = new Map(
      roster.map((entry) => [
        entry.id,
        entry.display_name ?? "Player",
      ]),
    )

    const roundNumbers = Array.from(
      new Set(matches.map((match) => match.round_number)),
    ).sort((a, b) => a - b)

    return roundNumbers.map((roundNumber) => {
      const playing = new Set<string>()

      for (const match of matches) {
        if (match.round_number !== roundNumber) continue

        for (const side of [match.side_a, match.side_b]) {
          if (side.entryIds) {
            side.entryIds.forEach((id) => playing.add(id))
          } else if (side.entryId) {
            playing.add(side.entryId)
          }
        }
      }

      const resting = Array.from(activeIds)
        .filter((id) => !playing.has(id))
        .map((id) => names.get(id) ?? "Player")
        .sort((a, b) => a.localeCompare(b))

      return { roundNumber, resting }
    })
  }, [matches, roster, stageEntries])

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
            <strong>Rotation.</strong>{" "}Check who rests in each round. Use this view during play to anticipate the next sit-outs and keep the rotation easy to manage.
          </p>
        </div>
      </div>

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
                "flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                index > 0 ? "border-t border-neutral-200" : "",
              ].join(" ")}
            >
              <span className="text-sm font-black text-neutral-950">
                Round {row.roundNumber}
              </span>
              <span className="text-sm text-neutral-600">
                {row.resting.length
                  ? `Out: ${row.resting.join(" · ")}`
                  : "Everyone plays"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
