"use client"

import { useEffect, useMemo, useState } from "react"

import type { CompetitionEntry } from "@/modules/competition-entries/types"
import type { CompetitionStage } from "@/modules/competition-stages/types"
import type { CompetitionStageEntry } from "@/modules/competition-stage-entries/types"

import {
  generateGuestCompetitionStage,
  saveGuestRoundRobinGroups,
  updateGuestCompetitionStagePlayMode,
  updateGuestRoundRobinGroupCount,
} from "@/modules/guest-storage/services"

import {
  saveGuestIndividualRotationSettings,
} from "@/modules/guest-storage/services/guestStageGeneration.service"

function initialGroupCount(stage: CompetitionStage) {
  const value = stage.settings.groupCount
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 4
    ? value
    : 1
}

function keys(count: number) {
  return Array.from({ length: count }, (_, index) => String.fromCharCode(65 + index))
}

function initialCourtCount(stage: CompetitionStage) {
  const value = stage.settings.courtCount

  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
    ? value
    : 1
}

function initialRequestedRounds(stage: CompetitionStage) {
  const value = stage.settings.requestedRounds

  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 20
    ? value
    : 6
}

export function GuestStageGenerationPanel({
  competitionId,
  stage,
  roster,
  stageEntries,
  matchCount,
  onChanged,
  onSelectPlayers,
  onOpenMatches,
}: {
  competitionId: string
  stage: CompetitionStage
  roster: CompetitionEntry[]
  stageEntries: CompetitionStageEntry[]
  matchCount: number
  onChanged: () => Promise<void>
  onSelectPlayers?: () => void
  onOpenMatches?: () => void
}) {
  const [groupCount, setGroupCount] = useState(() => initialGroupCount(stage))
  const [courtCount, setCourtCount] = useState(() => initialCourtCount(stage))
  const [requestedRounds, setRequestedRounds] = useState(() => initialRequestedRounds(stage))
  const [availableTime, setAvailableTime] = useState(() => {
    const value = stage.settings.availableTimeMinutes
    return typeof value === "number" && Number.isInteger(value) ? value : 60
  })
  const [matchDuration, setMatchDuration] = useState(() => {
    const value = stage.settings.matchDurationMinutes
    return typeof value === "number" && Number.isInteger(value) ? value : 10
  })
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingGeneration, setPendingGeneration] = useState<"ir" | "generic" | null>(null)

  const rosterById = useMemo(
    () => new Map(roster.map((entry) => [entry.id, entry])),
    [roster],
  )
  const active = useMemo(
    () => stageEntries.filter((entry) => entry.status === "active").sort((a, b) => a.sort_order - b.sort_order),
    [stageEntries],
  )
  const groupKeys = useMemo(() => keys(groupCount), [groupCount])
  const locked = stage.status === "generated" || stage.status === "running" || stage.status === "completed"
  const supported =
    stage.stageType === "elimination" ||
    stage.stageType === "round_robin" ||
    stage.stageType === "individual_rotation"

  const generationBusyOverlay = working ? (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4"
      role="status"
      aria-live="polite"
      aria-label="Generating matches"
    >
      <div className="w-full max-w-sm rounded-[18px] border border-neutral-200 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-950" />
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
          Processing
        </p>
        <h2 className="mt-1 text-xl font-black text-neutral-950">
          Generating matches…
        </h2>
        <p className="mt-2 text-sm leading-5 text-neutral-600">
          {stage.stageType === "individual_rotation"
            ? "Optimizing rounds, partners and opponents. This may take a few seconds."
            : stage.stageType === "round_robin"
              ? "Building groups and generating the Round Robin schedule."
              : "Building the bracket, seeds and BYEs."}
        </p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--arena-yellow)]" />
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Please keep this page open until generation is complete.
        </p>
      </div>
    </div>
  ) : null

  useEffect(() => {
    const next: Record<string, string> = {}
    active.forEach((entry, index) => {
      const saved = entry.metadata?.groupKey
      next[entry.id] =
        typeof saved === "string" && groupKeys.includes(saved)
          ? saved
          : groupKeys[index % groupKeys.length]
    })
    setAssignments(next)
  }, [active, groupKeys])

  async function run(operation: () => Promise<void>) {
    setWorking(true)
    setMessage(null)
    setError(null)
    try {
      await operation()
      await onChanged()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Operation failed.")
    } finally {
      setWorking(false)
    }
  }

  function buildBalancedAssignments() {
    const next: Record<string, string> = {}
    const counts = new Map(groupKeys.map((key) => [key, 0]))
    const protectedEntries = active.filter((entry) => entry.seed !== null)
    const otherEntries = active.filter((entry) => entry.seed === null)

    protectedEntries.forEach((entry, index) => {
      const key = groupKeys[index % groupKeys.length]
      next[entry.id] = key
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })

    otherEntries.forEach((entry) => {
      const key = [...groupKeys].sort(
        (a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0) || a.localeCompare(b),
      )[0]
      next[entry.id] = key
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })

    return next
  }

  function distributeEvenly() {
    setAssignments(buildBalancedAssignments())
  }

  async function saveGroups() {
    await saveGuestRoundRobinGroups({
      competitionId,
      stageId: stage.id,
      groupCount,
      assignments: active.map((entry) => ({
        stageEntryId: entry.id,
        groupKey: assignments[entry.id] ?? "",
      })),
    })
    setMessage("Round Robin groups saved.")
  }

  async function changeRoundRobinPlayMode(playMode: "singles" | "doubles") {
    if (stage.settings?.playMode === playMode) return
    await run(async () => {
      await updateGuestCompetitionStagePlayMode({
        competitionId,
        stageId: stage.id,
        playMode,
      })
      setMessage(
        playMode === "doubles"
          ? "Doubles selected. Select teams for this stage."
          : "Singles selected. Select players for this stage.",
      )
    })
  }

  async function changeEliminationPlayMode(playMode: "singles" | "doubles") {
    if (stage.settings?.playMode === playMode) return
    await run(async () => {
      await updateGuestCompetitionStagePlayMode({
        competitionId,
        stageId: stage.id,
        playMode,
      })
      setMessage(
        playMode === "doubles"
          ? "Doubles selected. Select teams and assign numbered seeds."
          : "Singles selected. Select players and assign numbered seeds.",
      )
    })
  }

  async function changeRoundRobinGroupCount(nextGroupCount: number) {
    if (nextGroupCount === groupCount) return
    await run(async () => {
      await updateGuestRoundRobinGroupCount({
        competitionId,
        stageId: stage.id,
        groupCount: nextGroupCount,
      })
      setGroupCount(nextGroupCount)
      setMessage(
        `${nextGroupCount} group${nextGroupCount === 1 ? "" : "s"} selected. You can protect up to ${nextGroupCount} ${stage.settings?.playMode === "doubles" ? "teams" : "players"}.`,
      )
    })
  }

  async function generateRoundRobin() {
    await run(async () => {
      const nextAssignments = buildBalancedAssignments()
      setAssignments(nextAssignments)
      await saveGuestRoundRobinGroups({
        competitionId,
        stageId: stage.id,
        groupCount,
        assignments: active.map((entry) => ({
          stageEntryId: entry.id,
          groupKey: nextAssignments[entry.id] ?? "",
        })),
      })
      const result = await generateGuestCompetitionStage({ competitionId, stageId: stage.id })
      setMessage(`${result.matchCount} matches generated in ${groupCount} group(s).`)
    })
  }

  async function generate() {
    await run(async () => {
      if (stage.stageType === "individual_rotation") {
        await saveGuestIndividualRotationSettings({
          competitionId,
          stageId: stage.id,
          courtCount,
          requestedRounds,
        })
      }
      const result = await generateGuestCompetitionStage({ competitionId, stageId: stage.id })
      setMessage(`${result.matchCount} matches generated in ${result.roundCount} round(s).`)
    })
  }

  if (stage.stageType === "individual_rotation") {
    const usableCourts = Math.min(
      5,
      courtCount,
      Math.floor(active.length / 4),
    )

    const recommendedRounds = Math.max(
      1,
      Math.min(
        20,
        Math.floor(availableTime / matchDuration),
      ),
    )

    const selectedMatches =
      requestedRounds * usableCourts

    async function generateIR() {
      let generated = false

      await run(async () => {
        await saveGuestIndividualRotationSettings({
          competitionId,
          stageId: stage.id,
          courtCount,
          requestedRounds,
          availableTimeMinutes: availableTime,
          matchDurationMinutes: matchDuration,
        })

        await generateGuestCompetitionStage({
          competitionId,
          stageId: stage.id,
        })

        generated = true
      })

      if (generated) {
        onOpenMatches?.()
      }
    }

    const generationConfirmModal = pendingGeneration === "ir" ? (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="guest-ir-confirm-title" className="w-full max-w-sm rounded-[18px] border border-neutral-200 bg-white p-5 shadow-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Confirm generation</p>
          <h2 id="guest-ir-confirm-title" className="mt-1 text-xl font-black text-neutral-950">Generate matches?</h2>
          <p className="mt-3 text-sm leading-5 text-slate-600">
            Generate matches for <strong className="text-neutral-950">{stage.name}</strong>? Players and setup will be locked.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" disabled={working} onClick={() => setPendingGeneration(null)} className="min-h-11 rounded-[9px] border border-neutral-300 bg-white px-4 text-sm font-bold text-neutral-950">Cancel</button>
            <button type="button" disabled={working} onClick={() => { setPendingGeneration(null); void generateIR() }} className="min-h-11 rounded-[9px] bg-[var(--arena-yellow)] px-4 text-sm font-black text-[var(--arena-black)] disabled:opacity-50">Generate</button>
          </div>
        </div>
      </div>
    ) : null

    const stepper = (label: string, value: number, setValue: (value: number) => void, min: number, max: number, step = 1, suffix = "") => (
      <div className="flex min-h-20 items-center justify-between gap-4 border-b border-neutral-200 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-black">{value}{suffix ? <span className="ml-1 text-sm font-medium text-slate-500">{suffix}</span> : null}</p>
        </div>
        <div className="flex gap-3">
          <button type="button" disabled={working || locked || value <= min} onClick={() => setValue(Math.max(min, value - step))} className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-950 bg-white text-xl font-black disabled:opacity-40">−</button>
          <button type="button" disabled={working || locked || value >= max} onClick={() => setValue(Math.min(max, value + step))} className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-950 bg-white text-xl font-black disabled:opacity-40">+</button>
        </div>
      </div>
    )

    return (
      <>
      <section className="bg-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Individual Rotation</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">Stage Setup</h1>
        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
        <div className="mt-6 max-w-2xl">
          <div className="flex min-h-20 items-center justify-between gap-4 border-b border-neutral-200 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Players</p>
              <p className="mt-2 text-xl font-black">{active.length} selected</p>
            </div>
            {!locked && onSelectPlayers ? <button type="button" disabled={working} onClick={onSelectPlayers} className="min-h-10 rounded-xl border border-neutral-950 bg-white px-4 text-sm font-bold">Change</button> : null}
          </div>
          {stepper(
            "Courts",
            courtCount,
            setCourtCount,
            1,
            5,
          )}

          {stepper(
            "Available time",
            availableTime,
            setAvailableTime,
            10,
            240,
            10,
            "min",
          )}

          {stepper(
            "Match duration",
            matchDuration,
            setMatchDuration,
            1,
            60,
            1,
            "min",
          )}

          {!locked ? (
            <>
              <div className="mt-4 rounded-2xl border border-neutral-950 bg-yellow-100 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Recommended
                </p>

                <p className="mt-1 text-lg font-black">
                  {recommendedRounds} rounds ·{" "}
                  {recommendedRounds * usableCourts} matches
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Based on the available time and match duration.
                  You may choose fewer or more rounds.
                </p>
              </div>

              <div className="mt-4">
                {stepper(
                  "Rounds to generate",
                  requestedRounds,
                  setRequestedRounds,
                  1,
                  20,
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Matches
                  </p>

                  <p className="mt-1 text-lg font-black text-neutral-950">
                    {selectedMatches}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Courts used
                  </p>

                  <p className="mt-1 text-lg font-black text-neutral-950">
                    {usableCourts}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  working ||
                  active.length < 4 ||
                  active.length > 20 ||
                  usableCourts < 1 ||
                  requestedRounds < 1 ||
                  requestedRounds > 20
                }
                onClick={() =>
                  setPendingGeneration("ir")
                }
                className="mt-5 min-h-12 w-full bg-[var(--arena-yellow)] px-5 text-sm font-black text-neutral-950 disabled:opacity-50 lg:max-w-sm"
              >
                {working
                  ? "Working..."
                  : "Generate Matches"}
              </button>
            </>
          ) : (
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                {matchCount} generated matches. Stage setup is locked.
              </div>

              {matchCount > 0 &&
              onOpenMatches ? (
                <button
                  type="button"
                  onClick={onOpenMatches}
                  className="min-h-12 w-full bg-neutral-950 px-5 text-sm font-black text-white lg:max-w-sm"
                >
                  Go to Matches
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>
      {generationBusyOverlay}
      {generationConfirmModal}
      </>
    )
  }

  if (!supported) {
    return (
      <section className="border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="font-bold text-neutral-950">Generate phase</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Guest generation for {stage.stageType} will be enabled in R2B.4C.
        </p>
      </section>
    )
  }

  return (
    <>
    <section className="border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">Generation</p>
      <h2 className="mt-1 text-lg font-bold text-neutral-950">{stage.name}</h2>
      <p className="mt-1 text-sm text-neutral-600">
        {locked
          ? `${matchCount} generated match(es). Roster and structure are locked.`
          : "Review the phase setup, then generate the matches using the same STM engine used by Cloud tournaments."}
      </p>

      {error ? <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="mt-4 border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">{message}</div> : null}

      {stage.stageType === "elimination" && !locked ? (
        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Format</p>
            <div className="grid grid-cols-2 rounded-[14px] bg-neutral-100 p-1">
              {(["singles", "doubles"] as const).map((mode) => {
                const selected =
                  (stage.settings?.playMode === "doubles" ? "doubles" : "singles") === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={working}
                    onClick={() => void changeEliminationPlayMode(mode)}
                    className={[
                      "grid min-h-10 place-items-center rounded-[10px] px-3 text-xs font-black transition",
                      selected
                        ? "bg-white text-neutral-950 shadow-sm ring-1 ring-neutral-200"
                        : "text-neutral-500",
                    ].join(" ")}
                  >
                    {mode === "singles" ? "Singles" : "Doubles"}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onSelectPlayers}
            className="flex min-h-12 w-full items-center justify-between rounded-[12px] border border-neutral-200 bg-white px-4 text-left"
          >
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                {stage.settings?.playMode === "doubles" ? "Teams" : "Players"}
              </span>
              <span className="mt-0.5 block text-sm font-semibold text-neutral-800">
                {active.length} selected
              </span>
            </span>
            <span className="text-xs font-black text-neutral-950">Select & seed →</span>
          </button>

          <div className="rounded-[14px] border border-sky-200 bg-sky-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">Seeds</p>
            <p className="mt-1 text-sm font-semibold text-sky-950">Number the protected entries: 1, 2, 3…</p>
            <p className="mt-1 text-xs leading-5 text-sky-800">
              The elimination engine uses numbered seeds when positioning entries in the bracket. BYEs are generated automatically when required.
            </p>
          </div>
        </div>
      ) : null}

      {stage.stageType === "round_robin" && !locked ? (
        <div className="mt-5">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Format</p>
            <div className="grid grid-cols-2 rounded-[14px] bg-neutral-100 p-1">
              {(["singles", "doubles"] as const).map((mode) => {
                const selected =
                  (stage.settings?.playMode === "doubles" ? "doubles" : "singles") === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={working}
                    onClick={() => void changeRoundRobinPlayMode(mode)}
                    className={[
                      "grid min-h-10 place-items-center rounded-[10px] px-3 text-xs font-black transition",
                      selected
                        ? "bg-white text-neutral-950 shadow-sm ring-1 ring-neutral-200"
                        : "text-neutral-500",
                    ].join(" ")}
                  >
                    {mode === "singles" ? "Singles" : "Doubles"}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 rounded-[16px] border border-neutral-200 bg-white">
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-semibold text-neutral-950">Number of Groups</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Set this before choosing protected seeds.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={working || groupCount <= 1}
                  onClick={() => void changeRoundRobinGroupCount(Math.max(1, groupCount - 1))}
                  className="grid h-9 w-9 place-items-center rounded-full border border-neutral-300 text-lg font-bold disabled:opacity-30"
                >
                  −
                </button>
                <span className="min-w-6 text-center text-xl font-black">{groupCount}</span>
                <button
                  type="button"
                  disabled={working || groupCount >= 4}
                  onClick={() => void changeRoundRobinGroupCount(Math.min(4, groupCount + 1))}
                  className="grid h-9 w-9 place-items-center rounded-full border border-neutral-300 text-lg font-bold disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
              {stage.settings?.playMode === "doubles" ? "Teams" : "Players"}
            </p>
            <button
              type="button"
              onClick={onSelectPlayers}
              className="flex min-h-12 w-full items-center justify-between rounded-[12px] border border-neutral-200 bg-white px-4 text-left"
            >
              <span className="text-sm font-semibold text-neutral-700">{active.length} selected</span>
              <span className="text-xs font-black text-neutral-950">Change →</span>
            </button>
          </div>

          <div className="mt-4 rounded-[16px] border border-neutral-200 bg-white">
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-semibold text-neutral-950">Protected seeds</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  One protected {stage.settings?.playMode === "doubles" ? "team" : "player"} can be assigned to each group.
                </p>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-black text-neutral-700">
                {active.filter((entry) => entry.seed !== null).length} / {groupCount}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-[14px] border border-sky-200 bg-sky-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">Recommended</p>
            <p className="mt-1 text-sm font-semibold text-sky-950">
              {active.length} {stage.settings?.playMode === "doubles" ? "teams" : "players"} · {groupCount} group{groupCount === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-xs leading-5 text-sky-800">
              Protected seeds are placed first, one per group. Remaining entries are then distributed as evenly as possible.
            </p>
          </div>

          <button
            type="button"
            disabled={working || active.length < groupCount * 2}
            onClick={() => setPendingGeneration("generic")}
            className="mt-5 min-h-12 w-full rounded-[10px] bg-[var(--arena-yellow)] px-5 text-sm font-black text-[var(--arena-black)] disabled:opacity-40"
          >
            {working ? "Working..." : "Generate Groups & Matches"}
          </button>
        </div>
      ) : null}

      {!locked && stage.stageType !== "round_robin" ? (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={working || active.length < 2}
            onClick={() => setPendingGeneration("generic")}
            className="min-h-11 bg-[var(--arena-yellow)] px-5 text-sm font-bold text-[var(--arena-black)] disabled:opacity-50"
          >
            {working ? "Working..." : "Generate phase"}
          </button>
          <span className="inline-flex min-h-11 items-center px-1 text-xs text-neutral-500">
            {active.length} active participant(s)
          </span>
        </div>
      ) : null}
    
      {pendingGeneration === "generic" ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="guest-phase-confirm-title" className="w-full max-w-sm rounded-[18px] border border-neutral-200 bg-white p-5 shadow-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Confirm generation</p>
            <h2 id="guest-phase-confirm-title" className="mt-1 text-xl font-black text-neutral-950">Generate phase?</h2>
            <p className="mt-3 text-sm leading-5 text-slate-600">
              Generate <strong className="text-neutral-950">{stage.name}</strong>? Roster, seeds and structure will be locked.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" disabled={working} onClick={() => setPendingGeneration(null)} className="min-h-11 rounded-[9px] border border-neutral-300 bg-white px-4 text-sm font-bold text-neutral-950">Cancel</button>
              <button type="button" disabled={working} onClick={() => {
                setPendingGeneration(null)
                if (stage.stageType === "round_robin") void generateRoundRobin()
                else void generate()
              }} className="min-h-11 rounded-[9px] bg-[var(--arena-yellow)] px-4 text-sm font-black text-[var(--arena-black)] disabled:opacity-50">Generate</button>
            </div>
          </div>
        </div>
      ) : null}
</section>
    {generationBusyOverlay}
    </>
  )
}
