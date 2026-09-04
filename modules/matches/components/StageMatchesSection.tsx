"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"

import { useStage } from "../../competition-stages/hooks"
import {
  listStageMatchesAction,
  saveBestOf3ResultAction,
  saveRetirementResultAction,
  saveSingleSetResultAction,
  undoMatchResultAction,
} from "../actions"
import type { MatchDetailView, MatchParticipantView } from "../view"
import { useStageTimer } from "@/modules/stage-timer/hooks/useStageTimer"

type ScoreFormat = "single_set" | "best_of_3"
type Side = "A" | "B"
type SetDraft = { a: string; b: string }

function playerName(player: MatchParticipantView) {
  return `${player.seed !== null ? `(${player.seed}) ` : ""}${player.displayName}`
}

function isResolved(player: MatchParticipantView) {
  return Boolean(player.displayName.trim()) && player.displayName !== "TBD"
}

function statusLabel(match: MatchDetailView) {
  if (match.isBye) return "BYE"
  if (match.status === "on_court") return "LIVE"
  if (match.status === "completed") return "COMPLETED"
  if (match.status === "ready") return "READY"
  return "PENDING"
}

function statusClass(match: MatchDetailView) {
  if (match.status === "completed") return "border-emerald-300 bg-emerald-50 text-emerald-800"
  if (match.status === "on_court") return "border-amber-300 bg-amber-50 text-amber-800"
  if (match.status === "ready") return "border-sky-300 bg-sky-50 text-sky-800"
  return "border-neutral-300 bg-neutral-50 text-neutral-600"
}

function parseScore(value: string, label: string) {
  if (!/^\d+$/.test(value.trim())) throw new Error(`${label} must be a non-negative integer.`)
  const number = Number(value)
  if (!Number.isSafeInteger(number)) throw new Error(`${label} is too large.`)
  return number
}

function singleScore(match: MatchDetailView, side: Side) {
  const value =
    match.score[side === "A" ? "scoreA" : "scoreB"] ??
    match.score[side === "A" ? "a" : "b"]
  return typeof value === "number" || typeof value === "string" ? String(value) : ""
}

function setDrafts(match: MatchDetailView): SetDraft[] {
  const rows = Array.isArray(match.score.sets)
    ? match.score.sets.slice(0, 3).map((raw) => {
        const row = raw as Record<string, unknown>
        return {
          a: typeof row.a === "number" || typeof row.a === "string" ? String(row.a) : "",
          b: typeof row.b === "number" || typeof row.b === "string" ? String(row.b) : "",
        }
      })
    : []
  while (rows.length < 3) rows.push({ a: "", b: "" })
  return rows
}

export function StageMatchesSection({ refreshKey = 0 }: { refreshKey?: number }) {
  const stage = useStage()
  const [matches, setMatches] = useState<MatchDetailView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scoreFormat, setScoreFormat] = useState<ScoreFormat>("single_set")
  const [openRounds, setOpenRounds] = useState<Set<number>>(() => new Set([1]))
  const matchDurationMinutes = Math.max(1, Number(stage.settings?.matchDurationMinutes ?? 10))
  const timer = useStageTimer(matchDurationMinutes)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const matchRows = await listStageMatchesAction(stage.id)
      setMatches(matchRows)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load matches.")
    } finally {
      setLoading(false)
    }
  }, [stage.id, stage.competitionId])

  useEffect(() => { void load() }, [load, refreshKey])

  const rounds = useMemo(() => {
    const grouped = new Map<number, MatchDetailView[]>()
    for (const match of [...matches].sort((a, b) => a.roundNumber - b.roundNumber || a.matchNumber - b.matchNumber)) {
      grouped.set(match.roundNumber, [...(grouped.get(match.roundNumber) ?? []), match])
    }
    return [...grouped.entries()]
  }, [matches])

  useEffect(() => {
    if (!rounds.length) return
    const firstIncomplete = rounds.find(([, rows]) => rows.some((row) => row.status !== "completed"))?.[0] ?? rounds[0][0]
    setOpenRounds((current) => current.size === 0 ? new Set([firstIncomplete]) : current)
  }, [rounds])

  function toggleRound(round: number) {
    setOpenRounds((current) => current.has(round) ? new Set<number>() : new Set([round]))
  }

  return (
    <section className="border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">Play</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">Matches</h2>
          <p className="mt-1 text-sm text-neutral-600">Edit results directly inside each round. No separate match page.</p>
        </div>

        <div className="w-full lg:max-w-md">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Scoring</p>
          <div className="grid grid-cols-2 rounded-[14px] bg-neutral-100 p-1">
            {(["single_set", "best_of_3"] as ScoreFormat[]).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => setScoreFormat(format)}
                className={[
                  "min-h-10 rounded-[10px] px-4 text-xs font-black transition",
                  scoreFormat === format ? "bg-white text-neutral-950 shadow-sm ring-1 ring-neutral-200" : "text-neutral-500",
                ].join(" ")}
              >
                {format === "single_set" ? "−  Single set" : "≡  Best of 3"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {stage.stageType === "individual_rotation" || stage.stageType === "round_robin" ? (
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

      {loading ? <div className="mt-5 border border-neutral-200 bg-neutral-50 px-5 py-10 text-center text-sm text-neutral-500">Loading matches...</div> : null}
      {error ? <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}

      {!loading && !error && matches.length === 0 ? (
        <div className="mt-5 border border-dashed border-neutral-300 bg-neutral-50 px-5 py-10 text-center">
          <p className="text-sm font-bold text-neutral-950">No generated matches</p>
          <p className="mt-1 text-sm text-neutral-500">Generate the stage first.</p>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="mt-5 space-y-3">
          {rounds.map(([round, rows]) => {
            const open = openRounds.has(round)
            const completed = rows.filter((row) => row.status === "completed").length
            return (
              <div key={round} className="overflow-hidden rounded-[16px] border border-neutral-200">
                <button type="button" onClick={() => toggleRound(round)} className="flex w-full items-center justify-between gap-3 bg-neutral-50 px-4 py-3 text-left">
                  <span>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Round</span>
                    <span className="mt-0.5 block text-base font-black text-neutral-950">Round {round}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-neutral-500">{completed}/{rows.length} completed</span>
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-neutral-300 bg-white font-black">{open ? "−" : "+"}</span>
                  </span>
                </button>

                {open ? (
                  <div className="grid gap-px bg-neutral-200 md:grid-cols-2">
                    {rows.map((match) => (
                      <InlineMatchEditor
                        key={match.id}
                        competitionId={stage.competitionId}
                        stageId={stage.id}
                        match={match}
                        scoreFormat={scoreFormat}
                        onChanged={load}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

function InlineMatchEditor({
  competitionId, stageId, match, scoreFormat, onChanged,
}: {
  competitionId: string
  stageId: string
  match: MatchDetailView
  scoreFormat: ScoreFormat
  onChanged: () => Promise<void>
}) {
  const a = playerName(match.sideA)
  const b = playerName(match.sideB)
  const resolved = isResolved(match.sideA) && isResolved(match.sideB)

  const [singleA, setSingleA] = useState(() => singleScore(match, "A"))
  const [singleB, setSingleB] = useState(() => singleScore(match, "B"))
  const [sets, setSets] = useState<SetDraft[]>(() => setDrafts(match))
  const [retiredSide, setRetiredSide] = useState<Side | "">(match.retiredSide ?? "")
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setSingleA(singleScore(match, "A"))
    setSingleB(singleScore(match, "B"))
    setSets(setDrafts(match))
    setRetiredSide(match.retiredSide ?? "")
  }, [match])

  async function run(operation: () => Promise<void>, success: string) {
    setWorking(true); setError(null); setMessage(null)
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
      return [{ scoreA: parseScore(set.a, `Set ${index + 1} score A`), scoreB: parseScore(set.b, `Set ${index + 1} score B`) }]
    })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!resolved) return setError("Both participants must be resolved before entering a result.")

    try {
      if (retiredSide) {
        const resultSets = scoreFormat === "single_set"
          ? (singleA.trim() || singleB.trim()
              ? [{ scoreA: parseScore(singleA || "0", "Score A"), scoreB: parseScore(singleB || "0", "Score B") }]
              : [])
          : completedSets()

        await run(() => saveRetirementResultAction({
          competitionId, stageId, matchId: match.id, retiredSide, scoreFormat, sets: resultSets,
        }), "Retirement saved.")
        return
      }

      if (scoreFormat === "single_set") {
        await run(() => saveSingleSetResultAction({
          competitionId, stageId, matchId: match.id,
          scoreA: parseScore(singleA, "Score A"),
          scoreB: parseScore(singleB, "Score B"),
        }), "Result saved.")
        return
      }

      const resultSets = completedSets()
      if (!resultSets.length) throw new Error("Enter at least one completed set.")
      await run(() => saveBestOf3ResultAction({
        competitionId, stageId, matchId: match.id, sets: resultSets,
      }), "Result saved.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save result.")
    }
  }

  if (match.isBye) {
    return <div className="bg-white px-3 py-3 text-sm"><span className="font-black text-neutral-400">#{match.visibleMatchNumber ?? match.matchNumber}</span><span className="ml-3 font-bold text-neutral-800">{a}</span><span className="ml-2 text-xs font-black text-neutral-500">BYE</span></div>
  }

  if (match.status === "completed") {
    return (
      <div className="bg-white">
        <button type="button" onClick={() => setExpanded((value) => !value)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-3 text-left">
          <span className="text-xs font-black text-neutral-400">#{match.visibleMatchNumber ?? match.matchNumber}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-neutral-800">{a}</span>
            <span className="block truncate text-sm font-medium text-neutral-800">{b}</span>
          </span>
          <span className="font-mono text-sm font-black text-neutral-950">{compactScore(match)}</span>
          <span className="text-lg font-black text-neutral-400">{expanded ? "−" : "+"}</span>
        </button>
        {expanded ? (
          <div className="border-t border-neutral-200 bg-neutral-50 p-4">
            <MatchTop match={match} />
            <CompletedRow name={a} side="A" match={match} />
            <div className="my-2 text-center text-[10px] font-black text-neutral-500">VS</div>
            <CompletedRow name={b} side="B" match={match} />
            {match.finishType === "retirement" ? <p className="mt-3 text-xs font-bold uppercase text-amber-700">Retirement</p> : null}
            <button type="button" disabled={working} onClick={() => void run(() => undoMatchResultAction({ competitionId, stageId, matchId: match.id }), "Result removed.")} className="mt-4 min-h-11 w-full rounded-lg border border-amber-400 bg-amber-50 px-4 text-sm font-bold text-amber-700 disabled:opacity-50">
              {working ? "Working..." : "Undo result"}
            </button>
            <Feedback error={error} message={message} />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="bg-white">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-3 text-left">
        <span className="text-xs font-black text-neutral-400">#{match.visibleMatchNumber ?? match.matchNumber}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-neutral-800">{a}</span>
          <span className="block truncate text-sm font-medium text-neutral-800">{b}</span>
        </span>
        <span className={["rounded-md border px-2 py-1 text-[9px] font-black", statusClass(match)].join(" ")}>{statusLabel(match)}</span>
        <span className="text-lg font-black text-neutral-400">{expanded ? "−" : "+"}</span>
      </button>
      {expanded ? (
      <form onSubmit={(event) => void save(event)} className="border-t border-neutral-200 bg-neutral-50 p-4">
        <MatchTop match={match} />

      {!resolved ? <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">Waiting for participants from a previous match.</div> : null}

      <div className="mt-4 space-y-2">
        <ScoreRow name={a} side="A" scoreFormat={scoreFormat} resolved={resolved} working={working} retiredSide={retiredSide} setRetiredSide={setRetiredSide} single={singleA} setSingle={setSingleA} sets={sets} setSets={setSets} />
        <div className="text-center text-[10px] font-black text-neutral-500">VS</div>
        <ScoreRow name={b} side="B" scoreFormat={scoreFormat} resolved={resolved} working={working} retiredSide={retiredSide} setRetiredSide={setRetiredSide} single={singleB} setSingle={setSingleB} sets={sets} setSets={setSets} />
      </div>

      <button type="submit" disabled={working || !resolved} className="mt-4 min-h-11 w-full rounded-lg bg-[var(--arena-yellow)] px-5 text-sm font-black text-[var(--arena-black)] disabled:opacity-40">
        {working ? "Saving..." : "Save result"}
      </button>
        <Feedback error={error} message={message} />
      </form>
      ) : null}
    </div>
  )
}

function compactScore(match: MatchDetailView) {
  if (match.status !== "completed") return ""
  if (Array.isArray(match.score.sets) && match.score.sets.length) {
    return match.score.sets.map((raw) => { const row = raw as Record<string, unknown>; return `${row.a ?? "-"}-${row.b ?? "-"}` }).join("  ")
  }
  const a = singleScore(match, "A")
  const b = singleScore(match, "B")
  return a || b ? `${a}-${b}` : "Completed"
}

function MatchTop({ match }: { match: MatchDetailView }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="text-xs font-black text-neutral-400">Match #{match.visibleMatchNumber ?? match.matchNumber}</div>
        {match.courtLabel ? <div className="mt-1 text-xs font-semibold text-neutral-500">{match.courtLabel}</div> : null}
      </div>
      <span className={["rounded-md border px-2 py-1 text-[10px] font-black", statusClass(match)].join(" ")}>{statusLabel(match)}</span>
    </div>
  )
}

function ScoreRow({
  name, side, scoreFormat, resolved, working, retiredSide, setRetiredSide, single, setSingle, sets, setSets,
}: {
  name: string; side: Side; scoreFormat: ScoreFormat; resolved: boolean; working: boolean
  retiredSide: Side | ""; setRetiredSide: (value: Side | "") => void
  single: string; setSingle: (value: string) => void
  sets: SetDraft[]; setSets: (value: SetDraft[]) => void
}) {
  const key: keyof SetDraft = side === "A" ? "a" : "b"
  return (
    <div className={scoreFormat === "single_set" ? "grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-2" : "grid grid-cols-[minmax(0,1fr)_repeat(3,2.75rem)] items-center gap-2"}>
      <label className="flex min-w-0 items-center gap-2 text-sm">
        <span className="flex flex-col items-center">
          <input type="checkbox" checked={retiredSide === side} onChange={(e) => setRetiredSide(e.target.checked ? side : "")} />
          <span className="text-[8px] text-neutral-500">ret.</span>
        </span>
        <span className="break-words">{name}</span>
      </label>

      {scoreFormat === "single_set" ? (
        <input value={single} onChange={(e) => setSingle(e.target.value)} inputMode="numeric" disabled={!resolved || working} className="h-11 rounded-lg border border-neutral-300 text-center font-mono font-black" />
      ) : sets.map((set, index) => (
        <input
          key={index}
          value={set[key]}
          onChange={(e) => setSets(sets.map((row, i) => i === index ? { ...row, [key]: e.target.value } : row))}
          inputMode="numeric"
          disabled={!resolved || working}
          className="h-11 min-w-0 rounded-lg border border-neutral-300 text-center font-mono font-black"
        />
      ))}
    </div>
  )
}

function CompletedRow({ name, side, match }: { name: string; side: Side; match: MatchDetailView }) {
  const sets = setDrafts(match)
  const bestOf3 = Array.isArray(match.score.sets) && match.score.sets.length > 0
  const winner = match.winnerSide === side
  return (
    <div className={bestOf3 ? "mt-3 grid grid-cols-[minmax(0,1fr)_repeat(3,2.75rem)] items-center gap-2" : "mt-3 grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-2"}>
      <span className={winner ? "font-bold text-emerald-700" : match.winnerSide ? "text-red-600" : "text-neutral-950"}>{name}</span>
      {bestOf3
        ? sets.map((set, index) => <span key={index} className="grid h-11 place-items-center rounded-lg border border-neutral-300 bg-white font-mono font-bold">{set[side === "A" ? "a" : "b"]}</span>)
        : <span className="grid h-11 place-items-center rounded-lg border border-neutral-300 bg-white font-mono font-bold">{singleScore(match, side)}</span>}
    </div>
  )
}

function Feedback({ error, message }: { error: string | null; message: string | null }) {
  return (
    <>
      {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}
      {message ? <p className="mt-2 text-xs font-semibold text-emerald-700">{message}</p> : null}
    </>
  )
}
