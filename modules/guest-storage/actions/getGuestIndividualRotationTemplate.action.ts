"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
  type IndividualRotationTemplateRecord,
} from "@/modules/stage-engines/engines/individual-rotation/templates/types"

type UnknownRecord = Record<string, unknown>

function projectRefFromUrl() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""

  try {
    return (
      new URL(url).hostname.split(".")[0] ||
      "unknown"
    )
  } catch {
    return "invalid-url"
  }
}

function asRecord(
  value: unknown,
  label: string,
): UnknownRecord {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      `Invalid Individual Rotation template: ${label} must be an object.`,
    )
  }

  return value as UnknownRecord
}

function readPlayerPair(
  match: UnknownRecord,
  camelKey: "teamA" | "teamB",
  snakeKey: "team_a" | "team_b",
  label: string,
): [string, string] {
  const value =
    match[camelKey] ??
    match[snakeKey]

  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    typeof value[0] !== "string" ||
    typeof value[1] !== "string"
  ) {
    throw new Error(
      `Invalid Individual Rotation template: ${label} must contain exactly two player ids.`,
    )
  }

  return [value[0], value[1]]
}

function readRoundNumber(
  round: UnknownRecord,
  fallback: number,
): number {
  const value =
    round.roundNumber ??
    round.round_number ??
    round.round

  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1
    ? value
    : fallback
}

function readRestingPlayerIds(
  round: UnknownRecord,
  label: string,
): string[] {
  const value =
    round.restingPlayerIds ??
    round.resting_player_ids ??
    round.sitouts ??
    []

  if (
    !Array.isArray(value) ||
    value.some(
      (playerId) =>
        typeof playerId !== "string",
    )
  ) {
    throw new Error(
      `Invalid Individual Rotation template: ${label} must be an array of player ids.`,
    )
  }

  return value as string[]
}

/**
 * The Python catalog stored in Supabase uses:
 *   team_a / team_b / sitouts
 *
 * STM uses:
 *   teamA / teamB / restingPlayerIds
 *
 * Normalize at the DB boundary. This also accepts old camelCase
 * rows, so existing templates remain compatible.
 */
function normalizeTemplateSchedule(
  value: unknown,
): IndividualRotationTemplateRecord["schedule"] {
  const schedule =
    asRecord(value, "schedule")

  if (!Array.isArray(schedule.rounds)) {
    throw new Error(
      "Invalid Individual Rotation template: schedule.rounds must be an array.",
    )
  }

  const rounds =
    schedule.rounds.map(
      (rawRound, roundIndex) => {
        const round =
          asRecord(
            rawRound,
            `round ${roundIndex + 1}`,
          )

        if (!Array.isArray(round.matches)) {
          throw new Error(
            `Invalid Individual Rotation template: round ${roundIndex + 1}.matches must be an array.`,
          )
        }

        const matches =
          round.matches.map(
            (rawMatch, matchIndex) => {
              const match =
                asRecord(
                  rawMatch,
                  `round ${roundIndex + 1}, match ${matchIndex + 1}`,
                )

              const roundNumber =
                readRoundNumber(
                  round,
                  roundIndex + 1,
                )

              return {
                ...match,
                roundNumber,
                teamA: readPlayerPair(
                  match,
                  "teamA",
                  "team_a",
                  `round ${roundIndex + 1}, match ${matchIndex + 1}.teamA`,
                ),
                teamB: readPlayerPair(
                  match,
                  "teamB",
                  "team_b",
                  `round ${roundIndex + 1}, match ${matchIndex + 1}.teamB`,
                ),
              }
            },
          )

        return {
          ...round,
          roundNumber: readRoundNumber(
            round,
            roundIndex + 1,
          ),
          matches,
          restingPlayerIds:
            readRestingPlayerIds(
              round,
              `round ${roundIndex + 1}.restingPlayerIds`,
            ),
        }
      },
    )

  const normalizedSchedule: IndividualRotationTemplateRecord["schedule"] = {
    ...schedule,
    rounds,
  }

  return normalizedSchedule
}

export async function getGuestIndividualRotationTemplateAction(input: {
  playerCount: number
  usableCourtCount: number
  seedCount: number
  roundCount: number
}): Promise<IndividualRotationTemplateRecord | null> {
  if (
    !Number.isInteger(
      input.playerCount,
    ) ||
    input.playerCount < 4 ||
    input.playerCount > 20
  ) {
    throw new Error(
      "Individual Rotation requires between 4 and 20 players.",
    )
  }

  const maxUsableCourts =
    Math.min(
      5,
      Math.floor(
        input.playerCount / 4,
      ),
    )

  if (
    !Number.isInteger(
      input.usableCourtCount,
    ) ||
    input.usableCourtCount < 1 ||
    input.usableCourtCount >
      maxUsableCourts
  ) {
    throw new Error(
      `Individual Rotation supports between 1 and ${maxUsableCourts} usable court(s) for ${input.playerCount} players.`,
    )
  }

  if (
    !Number.isInteger(
      input.roundCount,
    ) ||
    input.roundCount < 1 ||
    input.roundCount > 20
  ) {
    throw new Error(
      "Individual Rotation rounds must be between 1 and 20.",
    )
  }

  if (
    input.seedCount !== 0 &&
    input.seedCount !== 2 &&
    input.seedCount !== 4
  ) {
    throw new Error(
      "Individual Rotation templates support 0, 2 or 4 seeded players.",
    )
  }

  const supabase =
    createAdminClient()

  const engineVersion =
    INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION

  const { data, error } =
    await supabase
      .from(
        "individual_rotation_templates",
      )
      .select("*")
      .eq(
        "player_count",
        input.playerCount,
      )
      .eq(
        "usable_court_count",
        input.usableCourtCount,
      )
      .eq(
        "seed_count",
        input.seedCount,
      )
      .eq(
        "round_count",
        input.roundCount,
      )
      .eq(
        "engine_version",
        engineVersion,
      )
      .maybeSingle()

  if (error) {
    throw new Error(
      `Unable to load Individual Rotation template: ${error.message}`,
    )
  }

  if (!data) {
    const {
      data: nearby,
      error: nearbyError,
    } = await supabase
      .from(
        "individual_rotation_templates",
      )
      .select(
        "player_count,usable_court_count,seed_count,round_count,engine_version",
      )
      .eq(
        "player_count",
        input.playerCount,
      )
      .eq(
        "usable_court_count",
        input.usableCourtCount,
      )
      .order(
        "seed_count",
        { ascending: true },
      )
      .order(
        "round_count",
        { ascending: true },
      )
      .limit(100)

    if (nearbyError) {
      throw new Error(
        `Template lookup returned no row and diagnostic lookup failed: ${nearbyError.message}`,
      )
    }

    const visible =
      nearby ?? []

    const sample =
      visible
        .slice(0, 12)
        .map(
          (row) =>
            `${row.player_count}/${row.usable_court_count}/${row.seed_count}/${row.round_count}/${row.engine_version}`,
        )
        .join(", ")

    throw new Error(
      [
        "Precomputed IR template lookup returned no row.",
        `Project ref: ${projectRefFromUrl()}.`,
        `Requested: ${input.playerCount}/${input.usableCourtCount}/${input.seedCount}/${input.roundCount}/${engineVersion}.`,
        `Rows visible with same players/courts: ${visible.length}.`,
        sample
          ? `Sample: ${sample}.`
          : "Sample: none.",
      ].join(" "),
    )
  }

  return {
    playerCount:
      data.player_count,
    usableCourtCount:
      data.usable_court_count,
    seedCount:
      data.seed_count,
    roundCount:
      data.round_count,
    engineVersion:
      data.engine_version,
    schedule:
      normalizeTemplateSchedule(
        data.schedule,
      ),
    metrics:
      data.metrics,
    rawPenalty:
      data.raw_penalty,
    theoreticalFloor:
      data.theoretical_floor,
    fairnessScore:
      data.fairness_score,
  } as IndividualRotationTemplateRecord
}
