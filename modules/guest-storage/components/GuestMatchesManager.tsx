"use client"

import Image from "next/image"
import { FormEvent, useEffect, useMemo, useState } from "react"

import type { CompetitionCourt } from "@/modules/competition-courts/types"
import type { CompetitionEntry } from "@/modules/competition-entries/types"
import type { CompetitionStage } from "@/modules/competition-stages/types"
import type { MatchRow, MatchSide, MatchSlot } from "@/modules/matches/types"

import {
  saveGuestBestOf3Result,
  saveGuestRetirementResult,
  saveGuestSingleSetResult,
  undoGuestMatchResult,
} from "@/modules/guest-storage/services/guestMatch.service"
import { useStageTimer } from "@/modules/stage-timer/hooks/useStageTimer"
import { addGuestIndividualRotationRound } from "@/modules/guest-storage/services/guestStageGeneration.service"

export type ScoreFormat = "single_set" | "best_of_3"

function slotName(slot: MatchSlot, entries: Map<string, CompetitionEntry>) {
  if (slot.type === "entry" && slot.entryId) {
    return entries.get(slot.entryId)?.display_name ?? "Unknown entry"
  }
  if (slot.type === "bye") return "BYE"
  if (slot.type === "winner") return slot.label ?? "Winner of previous match"
  if (slot.type === "loser") return slot.label ?? "Loser of previous match"
  if (slot.type === "rotation_team" && slot.entryIds) {
    return slot.entryIds.map((id) => entries.get(id)?.display_name ?? "Unknown").join(" + ")
  }
  return slot.label ?? "TBD"
}

function slotResolved(slot: MatchSlot) {
  return (
    (slot.type === "entry" && Boolean(slot.entryId)) ||
    (slot.type === "rotation_team" &&
      Array.isArray(slot.entryIds) &&
      slot.entryIds.length === 2 &&
      slot.entryIds.every((id) => typeof id === "string" && id.length > 0))
  )
}

function statusLabel(status: MatchRow["status"]) {
  if (status === "on_court") return "LIVE"
  if (status === "completed") return "COMPLETED"
  if (status === "ready") return "READY"
  return "PENDING"
}

function statusClasses(status: MatchRow["status"]) {
  if (status === "on_court") return "border-amber-300 bg-amber-50 text-amber-800"
  if (status === "completed") return "border-emerald-300 bg-emerald-50 text-emerald-800"
  if (status === "ready") return "border-sky-300 bg-sky-50 text-sky-800"
  return "border-neutral-300 bg-neutral-50 text-neutral-600"
}

function winnerSide(match: MatchRow): MatchSide | null {
  if (match.status !== "completed") return null
  if (match.finish_type === "retirement") {
    if (match.retired_side === "A") return "B"
    if (match.retired_side === "B") return "A"
  }
  if (match.score.format === "best_of_3" && Array.isArray(match.score.sets)) {
    let aSets = 0
    let bSets = 0
    for (const raw of match.score.sets) {
      const row = raw as Record<string, unknown>
      const a = Number(row.a)
      const b = Number(row.b)
      if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) continue
      if (a > b) aSets += 1
      else bSets += 1
    }
    if (aSets > bSets) return "A"
    if (bSets > aSets) return "B"
  }
  if (typeof match.score.scoreA === "number" && typeof match.score.scoreB === "number") {
    if (match.score.scoreA > match.score.scoreB) return "A"
    if (match.score.scoreB > match.score.scoreA) return "B"
  }
  return null
}

function scoreLabel(match: MatchRow) {
  if (match.status !== "completed") return null
  if (match.score.format === "best_of_3" && Array.isArray(match.score.sets)) {
    const label = match.score.sets
      .map((raw) => {
        const row = raw as Record<string, unknown>
        return `${row.a ?? "-"}-${row.b ?? "-"}`
      })
      .join("  ")
    return match.finish_type === "retirement" ? `${label} · RET` : label
  }
  if (typeof match.score.scoreA === "number" && typeof match.score.scoreB === "number") {
    const label = `${match.score.scoreA}-${match.score.scoreB}`
    return match.finish_type === "retirement" ? `${label} · RET` : label
  }
  return match.finish_type === "retirement" ? "RET" : "Completed"
}

function parseScore(value: string, label: string) {
  if (!/^\d+$/.test(value.trim())) throw new Error(`${label} must be a non-negative integer.`)
  const number = Number(value)
  if (!Number.isSafeInteger(number)) throw new Error(`${label} is too large.`)
  return number
}

function roundTitle(rows: MatchRow[], stagesById: Map<string, CompetitionStage>) {
  const first = rows[0]
  if (!first) return "Round"
  const stage = stagesById.get(first.stage_id)
  const group = first.group_key ? ` · Group ${first.group_key}` : ""
  return `${stage?.name ?? "Stage"} · Round ${first.round_number}${group}`
}

export function GuestMatchesManager({
  competitionId,
  matches,
  entries,
  stages,
  courts: _courts,
  onChanged,
}: {
  competitionId: string
  matches: MatchRow[]
  entries: CompetitionEntry[]
  stages: CompetitionStage[]
  courts: CompetitionCourt[]
  onChanged: () => Promise<void>
}) {
  const entriesById = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries])
  const stagesById = useMemo(() => new Map(stages.map((stage) => [stage.id, stage])), [stages])

  const activeStage = stages[0] ?? null
  const isRoundRobin = activeStage?.stageType === "round_robin"
  const timerStage =
    activeStage?.stageType === "individual_rotation" || activeStage?.stageType === "round_robin"
      ? activeStage
      : null
  const matchDurationMinutes = Math.max(1, Number(timerStage?.settings.matchDurationMinutes ?? 10))
  const timer = useStageTimer(matchDurationMinutes)
  const [scoreFormat, setScoreFormat] = useState<ScoreFormat>("single_set")
  const [openRounds, setOpenRounds] = useState<Set<string>>(() => new Set())
  const [addRoundWorking, setAddRoundWorking] = useState(false)
  const [addRoundMessage, setAddRoundMessage] = useState<string | null>(null)
  const [addRoundError, setAddRoundError] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const result = new Map<string, MatchRow[]>()
    const sorted = [...matches].sort((a, b) => {
      if (isRoundRobin) {
        const groupCompare = (a.group_key ?? "").localeCompare(b.group_key ?? "")
        if (groupCompare !== 0) return groupCompare
      }
      return (
        a.round_number - b.round_number ||
        a.match_order - b.match_order ||
        a.match_number - b.match_number
      )
    })

    for (const match of sorted) {
      const group = match.group_key ?? ""
      const key = isRoundRobin
        ? `${match.stage_id}|group|${group}`
        : `${match.stage_id}|round|${match.round_number}|${group}`
      result.set(key, [...(result.get(key) ?? []), match])
    }
    return result
  }, [matches, isRoundRobin])

  useEffect(() => {
    setOpenRounds((current) => {
      const valid = new Set([...current].filter((key) => grouped.has(key)))
      if (valid.size > 0) return valid
      const firstIncomplete = [...grouped.entries()].find(([, rows]) => rows.some((row) => row.status !== "completed"))?.[0]
        ?? [...grouped.keys()][0]
      return firstIncomplete ? new Set([firstIncomplete]) : new Set<string>()
    })
  }, [grouped])

  function toggleRound(key: string) {
    setOpenRounds((current) => {
      return current.has(key) ? new Set<string>() : new Set([key])
    })
  }

  async function handleAddRound() {
    if (!activeStage || activeStage.stageType !== "individual_rotation" || addRoundWorking) return

    setAddRoundWorking(true)
    setAddRoundMessage(null)
    setAddRoundError(null)

    try {
      const result = await addGuestIndividualRotationRound({
        competitionId,
        stageId: activeStage.id,
      })
      setAddRoundMessage(
        `Round ${result.roundNumber} added · ${result.matchCount} ${
          result.matchCount === 1 ? "match" : "matches"
        }`,
      )
      await onChanged()
    } catch (cause) {
      setAddRoundError(
        cause instanceof Error ? cause.message : "Unable to add another round.",
      )
    } finally {
      setAddRoundWorking(false)
    }
  }

  if (matches.length === 0) {
    return (
      <section className="rounded-[18px] border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">Matches</p>
        <h2 className="mt-1 text-lg font-bold text-neutral-950">No generated matches</h2>
        <p className="mt-2 text-sm text-neutral-600">Generate a stage first.</p>
      </section>
    )
  }



  return (
    <>
    {activeStage?.stageType === "individual_rotation" ? (
      <>
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
            <strong>Matches.</strong>{" "}Open a round, enter results directly in each match and use the timer if needed. Add another round only when you want to extend the generated rotation.
          </p>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Continue play
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              Add another round
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Create one additional round using the current match history
              to preserve the best available player rotation and fairness.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleAddRound()}
            disabled={
              addRoundWorking ||
              (activeStage.status !== "generated" && activeStage.status !== "running")
            }
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            {addRoundWorking ? "Adding round..." : "Add Round"}
          </button>
        </div>

        {addRoundMessage ? (
          <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {addRoundMessage}
          </div>
        ) : null}

        {addRoundError ? (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {addRoundError}
          </div>
        ) : null}
      </section>
      </>
    ) : null}

    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">Play</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">Matches</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {isRoundRobin
              ? "Open a group and enter its results directly."
              : "Edit results directly inside each round. No separate match page."}
          </p>
        </div>

        <div className="w-full lg:max-w-md">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Scoring</p>
          <div className="grid grid-cols-2 rounded-[14px] bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setScoreFormat("single_set")}
              className={[
                "min-h-10 rounded-[10px] px-4 text-xs font-black transition",
                scoreFormat === "single_set"
                  ? "bg-white text-neutral-950 shadow-sm ring-1 ring-neutral-200"
                  : "text-neutral-500",
              ].join(" ")}
            >
              −&nbsp;&nbsp; Single set
            </button>
            <button
              type="button"
              onClick={() => setScoreFormat("best_of_3")}
              className={[
                "min-h-10 rounded-[10px] px-4 text-xs font-black transition",
                scoreFormat === "best_of_3"
                  ? "bg-white text-neutral-950 shadow-sm ring-1 ring-neutral-200"
                  : "text-neutral-500",
              ].join(" ")}
            >
              ≡&nbsp;&nbsp; Best of 3
            </button>
          </div>
        </div>
      </div>

      {timerStage ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <span className={["h-2.5 w-2.5 rounded-full", timer.running ? "bg-red-500" : "bg-neutral-300"].join(" ")} />
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-red-500">Timer</span>
          <span className="text-xs font-semibold text-neutral-500">{matchDurationMinutes} min · {timer.running ? "RUNNING" : timer.remainingSeconds === 0 ? "ENDED" : "READY"}</span>
          <span className="ml-auto font-mono text-2xl font-black tracking-tight text-neutral-950">{timer.label}</span>
          <button type="button" onClick={() => timer.adjust(-60)} className="h-9 min-w-9 rounded-lg border border-neutral-300 bg-white px-2 text-xs font-black">−1</button>
          <button type="button" onClick={timer.reset} aria-label="Reset timer" className="h-9 w-9 rounded-lg border border-neutral-300 bg-white font-bold">↶</button>
          <button type="button" onClick={timer.running ? timer.pause : timer.start} className="h-10 min-w-12 rounded-lg border border-neutral-950 bg-[var(--arena-yellow)] px-3 font-black">{timer.running ? "Ⅱ" : "▶"}</button>
          <button type="button" onClick={timer.end} aria-label="End timer" className="h-9 w-9 rounded-lg border border-neutral-950 bg-white font-black">■</button>
          <button type="button" onClick={() => timer.adjust(60)} className="h-9 min-w-9 rounded-lg border border-neutral-300 bg-white px-2 text-xs font-black">+1</button>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {[...grouped.entries()].map(([key, rows]) => {
          const isOpen = openRounds.has(key)
          const completed = rows.filter((match) => match.status === "completed").length
          return (
            <div key={key} className="overflow-hidden rounded-[16px] border border-neutral-200">
              <button
                type="button"
                onClick={() => toggleRound(key)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 bg-neutral-50 px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                    {isRoundRobin ? "Group" : "Round"}
                  </span>
                  <span className="mt-0.5 block text-base font-black text-neutral-950">
                    {isRoundRobin
                      ? `Group ${rows[0]?.group_key ?? "—"}`
                      : roundTitle(rows, stagesById)}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-neutral-500">{completed}/{rows.length} completed</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-neutral-300 bg-white font-black text-neutral-800">{isOpen ? "−" : "+"}</span>
                </span>
              </button>

              {isOpen ? (
                <div className={isRoundRobin ? "grid gap-px bg-neutral-200 md:grid-cols-2" : "divide-y divide-neutral-200"}>
                  {rows.map((match) => (
                    <div key={match.id} className="bg-white">
                    <InlineMatchEditor
                      competitionId={competitionId}
                      match={match}
                      entriesById={entriesById}
                      scoreFormat={scoreFormat}
                      onChanged={onChanged}
                    />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
    </>
  )
}

export function InlineMatchEditor({
  competitionId,
  match,
  entriesById,
  scoreFormat,
  onChanged,
}: {
  competitionId: string
  match: MatchRow
  entriesById: Map<string, CompetitionEntry>
  scoreFormat: ScoreFormat
  onChanged: () => Promise<void>
}) {
  const a = slotName(match.side_a, entriesById)
  const b = slotName(match.side_b, entriesById)
  const resolved = slotResolved(match.side_a) && slotResolved(match.side_b)
  const winner = winnerSide(match)

  const [singleA, setSingleA] = useState(typeof match.score.scoreA === "number" ? String(match.score.scoreA) : "")
  const [singleB, setSingleB] = useState(typeof match.score.scoreB === "number" ? String(match.score.scoreB) : "")
  const [sets, setSets] = useState<Array<{ a: string; b: string }>>(() => {
    const stored = Array.isArray(match.score.sets)
      ? match.score.sets.slice(0, 3).map((raw) => {
          const row = raw as Record<string, unknown>
          return {
            a: typeof row.a === "number" ? String(row.a) : "",
            b: typeof row.b === "number" ? String(row.b) : "",
          }
        })
      : []
    while (stored.length < 3) stored.push({ a: "", b: "" })
    return stored
  })
  const [retiredSide, setRetiredSide] = useState<MatchSide | "">(match.retired_side ?? "")
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setSingleA(typeof match.score.scoreA === "number" ? String(match.score.scoreA) : "")
    setSingleB(typeof match.score.scoreB === "number" ? String(match.score.scoreB) : "")
    setRetiredSide(match.retired_side ?? "")
    const stored = Array.isArray(match.score.sets)
      ? match.score.sets.slice(0, 3).map((raw) => {
          const row = raw as Record<string, unknown>
          return {
            a: typeof row.a === "number" ? String(row.a) : "",
            b: typeof row.b === "number" ? String(row.b) : "",
          }
        })
      : []
    while (stored.length < 3) stored.push({ a: "", b: "" })
    setSets(stored)
  }, [match])

  async function run(operation: () => Promise<void>, success: string) {
    setWorking(true)
    setError(null)
    setMessage(null)
    try {
      await operation()
      setMessage(success)
      await onChanged()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Operation failed.")
    } finally {
      setWorking(false)
    }
  }

  function completedSets() {
    return sets.flatMap((set, index) => {
      if (!set.a.trim() && !set.b.trim()) return []
      if (!set.a.trim() || !set.b.trim()) throw new Error(`Set ${index + 1} must contain both scores.`)
      return [{
        scoreA: parseScore(set.a, `Set ${index + 1} score A`),
        scoreB: parseScore(set.b, `Set ${index + 1} score B`),
      }]
    })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!resolved) {
      setError("Both participants must be resolved before entering a result.")
      return
    }

    if (retiredSide === "A" || retiredSide === "B") {
      let resultSets: Array<{ scoreA: number; scoreB: number }>
      if (scoreFormat === "single_set") {
        resultSets =
          singleA.trim() || singleB.trim()
            ? [{ scoreA: parseScore(singleA || "0", "Score A"), scoreB: parseScore(singleB || "0", "Score B") }]
            : []
      } else {
        resultSets = completedSets()
      }
      await run(
        () => saveGuestRetirementResult({
          competitionId,
          matchId: match.id,
          retiredSide,
          scoreFormat,
          sets: resultSets,
        }),
        "Retirement saved.",
      )
      return
    }

    if (scoreFormat === "single_set") {
      await run(
        () => saveGuestSingleSetResult({
          competitionId,
          matchId: match.id,
          scoreA: parseScore(singleA, "Score A"),
          scoreB: parseScore(singleB, "Score B"),
        }),
        "Result saved.",
      )
      return
    }

    await run(
      () => saveGuestBestOf3Result({
        competitionId,
        matchId: match.id,
        sets: completedSets(),
      }),
      "Result saved.",
    )
  }

  if (match.is_bye) {
    return <div className="bg-white px-3 py-3 text-sm"><span className="font-black text-neutral-400">#{match.visible_match_number ?? match.match_number}</span><span className="ml-3 font-bold text-neutral-800">{a}</span><span className="ml-2 text-xs font-black text-neutral-500">BYE</span></div>
  }

  if (match.status === "completed") {
    return (
      <div className="bg-white">
        <button type="button" onClick={() => setExpanded((value) => !value)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-3 text-left">
          <span className="text-xs font-black text-neutral-400">#{match.visible_match_number ?? match.match_number}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-neutral-800">{a}</span>
            <span className="block truncate text-sm font-medium text-neutral-800">{b}</span>
          </span>
          <span className="font-mono text-sm font-black text-neutral-950">{scoreLabel(match)}</span>
          <span className="text-lg font-black text-neutral-400">{expanded ? "−" : "+"}</span>
        </button>
        {expanded ? (
          <div className="border-t border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-neutral-400">Match #{match.visible_match_number ?? match.match_number}{match.court_label ? ` · ${match.court_label}` : ""}</span>
              <span className={["rounded-md border px-2 py-1 text-[9px] font-black", statusClasses(match.status)].join(" ")}>{statusLabel(match.status)}</span>
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-3"><span className={winner === "A" ? "font-bold text-emerald-700" : "text-neutral-950"}>{a}</span><span className="font-mono font-black">{compactSideScore(match, "A")}</span></div>
              <div className="flex items-center justify-between gap-3"><span className={winner === "B" ? "font-bold text-emerald-700" : "text-neutral-950"}>{b}</span><span className="font-mono font-black">{compactSideScore(match, "B")}</span></div>
            </div>
            {match.finish_type === "retirement" ? <div className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-700">Retirement</div> : null}
            <button type="button" disabled={working} onClick={() => void run(() => undoGuestMatchResult({ competitionId, matchId: match.id }), "Result removed.")} className="mt-4 min-h-11 w-full rounded-lg border border-amber-400 bg-amber-50 px-4 text-sm font-bold text-amber-700 disabled:opacity-50">{working ? "Working..." : "Undo result"}</button>
            {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}
            {message ? <p className="mt-2 text-xs font-semibold text-emerald-700">{message}</p> : null}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="bg-white">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-3 text-left">
        <span className="text-xs font-black text-neutral-400">#{match.visible_match_number ?? match.match_number}</span>
        <span className="min-w-0"><span className="block truncate text-sm font-medium text-neutral-800">{a}</span><span className="block truncate text-sm font-medium text-neutral-800">{b}</span></span>
        <span className={["rounded-md border px-2 py-1 text-[9px] font-black", statusClasses(match.status)].join(" ")}>{statusLabel(match.status)}</span>
        <span className="text-lg font-black text-neutral-400">{expanded ? "−" : "+"}</span>
      </button>
      {expanded ? (
      <form onSubmit={(event) => void save(event)} className="border-t border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-black text-neutral-400">Match #{match.visible_match_number ?? match.match_number}</div>
          {match.court_label ? <div className="mt-1 text-xs font-semibold text-neutral-500">{match.court_label}</div> : null}
        </div>
        <span className={["rounded-md border px-2 py-1 text-[10px] font-black", statusClasses(match.status)].join(" ")}>{statusLabel(match.status)}</span>
      </div>

      {!resolved ? <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">Waiting for participants from a previous match.</div> : null}

      <div className="mt-3 space-y-2">
        <div className={scoreFormat === "single_set" ? "grid grid-cols-[auto_minmax(0,1fr)_3.5rem] items-center gap-2" : "grid grid-cols-[auto_minmax(0,1fr)_repeat(3,2.75rem)] items-center gap-2"}>
          <label className="flex min-w-0 items-center gap-2 font-normal text-neutral-950">
            <span className="flex flex-col items-center">
              <input type="checkbox" checked={retiredSide === "A"} onChange={(event) => setRetiredSide(event.target.checked ? "A" : "")} />
              <span className="mt-0.5 text-[8px] font-normal text-neutral-500">ret.</span>
            </span>
            <span className="max-w-[10.5rem] whitespace-normal break-words text-[13px] leading-[1.15] sm:max-w-none sm:text-sm sm:leading-5">{a}</span>
          </label>
          <span />
          {scoreFormat === "single_set" ? (
            <input value={singleA} onChange={(event) => setSingleA(event.target.value)} inputMode="numeric" disabled={!resolved || working} className="h-11 w-full rounded-lg border border-neutral-300 px-1 text-center font-mono font-black disabled:bg-neutral-100" />
          ) : (
            sets.map((set, index) => (
              <input key={`a-${index}`} value={set.a} onChange={(event) => setSets((current) => current.map((row, i) => i === index ? { ...row, a: event.target.value } : row))} inputMode="numeric" disabled={!resolved || working} aria-label={`${a} set ${index + 1}`} tabIndex={index * 2 + 1} className="h-11 w-full rounded-lg border border-neutral-300 px-1 text-center font-mono font-black disabled:bg-neutral-100" />
            ))
          )}
        </div>

        <div className="text-center text-[10px] font-black uppercase tracking-wide text-neutral-500">VS</div>

        <div className={scoreFormat === "single_set" ? "grid grid-cols-[auto_minmax(0,1fr)_3.5rem] items-center gap-2" : "grid grid-cols-[auto_minmax(0,1fr)_repeat(3,2.75rem)] items-center gap-2"}>
          <label className="flex min-w-0 items-center gap-2 font-normal text-neutral-950">
            <span className="flex flex-col items-center">
              <input type="checkbox" checked={retiredSide === "B"} onChange={(event) => setRetiredSide(event.target.checked ? "B" : "")} />
              <span className="mt-0.5 text-[8px] font-normal text-neutral-500">ret.</span>
            </span>
            <span className="max-w-[10.5rem] whitespace-normal break-words text-[13px] leading-[1.15] sm:max-w-none sm:text-sm sm:leading-5">{b}</span>
          </label>
          <span />
          {scoreFormat === "single_set" ? (
            <input value={singleB} onChange={(event) => setSingleB(event.target.value)} inputMode="numeric" disabled={!resolved || working} className="h-11 w-full rounded-lg border border-neutral-300 px-1 text-center font-mono font-black disabled:bg-neutral-100" />
          ) : (
            sets.map((set, index) => (
              <input key={`b-${index}`} value={set.b} onChange={(event) => setSets((current) => current.map((row, i) => i === index ? { ...row, b: event.target.value } : row))} inputMode="numeric" disabled={!resolved || working} aria-label={`${b} set ${index + 1}`} tabIndex={index * 2 + 2} className="h-11 w-full rounded-lg border border-neutral-300 px-1 text-center font-mono font-black disabled:bg-neutral-100" />
            ))
          )}
        </div>
      </div>

      <button type="submit" disabled={working || !resolved} className="mt-4 min-h-11 w-full rounded-xl bg-[var(--arena-yellow)] px-5 text-sm font-black text-[var(--arena-black)] disabled:opacity-40">
        {working ? "Saving..." : "Save result"}
      </button>

      {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}
      {message ? <p className="mt-2 text-xs font-semibold text-emerald-700">{message}</p> : null}
      </form>
      ) : null}
    </div>
  )
}

function compactSideScore(match: MatchRow, side: MatchSide) {
  if (match.score.format === "best_of_3" && Array.isArray(match.score.sets)) {
    return match.score.sets.map((raw) => { const row = raw as Record<string, unknown>; return String(side === "A" ? row.a ?? "-" : row.b ?? "-") }).join(" ")
  }
  const value = side === "A" ? match.score.scoreA : match.score.scoreB
  return typeof value === "number" ? String(value) : ""
}
