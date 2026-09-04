"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import {
  useStage,
  useStageActions,
} from "../../../../competition-stages/hooks"

import {
  getIndividualRotationPlannerSummaryAction,
  saveIndividualRotationPlannerSettingsAction,
  type IndividualRotationPlannerSummary,
} from "../actions/plannerActions"

const TEMPLATE_MAX_PLAYERS = 20
const TEMPLATE_MAX_COURTS = 5
const TEMPLATE_MAX_ROUNDS = 20

function readNumber(
  settings: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = settings[key]

  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : fallback
}

function readNullableNumber(
  settings: Record<string, unknown>,
  key: string,
): number | null {
  const value = settings[key]

  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : null
}

function parseInteger(
  value: string,
): number | null {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)

  return Number.isInteger(parsed)
    ? parsed
    : null
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    max,
    Math.max(min, value),
  )
}

export function IndividualRotationPlannerSection() {
  const stage = useStage()
  const router = useRouter()

  const {
    configureStage,
    generateStage,
    getSectionHref,
  } = useStageActions()

  const [courtCount, setCourtCount] =
    useState(
      String(
        readNumber(
          stage.settings,
          "courtCount",
          2,
        ),
      ),
    )

  const [
    availableMinutes,
    setAvailableMinutes,
  ] = useState(
    String(
      readNumber(
        stage.settings,
        "availableMinutes",
        90,
      ),
    ),
  )

  const [
    matchDurationMinutes,
    setMatchDurationMinutes,
  ] = useState(
    String(
      readNumber(
        stage.settings,
        "matchDurationMinutes",
        12,
      ),
    ),
  )

  const [
    rotationMinutes,
    setRotationMinutes,
  ] = useState(
    String(
      readNumber(
        stage.settings,
        "rotationMinutes",
        3,
      ),
    ),
  )

  const initialRequestedRounds =
    readNullableNumber(
      stage.settings,
      "requestedRounds",
    )

  const [
    requestedRounds,
    setRequestedRounds,
  ] = useState(
    initialRequestedRounds === null
      ? ""
      : String(initialRequestedRounds),
  )

  const [summary, setSummary] =
    useState<IndividualRotationPlannerSummary>({
      playerCount: 0,
      seedCount: 0,
    })

  const [
    loadingSummary,
    setLoadingSummary,
  ] = useState(true)

  const [pending, setPending] =
    useState(false)

  const [error, setError] =
    useState("")

  const [hydrated, setHydrated] =
    useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSummary() {
      setLoadingSummary(true)

      try {
        const result =
          await getIndividualRotationPlannerSummaryAction(
            stage.id,
          )

        if (!cancelled) {
          setSummary(result)
          setError("")
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load Individual Rotation information.",
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingSummary(false)
        }
      }
    }

    void loadSummary()

    function handleStageEntriesChanged() {
      void loadSummary()
    }

    window.addEventListener(
      "stage-entries-changed",
      handleStageEntriesChanged,
    )

    return () => {
      cancelled = true
      window.removeEventListener(
        "stage-entries-changed",
        handleStageEntriesChanged,
      )
    }
  }, [stage.id])

  const parsed = useMemo(() => {
    const courts =
      parseInteger(courtCount) ?? 0

    const available =
      parseInteger(
        availableMinutes,
      ) ?? 0

    const matchDuration =
      parseInteger(
        matchDurationMinutes,
      ) ?? 0

    const rotation =
      parseInteger(
        rotationMinutes,
      ) ?? 0

    const requested =
      parseInteger(
        requestedRounds,
      )

    const maxUsableCourts =
      Math.min(
        TEMPLATE_MAX_COURTS,
        Math.floor(
          summary.playerCount / 4,
        ),
      )

    const courtsUsed =
      Math.min(
        courts,
        maxUsableCourts,
      )

    const activePlayersPerRound =
      courtsUsed * 4

    const restingPlayersPerRound =
      Math.max(
        0,
        summary.playerCount -
          activePlayersPerRound,
      )

    const roundDurationMinutes =
      matchDuration + rotation

    const roundsByTime =
      roundDurationMinutes > 0 &&
      available > 0
        ? Math.floor(
            available /
              roundDurationMinutes,
          )
        : 0

    const recommendedRounds =
      clamp(
        roundsByTime,
        1,
        TEMPLATE_MAX_ROUNDS,
      )

    const matchCount =
      requested !== null &&
      requested >= 1
        ? requested * courtsUsed
        : 0

    return {
      courts,
      available,
      matchDuration,
      rotation,
      requested,
      maxUsableCourts,
      courtsUsed,
      activePlayersPerRound,
      restingPlayersPerRound,
      roundDurationMinutes,
      roundsByTime,
      recommendedRounds,
      matchCount,
    }
  }, [
    availableMinutes,
    courtCount,
    matchDurationMinutes,
    requestedRounds,
    rotationMinutes,
    summary.playerCount,
  ])

  /*
   * When no explicit number of rounds has
   * previously been saved, use the time-based
   * recommendation as the initial selection.
   *
   * We only do this after the Stage summary
   * has been loaded.
   */
  useEffect(() => {
    if (loadingSummary) {
      return
    }

    if (
      initialRequestedRounds === null &&
      requestedRounds === ""
    ) {
      setRequestedRounds(
        String(parsed.recommendedRounds),
      )
    }
  }, [
    initialRequestedRounds,
    loadingSummary,
    parsed.recommendedRounds,
    requestedRounds,
  ])

  const stageEditable =
    stage.status === "draft" ||
    stage.status === "configured"

  /*
   * Keep the SSR output and the first client render identical.
   * The real Stage lock is applied immediately after hydration.
   */
  const editable =
    hydrated ? stageEditable : true

  const supportedPlayerCount =
    summary.playerCount >= 4 &&
    summary.playerCount <=
      TEMPLATE_MAX_PLAYERS

  const supportedSeedCount =
    summary.seedCount === 0 ||
    summary.seedCount === 2 ||
    summary.seedCount === 3 ||
    summary.seedCount === 4

  const validCourtCount =
    parsed.courts >= 1 &&
    parsed.courts <= TEMPLATE_MAX_COURTS

  const validTime =
    parsed.available >= 1 &&
    parsed.matchDuration >= 1 &&
    parsed.rotation >= 0

  const validRequestedRounds =
    parsed.requested !== null &&
    parsed.requested >= 1 &&
    parsed.requested <=
      TEMPLATE_MAX_ROUNDS

  const canGenerate =
    editable &&
    !pending &&
    !loadingSummary &&
    supportedPlayerCount &&
    supportedSeedCount &&
    validCourtCount &&
    validTime &&
    parsed.courtsUsed >= 1 &&
    validRequestedRounds

  function decreaseRounds() {
    const current =
      parsed.requested ??
      parsed.recommendedRounds

    setRequestedRounds(
      String(
        clamp(
          current - 1,
          1,
          TEMPLATE_MAX_ROUNDS,
        ),
      ),
    )
  }

  function increaseRounds() {
    const current =
      parsed.requested ??
      parsed.recommendedRounds

    setRequestedRounds(
      String(
        clamp(
          current + 1,
          1,
          TEMPLATE_MAX_ROUNDS,
        ),
      ),
    )
  }

  function useRecommendedRounds() {
    setRequestedRounds(
      String(
        parsed.recommendedRounds,
      ),
    )
  }

  async function handleGenerate() {
    if (!canGenerate) {
      return
    }

    setPending(true)
    setError("")

    try {
      await saveIndividualRotationPlannerSettingsAction(
        stage.id,
        {
          courtCount:
            parsed.courts,
          availableMinutes:
            parsed.available,
          matchDurationMinutes:
            parsed.matchDuration,
          rotationMinutes:
            parsed.rotation,
          requestedRounds:
            parsed.requested!,
        },
      )

      /*
       * A draft Stage must first enter the
       * configured state. generateStage()
       * remains the single generation entry
       * point provided by StageProvider.
       */
      if (stage.status === "draft") {
        await configureStage({ refresh: false })
      }

      await generateStage()

      router.push(
        getSectionHref("play"),
      )
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to generate Individual Rotation matches.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Individual Rotation
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Stage Setup
          </h2>

          {!editable ? (
            <span className="inline-flex min-h-6 items-center bg-slate-100 px-2 text-[10px] font-black uppercase tracking-wide text-slate-600">
              Locked
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
          Players
        </span>
        <span className="text-sm font-black text-neutral-950">
          {loadingSummary ? "—" : `${summary.playerCount} selected`}
        </span>
      </div>

      {!loadingSummary &&
      !supportedPlayerCount ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Individual Rotation requires between
          4 and 20 players.
        </div>
      ) : null}

      {!loadingSummary &&
      !supportedSeedCount ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Individual Rotation supports 0, 2, 3 or
          4 Keep Apart players.
        </div>
      ) : null}

      {!editable ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div>
            <p className="text-sm font-black text-slate-950">
              Stage generated
            </p>
            <p className="text-xs text-slate-500">
              Setup and players are locked. Continue from Matches.
            </p>

            <p className="mt-1.5 text-xs font-semibold text-slate-700">
              {parsed.courtsUsed} court{parsed.courtsUsed === 1 ? "" : "s"}
              {" · "}
              {parsed.available} min available
              {" · "}
              {parsed.matchDuration} min matches
              {" · "}
              {parsed.rotation} min rotation
              {" · "}
              {parsed.requested ?? "—"} rounds
              {" · "}
              {parsed.matchCount} matches
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                getSectionHref("play"),
              )
            }
            className="min-h-9 rounded-xl bg-slate-950 px-3 text-xs font-black uppercase tracking-wide text-white"
          >
            Open Matches
          </button>
        </div>
      ) : null}

      {editable ? (
        <>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Courts
              </span>
  
              <input
                type="text"
                inputMode="numeric"
                value={courtCount}
                onChange={(event) =>
                  setCourtCount(
                    event.target.value,
                  )
                }
                disabled={
                  !editable || pending
                }
                className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
              />
            </label>
  
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Available time
              </span>
  
              <div className="relative mt-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={availableMinutes}
                  onChange={(event) =>
                    setAvailableMinutes(
                      event.target.value,
                    )
                  }
                  disabled={
                    !editable || pending
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 pr-12 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
                />
  
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
                  min
                </span>
              </div>
            </label>
  
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Match duration
              </span>
  
              <div className="relative mt-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    matchDurationMinutes
                  }
                  onChange={(event) =>
                    setMatchDurationMinutes(
                      event.target.value,
                    )
                  }
                  disabled={
                    !editable || pending
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 pr-12 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
                />
  
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
                  min
                </span>
              </div>
            </label>
  
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Rotation
              </span>
  
              <div className="relative mt-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={rotationMinutes}
                  onChange={(event) =>
                    setRotationMinutes(
                      event.target.value,
                    )
                  }
                  disabled={
                    !editable || pending
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 pr-12 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
                />
  
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
                  min
                </span>
              </div>
            </label>
          </div>
        </div>
  
        <div className="rounded-2xl border border-neutral-950 bg-yellow-100 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Recommended
              </p>
  
              <p className="mt-1 text-base font-black text-slate-950">
                {validTime
                  ? `${parsed.recommendedRounds} round${
                      parsed.recommendedRounds ===
                      1
                        ? ""
                        : "s"
                    }`
                  : "—"}
  
                {parsed.roundDurationMinutes > 0 ? (
                  <span className="font-medium text-slate-500">
                    {" "}· {parsed.roundDurationMinutes} min / round
                  </span>
                ) : null}
              </p>
            </div>
  
            <button
              type="button"
              onClick={
                useRecommendedRounds
              }
              disabled={
                !editable ||
                pending ||
                !validTime
              }
              className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use recommended
            </button>
          </div>
  
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Rounds to generate
              </p>
  
              <p className="mt-1 text-xs text-slate-500">
                Choose from 1 to 20 rounds.
              </p>
            </div>
  
            <div className="flex items-center">
              <button
                type="button"
                onClick={decreaseRounds}
                disabled={
                  !editable ||
                  pending ||
                  parsed.requested === 1
                }
                aria-label="Decrease rounds"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>
  
              <input
                type="text"
                inputMode="numeric"
                value={requestedRounds}
                onChange={(event) =>
                  setRequestedRounds(
                    event.target.value,
                  )
                }
                disabled={
                  !editable || pending
                }
                aria-label="Rounds to generate"
                className="mx-2 h-10 w-14 rounded-xl border border-slate-300 text-center text-lg font-bold text-slate-950 disabled:bg-slate-50"
              />
  
              <button
                type="button"
                onClick={increaseRounds}
                disabled={
                  !editable ||
                  pending ||
                  parsed.requested ===
                    TEMPLATE_MAX_ROUNDS
                }
                aria-label="Increase rounds"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
  
          {validRequestedRounds &&
          parsed.courtsUsed >= 1 ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 pt-3 text-xs">
              <span className="font-black text-slate-950">
                {parsed.matchCount} matches
              </span>
  
              <span className="text-slate-500">
                {parsed.courtsUsed} court
                {parsed.courtsUsed === 1 ? "" : "s"}
              </span>
  
              <span className="text-slate-500">
                {parsed.requested! *
                  parsed.roundDurationMinutes}{" "}
                min estimated
              </span>
            </div>
          ) : null}
        </div>
        </>
      ) : null}

      {editable ? (
        <>
        {parsed.courts >
        TEMPLATE_MAX_COURTS ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Individual Rotation supports up to
            5 courts.
          </div>
        ) : null}
  
        {parsed.courts >= 1 &&
        parsed.maxUsableCourts >= 1 &&
        parsed.courts >
          parsed.maxUsableCourts ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            With {summary.playerCount} players,{" "}
            {parsed.maxUsableCourts} court
            {parsed.maxUsableCourts === 1
              ? ""
              : "s"}{" "}
            can be used simultaneously. Extra
            courts will remain unused.
          </div>
        ) : null}
  
        {parsed.requested !== null &&
        !validRequestedRounds ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Choose between 1 and 20 rounds.
          </div>
        ) : null}

        {validRequestedRounds &&
        parsed.requested !== null &&
        parsed.requested > parsed.recommendedRounds ? (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            {parsed.requested} rounds exceed the current recommendation of {parsed.recommendedRounds}. You can generate them anyway.
          </div>
        ) : null}
        </>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {editable ? (
        <div className="sticky bottom-0 z-20 -mx-4 flex justify-end border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pt-0 sm:backdrop-blur-none">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="min-h-12 w-full rounded-xl bg-[var(--arena-yellow)] px-5 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            {pending
              ? "Generating..."
              : "Generate Matches"}
          </button>
        </div>
      ) : null}
    </section>
  )
}
