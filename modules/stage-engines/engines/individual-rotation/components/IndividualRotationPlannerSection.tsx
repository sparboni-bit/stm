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

  useEffect(() => {
    let cancelled = false

    setLoadingSummary(true)

    getIndividualRotationPlannerSummaryAction(
      stage.id,
    )
      .then((result) => {
        if (!cancelled) {
          setSummary(result)
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load Individual Rotation information.",
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSummary(false)
        }
      })

    return () => {
      cancelled = true
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

  const editable =
    stage.status === "draft" ||
    stage.status === "configured"

  const supportedPlayerCount =
    summary.playerCount >= 4 &&
    summary.playerCount <=
      TEMPLATE_MAX_PLAYERS

  const supportedSeedCount =
    summary.seedCount === 0 ||
    summary.seedCount === 2 ||
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
        await configureStage()
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
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Individual Rotation
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Stage Setup
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Individual Rotation supports 4 to 20
          players. Matches are selected from a
          precomputed rotation library according
          to the number of players, usable courts,
          seeded players and rounds. The rotation
          balances playing time and sit-outs while
          varying partners and opponents as much
          as possible. Seeds can be set to 0, 2 or
          4 and are kept apart where possible.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Players
          </p>

          <p className="mt-2 text-xl font-semibold text-slate-950">
            {loadingSummary
              ? "—"
              : summary.playerCount}
          </p>
        </div>

        <div className="border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Seeds
          </p>

          <p className="mt-2 text-xl font-semibold text-slate-950">
            {loadingSummary
              ? "—"
              : summary.seedCount}
          </p>
        </div>

        <div className="border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Courts used
          </p>

          <p className="mt-2 text-xl font-semibold text-slate-950">
            {supportedPlayerCount &&
            parsed.courtsUsed >= 1
              ? parsed.courtsUsed
              : "—"}
          </p>
        </div>

        <div className="border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Rest / round
          </p>

          <p className="mt-2 text-xl font-semibold text-slate-950">
            {supportedPlayerCount &&
            parsed.courtsUsed >= 1
              ? parsed.restingPlayersPerRound
              : "—"}
          </p>
        </div>
      </div>

      {!loadingSummary &&
      !supportedPlayerCount ? (
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Individual Rotation requires between
          4 and 20 players.
        </div>
      ) : null}

      {!loadingSummary &&
      !supportedSeedCount ? (
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Individual Rotation supports 0, 2 or
          4 seeded players.
        </div>
      ) : null}

      <div className="border border-slate-200 bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
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
              className="mt-1 h-11 w-full border border-slate-300 px-3 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
            />

            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Up to{" "}
              {Math.max(
                1,
                parsed.maxUsableCourts,
              )}{" "}
              usable with the selected players.
            </span>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
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
                className="h-11 w-full border border-slate-300 px-3 pr-12 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
              />

              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
                min
              </span>
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
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
                className="h-11 w-full border border-slate-300 px-3 pr-12 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
              />

              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
                min
              </span>
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
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
                className="h-11 w-full border border-slate-300 px-3 pr-12 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
              />

              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
                min
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Recommended
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-950">
              {validTime
                ? `${parsed.recommendedRounds} round${
                    parsed.recommendedRounds ===
                    1
                      ? ""
                      : "s"
                  }`
                : "—"}
            </p>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Based on{" "}
              {parsed.roundDurationMinutes >
              0
                ? `${parsed.roundDurationMinutes} minutes per round`
                : "the current timing"}
              . You may choose fewer or more
              rounds.
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
            className="h-10 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Use recommended
          </button>
        </div>
      </div>

      <div className="border border-slate-300 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Rounds to generate
            </p>

            <p className="mt-1 text-sm text-slate-500">
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
              className="flex h-11 w-11 items-center justify-center border border-slate-300 bg-white text-xl font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="h-11 w-16 border-y border-slate-300 text-center text-lg font-bold text-slate-950 disabled:bg-slate-50"
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
              className="flex h-11 w-11 items-center justify-center border border-slate-300 bg-white text-xl font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {validRequestedRounds &&
        parsed.courtsUsed >= 1 ? (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Matches
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {parsed.matchCount}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Courts
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {parsed.courtsUsed}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estimated time
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {parsed.requested! *
                    parsed.roundDurationMinutes}{" "}
                  min
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {parsed.courts >
      TEMPLATE_MAX_COURTS ? (
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Individual Rotation supports up to
          5 courts.
        </div>
      ) : null}

      {parsed.courts >= 1 &&
      parsed.maxUsableCourts >= 1 &&
      parsed.courts >
        parsed.maxUsableCourts ? (
        <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
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
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Choose between 1 and 20 rounds.
        </div>
      ) : null}

      {error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="h-11 w-full bg-slate-950 px-5 text-sm font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        >
          {pending
            ? "Generating..."
            : "Generate Matches"}
        </button>
      </div>

      {!editable ? (
        <p className="text-sm text-slate-500">
          Stage Setup is locked after match
          generation.
        </p>
      ) : null}
    </section>
  )
}