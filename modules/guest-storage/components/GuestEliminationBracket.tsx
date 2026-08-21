"use client"

import { useMemo, useState } from "react"

import type { CompetitionEntry } from "@/modules/competition-entries/types"
import type { CompetitionStage } from "@/modules/competition-stages/types"
import type { MatchRow, MatchSlot } from "@/modules/matches/types"

import {
  InlineMatchEditor,
  type ScoreFormat,
} from "./GuestMatchesManager"

function slotName(slot: MatchSlot, entries: Map<string, CompetitionEntry>) {
  if (slot.type === "entry" && slot.entryId) {
    return entries.get(slot.entryId)?.display_name ?? "Unknown entry"
  }
  if (slot.type === "bye") return "BYE"
  if (slot.type === "winner") return slot.label ?? "Winner of previous match"
  if (slot.type === "loser") return slot.label ?? "Loser of previous match"
  return slot.label ?? "TBD"
}

function roundLabel(round: number, maxRound: number) {
  if (round === maxRound) return "Final"
  if (round === maxRound - 1) return "Semifinals"
  if (round === maxRound - 2) return "Quarterfinals"
  return `Round ${round}`
}

function singleSetScoreStrings(match: MatchRow): { a: string; b: string } {
  const score = match.score as Record<string, unknown>

  return {
    a: typeof score.scoreA === "number" ? String(score.scoreA) : "",
    b: typeof score.scoreB === "number" ? String(score.scoreB) : "",
  }
}

function scoreText(match: MatchRow) {
  if (match.status !== "completed") return null
  if (match.finish_type === "retirement") return "RET"
  if (match.score.format === "best_of_3" && Array.isArray(match.score.sets)) {
    return match.score.sets
      .map((raw) => {
        const row = raw as Record<string, unknown>
        return `${row.a ?? "–"}-${row.b ?? "–"}`
      })
      .join("  ")
  }
  if (typeof match.score.scoreA === "number" && typeof match.score.scoreB === "number") {
    return `${match.score.scoreA}-${match.score.scoreB}`
  }
  return null
}

export function GuestEliminationBracket({
  competitionId,
  stage,
  matches,
  entries,
  onChanged,
}: {
  competitionId: string
  stage: CompetitionStage
  matches: MatchRow[]
  entries: CompetitionEntry[]
  onChanged: () => Promise<void>
}) {
  const [openMatchId, setOpenMatchId] = useState<string | null>(null)
  const [scoreFormat, setScoreFormat] = useState<ScoreFormat>("single_set")
  const entriesById = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries])

  const rounds = useMemo(() => {
    const map = new Map<number, MatchRow[]>()
    for (const match of [...matches].sort(
      (a, b) => a.round_number - b.round_number || a.match_order - b.match_order,
    )) {
      map.set(match.round_number, [...(map.get(match.round_number) ?? []), match])
    }
    return [...map.entries()]
  }, [matches])

  const maxRound = Math.max(0, ...matches.map((match) => match.round_number))

  if (!matches.length) {
    return (
      <section className="rounded-[18px] border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-black text-neutral-950">Bracket</h2>
        <p className="mt-2 text-sm text-neutral-500">Generate the stage to create the bracket.</p>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Elimination</p>
          <h2 className="mt-1 text-xl font-black text-neutral-950">Bracket</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Tap a playable match to enter or undo its result. Winners advance automatically.
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-[12px] bg-neutral-100 p-1">
          {(["single_set", "best_of_3"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setScoreFormat(mode)}
              className={[
                "min-h-9 rounded-[9px] px-3 text-xs font-black",
                scoreFormat === mode ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500",
              ].join(" ")}
            >
              {mode === "single_set" ? "Single set" : "Best of 3"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="flex min-w-max items-start gap-4">
          {rounds.map(([round, rows]) => (
            <div key={round} className="w-[290px] shrink-0">
              <div className="mb-2 px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                  Round {round}
                </p>
                <h3 className="text-sm font-black text-neutral-950">{roundLabel(round, maxRound)}</h3>
              </div>

              <div className="space-y-3">
                {rows.map((match) => {
                  const a = slotName(match.side_a, entriesById)
                  const b = slotName(match.side_b, entriesById)
                  const open = openMatchId === match.id
                  const score = scoreText(match)
                  const singleScores = singleSetScoreStrings(match)
                  const playable = !match.is_bye &&
                    match.side_a.type === "entry" &&
                    match.side_b.type === "entry"

                  return (
                    <div
                      key={match.id}
                      className={[
                        "overflow-hidden rounded-[14px] border",
                        match.status === "completed"
                          ? "border-neutral-300 bg-neutral-100"
                          : "border-neutral-200 bg-white",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        disabled={!playable && match.status !== "completed"}
                        onClick={() => setOpenMatchId(open ? null : match.id)}
                        className="w-full p-3 text-left disabled:cursor-default"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                            Match {match.visible_match_number ?? match.match_number}
                          </span>
                          <span className={[
                            "rounded-full px-2 py-1 text-[9px] font-black uppercase",
                            match.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : playable
                                ? "bg-amber-100 text-amber-700"
                                : "bg-neutral-100 text-neutral-500",
                          ].join(" ")}>
                            {match.is_bye ? "BYE" : match.status === "completed" ? "Completed" : playable ? "Ready" : "Waiting"}
                          </span>
                        </div>

                        <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 text-sm">
                          <span className={match.winner_side === "A" ? "font-semibold text-emerald-700" : "text-neutral-800"}>
                            {a}
                          </span>
                          <span className="font-black text-neutral-950">
                            {score ? singleScores.a : ""}
                          </span>
                          <span className={match.winner_side === "B" ? "font-semibold text-emerald-700" : "text-neutral-800"}>
                            {b}
                          </span>
                          <span className="font-black text-neutral-950">
                            {score ? singleScores.b : ""}
                          </span>
                        </div>

                        {score && match.score.format !== "single_set" ? (
                          <p className="mt-2 text-right text-xs font-black text-neutral-700">{score}</p>
                        ) : null}
                      </button>

                      {open ? (
                        <div className="border-t border-neutral-200 bg-white">
                          <InlineMatchEditor
                            competitionId={competitionId}
                            match={match}
                            entriesById={entriesById}
                            scoreFormat={scoreFormat}
                            onChanged={onChanged}
                          />
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
