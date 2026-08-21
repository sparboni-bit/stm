"use client"

import { useRouter } from "next/navigation"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useStage,
  useStageActions,
} from "../../../../competition-stages/hooks"

import {
  calculateIndividualRotationPlannerProposalsAction,
  getIndividualRotationPlannerSummaryAction,
  saveIndividualRotationPlannerSettingsAction,
  type IndividualRotationProposal,
  type IndividualRotationPlannerProposals,
  type IndividualRotationPlannerSummary,
} from "../actions/plannerActions"

const TEMPLATE_MAX_PLAYERS = 16
const TEMPLATE_MAX_COURTS = 4
const TEMPLATE_MAX_ROUNDS = 12

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

function buildStageDistribution(
  playerCount: number,
): number[] {
  if (playerCount <= TEMPLATE_MAX_PLAYERS) {
    return [playerCount]
  }

  const stageCount = Math.ceil(
    playerCount / TEMPLATE_MAX_PLAYERS,
  )

  const base = Math.floor(
    playerCount / stageCount,
  )

  const remainder =
    playerCount % stageCount

  return Array.from(
    { length: stageCount },
    (_, index) =>
      base + (index < remainder ? 1 : 0),
  )
}

function FairnessCurveChart({
  rows,
  recommendedRounds,
  selectedRounds,
  onSelectRounds,
}: {
  rows: IndividualRotationProposal[]
  recommendedRounds: number | undefined
  selectedRounds: number | null
  onSelectRounds: (rounds: number) => void
}) {
  if (rows.length === 0) {
    return null
  }

  const width = 760
  const height = 285

  /*
   * Extra top space is intentional:
   * score labels for 100-point schedules
   * must not overlap the Fairness heading.
   */
  const left = 52
  const right = 24
  const top = 42
  const bottom = 54

  const plotWidth =
    width - left - right

  const plotHeight =
    height - top - bottom

  const minRound = Math.min(
    ...rows.map((row) => row.rounds),
  )

  const maxRound = Math.max(
    ...rows.map((row) => row.rounds),
  )

  const roundSpan = Math.max(
    1,
    maxRound - minRound,
  )

  const xFor = (rounds: number) =>
    left +
    ((rounds - minRound) / roundSpan) *
      plotWidth

  const yFor = (score: number) =>
    top +
    ((100 -
      Math.max(
        0,
        Math.min(100, score),
      )) /
      100) *
      plotHeight

  const points = rows
    .map(
      (row) =>
        `${xFor(row.rounds)},${yFor(
          row.normalizedScore,
        )}`,
    )
    .join(" ")

  const yTicks = [100, 75, 50, 25, 0]

  return (
    <div className="border-b border-slate-200 bg-white px-3 py-4 sm:px-4">
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Fairness score by number of rounds"
          className="h-auto w-full"
        >
          {yTicks.map((tick) => {
            const y = yFor(tick)

            return (
              <g key={tick}>
                <line
                  x1={left}
                  y1={y}
                  x2={width - right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.12"
                  strokeWidth="1"
                />

                <text
                  x={left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[11px]"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {recommendedRounds !== undefined ? (
            <line
              x1={xFor(recommendedRounds)}
              y1={top}
              x2={xFor(recommendedRounds)}
              y2={height - bottom}
              stroke="currentColor"
              strokeOpacity="0.22"
              strokeWidth="1"
              strokeDasharray="5 5"
            />
          ) : null}

          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="text-slate-800"
          />

          {rows.map((row) => {
            const recommended =
              row.rounds ===
              recommendedRounds

            const selected =
              row.rounds === selectedRounds

            const pointY = yFor(
              row.normalizedScore,
            )

            /*
             * Scores near the top edge get
             * their value below the point.
             */
            const labelBelow =
              pointY - top < 18

            const labelY =
              labelBelow
                ? pointY + 22
                : pointY - 13

            return (
              <g
                key={row.rounds}
                role="button"
                tabIndex={0}
                aria-label={`Select ${row.rounds} rounds with fairness ${row.normalizedScore}`}
                onClick={() => onSelectRounds(row.rounds)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onSelectRounds(row.rounds)
                  }
                }}
                className="cursor-pointer outline-none"
              >
                <circle
                  cx={xFor(row.rounds)}
                  cy={pointY}
                  r="14"
                  fill="transparent"
                  stroke="transparent"
                />

                <circle
                  cx={xFor(row.rounds)}
                  cy={pointY}
                  r={
                    selected
                      ? 8
                      : recommended
                        ? 7
                        : 5
                  }
                  fill="white"
                  stroke="currentColor"
                  strokeWidth={
                    selected ||
                    recommended
                      ? 4
                      : 3
                  }
                  className={
                    selected
                      ? "text-slate-950"
                      : recommended
                        ? "text-slate-900"
                        : "text-slate-700"
                  }
                />

                <text
                  x={xFor(row.rounds)}
                  y={labelY}
                  textAnchor="middle"
                  className="fill-slate-700 text-[11px] font-semibold"
                >
                  {row.normalizedScore}
                </text>

                <text
                  x={xFor(row.rounds)}
                  y={height - bottom + 22}
                  textAnchor="middle"
                  className="fill-slate-600 text-[11px]"
                >
                  {row.rounds}
                </text>

                {recommended ? (
                  <text
                    x={xFor(row.rounds)}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-slate-900 text-[10px] font-bold"
                  >
                    Recommended
                  </text>
                ) : null}
              </g>
            )
          })}

          <text
            x={left}
            y={15}
            className="fill-slate-500 text-[10px] font-bold uppercase"
          >
            Fairness
          </text>

          <text
            x={width - right}
            y={height - 10}
            textAnchor="end"
            className="fill-slate-500 text-[10px] font-bold uppercase"
          >
            Rounds
          </text>
        </svg>
      </div>
    </div>
  )
}

export function IndividualRotationPlannerSection() {
  const stage = useStage()
  const router = useRouter()

  const {
    configureStage,
    refresh,
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

  const [savedRequestedRounds, setSavedRequestedRounds] =
    useState<number | null>(initialRequestedRounds)

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

  const [
    calculating,
    setCalculating,
  ] = useState(false)

  const [
    proposalResult,
    setProposalResult,
  ] =
    useState<IndividualRotationPlannerProposals | null>(
      null,
    )

  const [message, setMessage] =
    useState("")

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
              : "Unable to load Planner information.",
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
      requestedRounds.trim()
        ? parseInteger(
            requestedRounds,
          )
        : null

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

    const maxRoundsByTime =
      roundDurationMinutes > 0
        ? Math.floor(
            available /
              roundDurationMinutes,
          )
        : 0

    const maxAvailableRounds =
      Math.min(
        maxRoundsByTime,
        TEMPLATE_MAX_ROUNDS,
      )

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
      maxRoundsByTime,
      maxAvailableRounds,
    }
  }, [
    availableMinutes,
    courtCount,
    matchDurationMinutes,
    requestedRounds,
    rotationMinutes,
    summary.playerCount,
  ])

  const editable =
    stage.status === "draft" ||
    stage.status === "configured"

  const supportedPlayerCount =
    summary.playerCount >= 4 &&
    summary.playerCount <=
      TEMPLATE_MAX_PLAYERS

  const canSave =
    editable &&
    !pending &&
    parsed.courts >= 1 &&
    parsed.available >= 1 &&
    parsed.matchDuration >= 1 &&
    parsed.rotation >= 0 &&
    parsed.roundDurationMinutes >= 1 &&
    parsed.maxAvailableRounds >= 1 &&
    parsed.requested !== null &&
    parsed.requested >= 1 &&
    parsed.requested <=
      parsed.maxAvailableRounds

  const splitDistribution =
    useMemo(
      () =>
        buildStageDistribution(
          summary.playerCount,
        ),
      [summary.playerCount],
    )

  async function handleCalculateProposals() {
    if (
      !supportedPlayerCount ||
      parsed.courts < 1 ||
      parsed.available < 1 ||
      parsed.matchDuration < 1 ||
      parsed.rotation < 0
    ) {
      return
    }

    setCalculating(true)
    setMessage("")
    setError("")

    try {
      const result =
        await calculateIndividualRotationPlannerProposalsAction(
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
              parsed.requested,
          },
        )

      setProposalResult(result)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to calculate Planner proposals.",
      )
    } finally {
      setCalculating(false)
    }
  }

  function proposalTitle(
    kind:
      IndividualRotationProposal["kind"],
  ) {
    if (kind === "minimum_fair") {
      return "Minimum Fair"
    }

    if (kind === "recommended") {
      return "Recommended"
    }

    return "Maximum Play"
  }

  function selectProposal(
    rounds: number,
  ) {
    setRequestedRounds(
      String(rounds),
    )

    setMessage(
      `${rounds} rounds selected. Save Planner Settings to confirm the selection.`,
    )

    setError("")
  }

  async function handleSave() {
    if (!canSave) {
      return
    }

    setPending(true)
    setMessage("")
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
            parsed.requested,
        },
      )

      setSavedRequestedRounds(parsed.requested)

      if (
        stage.status === "draft"
      ) {
        await configureStage()

        setMessage(
          "Planner settings saved. Opening Fairness Preview.",
        )
      } else {
        refresh()

        setMessage(
          "Planner settings saved. Opening Fairness Preview.",
        )
      }

      router.push("?section=fairness")
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save Planner settings.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Individual Rotation Engine
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Planner
        </h2>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Define the available courts and
          time. The Planner uses the
          precomputed Template Library
          together with the Stage Entries
          to determine the playable rounds.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
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
            {summary.playerCount >= 4
              ? parsed.courtsUsed
              : "—"}
          </p>
        </div>

        <div className="border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Available rounds
          </p>

          <p className="mt-2 text-xl font-semibold text-slate-950">
            {parsed.maxAvailableRounds ||
              "—"}
          </p>

          {parsed.maxRoundsByTime >
          TEMPLATE_MAX_ROUNDS ? (
            <p className="mt-1 text-xs text-slate-500">
              Time capacity:{" "}
              {parsed.maxRoundsByTime}
            </p>
          ) : null}
        </div>
      </div>

      {summary.playerCount >
      TEMPLATE_MAX_PLAYERS ? (
        <div className="border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          <p className="font-semibold">
            This group is larger than the
            Individual Rotation template
            limit of 16 players per Stage.
          </p>

          <p className="mt-2 leading-6">
            For {summary.playerCount}{" "}
            players, the suggested setup is{" "}
            {splitDistribution.length}{" "}
            Individual Rotation Stages with
            a balanced distribution of{" "}
            <strong>
              {splitDistribution.join(
                " + ",
              )}
            </strong>{" "}
            players.
          </p>

          <p className="mt-2 text-amber-800">
            Split the participants between
            the Stages before calculating
            fairness proposals.
          </p>
        </div>
      ) : null}

      {summary.playerCount > 0 &&
      summary.playerCount < 4 ? (
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Individual Rotation requires at
          least 4 players.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 border border-slate-200 bg-white p-3 sm:p-4 xl:grid-cols-5">
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

          {parsed.courts >
          TEMPLATE_MAX_COURTS ? (
            <span className="mt-1 block text-xs text-slate-500">
              Template Library uses up to
              4 courts.
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Available minutes
          </span>

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
            className="mt-1 h-11 w-full border border-slate-300 px-3 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Match minutes
          </span>

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
            className="mt-1 h-11 w-full border border-slate-300 px-3 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Rotation minutes
          </span>

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
            className="mt-1 h-11 w-full border border-slate-300 px-3 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
          />
        </label>

        <label className="col-span-2 block xl:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Requested rounds
          </span>

          <input
            type="text"
            inputMode="numeric"
            value={requestedRounds}
            onChange={(event) =>
              setRequestedRounds(
                event.target.value,
              )
            }
            placeholder="Auto"
            disabled={
              !editable || pending
            }
            className="mt-1 h-11 w-full border border-slate-300 px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50"
          />

          <span className="mt-1 block text-xs text-slate-500">
            Maximum{" "}
            {parsed.maxAvailableRounds ||
              TEMPLATE_MAX_ROUNDS}{" "}
            with the current settings.
          </span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <div className="border border-slate-200 bg-white p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Round duration
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-900">
            {parsed.roundDurationMinutes >
            0
              ? `${parsed.roundDurationMinutes} min`
              : "—"}
          </p>
        </div>

        <div className="border border-slate-200 bg-white p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Active / round
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-900">
            {summary.playerCount >= 4
              ? parsed.activePlayersPerRound
              : "—"}
          </p>
        </div>

        <div className="border border-slate-200 bg-white p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Rest / round
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-900">
            {summary.playerCount >= 4
              ? parsed.restingPlayersPerRound
              : "—"}
          </p>
        </div>

        <div className="border border-slate-200 bg-white p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Selected rounds
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-900">
            {parsed.requested ?? "—"}
          </p>

          {parsed.requested !== null ? (
            <p className={`mt-1 text-xs font-semibold ${
              parsed.requested === savedRequestedRounds
                ? "text-emerald-700"
                : "text-amber-700"
            }`}>
              {parsed.requested === savedRequestedRounds
                ? "Saved"
                : "Selected — save Planner settings"}
            </p>
          ) : null}
        </div>
      </div>

      {summary.playerCount >= 4 ? (
        <div className="border border-slate-200 bg-white p-3 sm:p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                Fairness proposals
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Load the precomputed
                schedules from the
                Individual Rotation
                Template Library and
                compare the available
                fairness options.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleCalculateProposals
              }
              disabled={
                calculating ||
                pending ||
                !supportedPlayerCount
              }
              className="inline-flex h-11 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto"
            >
              {calculating
                ? "Loading..."
                : "Load proposals"}
            </button>
          </div>

          {proposalResult ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {proposalResult.proposals.map(
                (proposal) => {
                  const selected =
                    parsed.requested ===
                    proposal.rounds

                  return (
                    <div
                      key={
                        proposal.kind
                      }
                      className={
                        selected
                          ? "border-2 border-slate-950 bg-slate-100 p-4"
                          : proposal.kind ===
                              "recommended"
                            ? "border-2 border-slate-700 bg-slate-50 p-4"
                            : "border border-slate-200 bg-white p-4"
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            {proposalTitle(
                              proposal.kind,
                            )}
                          </p>

                          <p className="mt-1 text-2xl font-semibold text-slate-950">
                            {
                              proposal.rounds
                            }{" "}
                            rounds
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Fairness
                          </p>

                          <p className="mt-1 text-xl font-semibold text-slate-950">
                            {
                              proposal.normalizedScore
                            }
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1 text-sm text-slate-600">
                        <p>
                          Games:{" "}
                          {
                            proposal.minGames
                          }
                          -
                          {
                            proposal.maxGames
                          }
                        </p>

                        <p>
                          Rests:{" "}
                          {
                            proposal.minRests
                          }
                          -
                          {
                            proposal.maxRests
                          }
                        </p>

                        <p>
                          Partner repeats:{" "}
                          {
                            proposal.partnerRepeats
                          }
                        </p>

                        <p>
                          Opponent repeats:{" "}
                          {
                            proposal.opponentRepeats
                          }
                        </p>

                        <p>
                          Seed pairs:{" "}
                          {
                            proposal.seedPairs
                          }
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          selectProposal(
                            proposal.rounds,
                          )
                        }
                        disabled={
                          !editable ||
                          pending
                        }
                        className={
                          selected
                            ? "mt-4 h-10 w-full border border-slate-950 bg-white px-4 text-sm font-semibold text-slate-950"
                            : "mt-4 h-10 w-full bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-300"
                        }
                      >
                        {selected
                          ? `✓ Selected · ${proposal.rounds} rounds`
                          : `Use ${proposal.rounds} rounds`}
                      </button>
                    </div>
                  )
                },
              )}
            </div>
          ) : null}

          {proposalResult ? (
            <div className="mt-5 overflow-x-auto border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  Fairness curve
                </h4>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Precomputed schedules
                  available for the current
                  players, courts and seed
                  configuration.
                </p>
              </div>

              <FairnessCurveChart
                rows={
                  proposalResult.curve
                }
                recommendedRounds={
                  proposalResult.proposals.find(
                    (proposal) =>
                      proposal.kind ===
                      "recommended",
                  )?.rounds
                }
                selectedRounds={
                  parsed.requested
                }
                onSelectRounds={
                  selectProposal
                }
              />

              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">
                      Rounds
                    </th>
                    <th className="px-4 py-3">
                      Score
                    </th>
                    <th className="px-4 py-3">
                      Games
                    </th>
                    <th className="px-4 py-3">
                      Rests
                    </th>
                    <th className="px-4 py-3">
                      Partner rep.
                    </th>
                    <th className="px-4 py-3">
                      Opponent rep.
                    </th>
                    <th className="px-4 py-3">
                      Seed pairs
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {proposalResult.curve.map(
                    (row) => {
                      const recommendedRounds =
                        proposalResult.proposals.find(
                          (proposal) =>
                            proposal.kind ===
                            "recommended",
                        )?.rounds

                      const isRecommended =
                        row.rounds ===
                        recommendedRounds

                      const isSelected =
                        row.rounds ===
                        parsed.requested

                      return (
                        <tr
                          key={
                            row.rounds
                          }
                          tabIndex={0}
                          role="button"
                          aria-label={`Select ${row.rounds} rounds with fairness ${row.normalizedScore}`}
                          onClick={() =>
                            selectProposal(row.rounds)
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" ||
                              event.key === " "
                            ) {
                              event.preventDefault()
                              selectProposal(row.rounds)
                            }
                          }}
                          className={
                            isSelected
                              ? "cursor-pointer border-b border-slate-200 bg-slate-200 font-semibold outline-none ring-inset focus-visible:ring-2 focus-visible:ring-slate-950"
                              : isRecommended
                                ? "cursor-pointer border-b border-slate-200 bg-slate-100 font-semibold outline-none hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-950"
                                : "cursor-pointer border-b border-slate-200 bg-white outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-950"
                          }
                        >
                          <td className="px-4 py-3">
                            {row.rounds}

                            {isSelected ? (
                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                                {row.rounds === savedRequestedRounds
                                  ? "Selected · Saved"
                                  : "Selected"}
                              </span>
                            ) : isRecommended ? (
                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                Recommended
                              </span>
                            ) : null}
                          </td>

                          <td className="px-4 py-3">
                            {
                              row.normalizedScore
                            }
                          </td>

                          <td className="px-4 py-3">
                            {row.minGames}-
                            {row.maxGames}
                          </td>

                          <td className="px-4 py-3">
                            {row.minRests}-
                            {row.maxRests}
                          </td>

                          <td className="px-4 py-3">
                            {
                              row.partnerRepeats
                            }
                          </td>

                          <td className="px-4 py-3">
                            {
                              row.opponentRepeats
                            }
                          </td>

                          <td className="px-4 py-3">
                            {
                              row.seedPairs
                            }
                          </td>
                        </tr>
                      )
                    },
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      {parsed.requested === null ? (
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Select a round proposal from the cards, Fairness curve or table before continuing to Fairness Preview.
        </div>
      ) : null}

      <div className="border border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Save Planner settings
            </h3>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Save the court, time and
              selected round configuration
              for this Individual Rotation
              Stage.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex h-11 w-full items-center justify-center bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            {pending
              ? "Saving..."
              : "Save & Review Fairness"}
          </button>
        </div>

        {message ? (
          <div
            role="status"
            className="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          >
            {message}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        ) : null}
      </div>
    </section>
  )
}