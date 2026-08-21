import type {
  StageGenerationContext,
  StageGenerationResult,
} from "../../../core/types"

import type {
  FairnessPlayer,
  FairnessSchedule,
} from "../fairness"

import type {
  IndividualRotationTemplateRecord,
} from "../templates/types"

import type {
  IndividualRotationSchedule,
} from "../domain/IndividualRotationSchedule"

function readInteger(
  settings: Record<string, unknown>,
  key: string,
): number | null {
  const value = settings[key]

  return typeof value === "number" &&
    Number.isInteger(value)
    ? value
    : null
}

export async function generateIndividualRotationSchedule(
  context: StageGenerationContext,
): Promise<StageGenerationResult> {
  const { stage, entries } = context

  if (entries.length < 4) {
    return {
      success: false,
      message:
        "Individual Rotation requires at least 4 active Stage Entries.",
    }
  }

  if (entries.length > 16) {
    return {
      success: false,
      message:
        "Individual Rotation supports up to 16 players per Stage. Split larger groups across two or more balanced Individual Rotation Stages.",
    }
  }

  if (
    entries.some(
      (entry) => entry.entryType !== "player",
    )
  ) {
    return {
      success: false,
      message:
        "Individual Rotation supports player entries only.",
    }
  }

  const courtCount =
    readInteger(stage.settings, "courtCount")

  const requestedRounds =
    readInteger(
      stage.settings,
      "requestedRounds",
    )

  if (!courtCount || courtCount < 1) {
    return {
      success: false,
      message:
        "Configure at least one court in the Planner before generation.",
    }
  }

  if (
    !requestedRounds ||
    requestedRounds < 1
  ) {
    return {
      success: false,
      message:
        "Choose and save the requested number of rounds in the Planner before generation.",
    }
  }

  const usableCourts = Math.min(
    courtCount,
    Math.floor(entries.length / 4),
  )

  if (usableCourts < 1) {
    return {
      success: false,
      message:
        "The current entries and court configuration cannot produce a playable round.",
    }
  }

  const players: FairnessPlayer[] =
    entries.map((entry) => ({
      id: entry.id,
      displayName: entry.displayName,
      seed:
        typeof entry.seed === "number"
          ? entry.seed
          : null,
    }))

  const seedCount =
    players.filter(
      (player) =>
        typeof player.seed === "number" &&
        player.seed > 0,
    ).length

  if (seedCount !== 0 && (seedCount < 2 || seedCount > 4)) {
    return {
      success: false,
      message:
        "Individual Rotation Keep Apart supports 2, 3 or 4 seeded players.",
    }
  }

  const template =
    context.options?.individualRotationTemplate as
      | IndividualRotationTemplateRecord
      | undefined

  if (!template) {
    return {
      success: false,
      message:
        `No precomputed Individual Rotation template was supplied for ${players.length} players, ${usableCourts} usable court(s), ${seedCount} seed(s), and ${requestedRounds} round(s).`,
    }
  }

  if (
    template.playerCount !== players.length ||
    template.usableCourtCount !== usableCourts ||
    template.seedCount !== seedCount ||
    template.roundCount !== requestedRounds
  ) {
    return {
      success: false,
      message:
        "The supplied Individual Rotation template does not match the current Stage configuration.",
    }
  }

  const orderedPlayers = [
    ...players
      .filter(
        (player) =>
          typeof player.seed === "number" &&
          player.seed > 0,
      )
      .sort(
        (a, b) =>
          (a.seed ?? 0) - (b.seed ?? 0),
      ),
    ...players.filter(
      (player) =>
        typeof player.seed !== "number" ||
        player.seed <= 0,
    ),
  ]

  const playerIdByTemplateId =
    new Map<string, string>()

  orderedPlayers.forEach(
    (player, index) => {
      playerIdByTemplateId.set(
        `P${String(index + 1).padStart(2, "0")}`,
        player.id,
      )
    },
  )

  const remapPlayerId =
    (templatePlayerId: string): string => {
      const mapped =
        playerIdByTemplateId.get(
          templatePlayerId,
        )

      if (!mapped) {
        throw new Error(
          `Template player ${templatePlayerId} cannot be mapped to a Stage Entry.`,
        )
      }

      return mapped
    }

  let schedule: FairnessSchedule

  try {
    schedule = {
      rounds: template.schedule.rounds.map(
        (round) => ({
          ...round,
          matches: round.matches.map(
            (match) => ({
              ...match,
              teamA: [
                remapPlayerId(match.teamA[0]),
                remapPlayerId(match.teamA[1]),
              ] as const,
              teamB: [
                remapPlayerId(match.teamB[0]),
                remapPlayerId(match.teamB[1]),
              ] as const,
            }),
          ),
          restingPlayerIds:
            round.restingPlayerIds.map(
              remapPlayerId,
            ),
        }),
      ),
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "The selected Individual Rotation template could not be mapped to the current Stage Entries.",
    }
  }

  const matchCount =
    schedule.rounds.reduce(
      (sum, round) =>
        sum + round.matches.length,
      0,
    )

  const output: IndividualRotationSchedule = {
    id: crypto.randomUUID(),
    roundCount:
      schedule.rounds.length,
    matchCount,
    fairnessRawPenalty:
      template.rawPenalty,
    schedule,
  }

  return {
    success: true,
    message:
      "Individual Rotation schedule generated.",
    output,
  }
}
