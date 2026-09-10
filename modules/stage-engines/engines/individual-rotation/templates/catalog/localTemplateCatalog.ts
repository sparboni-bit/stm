import {
  INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
  type IndividualRotationTemplateRecord,
} from "../types"

import players04 from "./players-04.json"
import players05 from "./players-05.json"
import players06 from "./players-06.json"
import players07 from "./players-07.json"
import players08 from "./players-08.json"
import players09 from "./players-09.json"
import players10 from "./players-10.json"
import players11 from "./players-11.json"
import players12 from "./players-12.json"
import players13 from "./players-13.json"
import players14 from "./players-14.json"
import players15 from "./players-15.json"
import players16 from "./players-16.json"
import players17 from "./players-17.json"
import players18 from "./players-18.json"
import players19 from "./players-19.json"
import players20 from "./players-20.json"

type UnknownRecord = Record<string, unknown>

type TemplateInput = {
  playerCount: number
  usableCourtCount: number
  seedCount: number
  roundCount: number
}

const catalogs: Record<number, readonly unknown[]> = {
  4: players04,
  5: players05,
  6: players06,
  7: players07,
  8: players08,
  9: players09,
  10: players10,
  11: players11,
  12: players12,
  13: players13,
  14: players14,
  15: players15,
  16: players16,
  17: players17,
  18: players18,
  19: players19,
  20: players20,
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

function readInteger(
  value: unknown,
  label: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value)
  ) {
    throw new Error(
      `Invalid Individual Rotation template: ${label} must be an integer.`,
    )
  }

  return value
}

function readNumber(
  value: unknown,
  label: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    throw new Error(
      `Invalid Individual Rotation template: ${label} must be a number.`,
    )
  }

  return value
}

function readString(
  value: unknown,
  label: string,
): string {
  if (typeof value !== "string") {
    throw new Error(
      `Invalid Individual Rotation template: ${label} must be a string.`,
    )
  }

  return value
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

function readCourtNumber(
  match: UnknownRecord,
): number | undefined {
  const value =
    match.courtNumber ??
    match.court_number ??
    match.court

  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1
    ? value
    : undefined
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

        const roundNumber =
          readRoundNumber(
            round,
            roundIndex + 1,
          )

        const matches =
          round.matches.map(
            (rawMatch, matchIndex) => {
              const match =
                asRecord(
                  rawMatch,
                  `round ${roundIndex + 1}, match ${matchIndex + 1}`,
                )

              return {
                roundNumber,
                courtNumber:
                  readCourtNumber(match),
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
          roundNumber,
          matches,
          restingPlayerIds:
            readRestingPlayerIds(
              round,
              `round ${roundIndex + 1}.restingPlayerIds`,
            ),
        }
      },
    )

  return {
    rounds,
  }
}

function toTemplateRecord(
  rawValue: unknown,
): IndividualRotationTemplateRecord {
  const raw =
    asRecord(
      rawValue,
      "template",
    )

  const metrics =
    asRecord(
      raw.metrics,
      "metrics",
    )

  return {
    playerCount:
      readInteger(
        raw.playerCount,
        "playerCount",
      ),
    usableCourtCount:
      readInteger(
        raw.usableCourtCount,
        "usableCourtCount",
      ),
    seedCount:
      readInteger(
        raw.seedCount,
        "seedCount",
      ),
    roundCount:
      readInteger(
        raw.roundCount,
        "roundCount",
      ),
    engineVersion:
      readString(
        raw.engineVersion,
        "engineVersion",
      ),
    schedule:
      normalizeTemplateSchedule(
        raw.schedule,
      ),

    // The catalog metrics were generated by the validated Python
    // template engine and are preserved exactly as stored.
    // They are intentionally cast at this boundary, matching the
    // previous Supabase Server Action behaviour.
    metrics:
      metrics as IndividualRotationTemplateRecord["metrics"],

    rawPenalty:
      readNumber(
        raw.rawPenalty,
        "rawPenalty",
      ),
    theoreticalFloor:
      readNumber(
        raw.theoreticalFloor,
        "theoreticalFloor",
      ),
    fairnessScore:
      readNumber(
        raw.fairnessScore,
        "fairnessScore",
      ),
  }
}

export function getLocalIndividualRotationTemplate(
  input: TemplateInput,
): IndividualRotationTemplateRecord | null {
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
    input.seedCount !== 3 &&
    input.seedCount !== 4
  ) {
    throw new Error(
      "Individual Rotation templates support 0, 2, 3 or 4 Keep Apart players.",
    )
  }

  const catalog =
    catalogs[input.playerCount]

  if (!catalog) {
    return null
  }

  const engineVersion =
    INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION

  const rawTemplate =
    catalog.find(
      (value) => {
        const template =
          asRecord(
            value,
            "template",
          )

        return (
          template.playerCount ===
            input.playerCount &&
          template.usableCourtCount ===
            input.usableCourtCount &&
          template.seedCount ===
            input.seedCount &&
          template.roundCount ===
            input.roundCount &&
          template.engineVersion ===
            engineVersion
        )
      },
    )

  if (!rawTemplate) {
    throw new Error(
      [
        "Precomputed IR local template lookup returned no row.",
        `Requested: ${input.playerCount}/${input.usableCourtCount}/${input.seedCount}/${input.roundCount}/${engineVersion}.`,
      ].join(" "),
    )
  }

  return toTemplateRecord(
    rawTemplate,
  )
}
