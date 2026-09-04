"use server"

import { listCompetitionEntries } from "../../../../competition-entries/repositories/competition-entry.repository"
import { listCompetitionStageEntries } from "../../../../competition-stage-entries/repositories/competition-stage-entry.repository"
import { getCompetitionStage } from "../../../../competition-stages/repositories/competition-stage.repository"
import { listStageMatches } from "../../../../matches/repositories"

import { getIndividualRotationTemplate } from "../templates/TemplateRepository"
import { INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION } from "../templates/types"

import {
  analyzeFairnessSchedule,
  type FairnessAnalysis,
  type FairnessMatch,
  type FairnessPlayer,
  type FairnessRound,
  type FairnessSchedule,
} from "../fairness"

export type IndividualRotationPlayRestMatrix = {
  rounds: number[]
  players: Array<{
    playerId: string
    displayName: string
    seed: number | null
    states: Array<"play" | "rest" | "warning">
  }>
}

export type IndividualRotationFairnessReport = FairnessAnalysis & {
  playerCount: number
  playRestMatrix: IndividualRotationPlayRestMatrix
}

async function requireIndividualRotationStage(stageId: string) {
  const id = stageId.trim()

  if (!id) {
    throw new Error("Stage id is required.")
  }

  const stage = await getCompetitionStage(id)

  if (!stage) {
    throw new Error("Competition Stage not found.")
  }

  if (stage.stageType !== "individual_rotation") {
    throw new Error(
      "This action is only available for Individual Rotation.",
    )
  }

  return stage
}

async function loadPlayers(
  stageId: string,
  competitionId: string,
): Promise<FairnessPlayer[]> {
  const [stageEntries, competitionEntries] =
    await Promise.all([
      listCompetitionStageEntries(stageId),
      listCompetitionEntries(competitionId),
    ])

  const names = new Map(
    competitionEntries.map((entry) => [
      entry.id,
      entry.display_name,
    ]),
  )

  return stageEntries
    .filter((entry) => entry.status === "active")
    .map((entry) => ({
      id: entry.competition_entry_id,
      displayName:
        names.get(entry.competition_entry_id) ??
        "Player",
      seed:
        typeof entry.seed === "number" &&
        entry.seed > 0
          ? entry.seed
          : null,
    }))
}

function teamIds(
  participant: {
    members?: Array<{ entryId: string }>
  },
): readonly [string, string] {
  const ids = participant.members?.map(
    (member) => member.entryId,
  )

  if (
    !ids ||
    ids.length !== 2 ||
    !ids[0] ||
    !ids[1]
  ) {
    throw new Error(
      "A generated Individual Rotation match contains an invalid rotation team.",
    )
  }

  return [ids[0], ids[1]]
}

function buildSchedule(
  players: readonly FairnessPlayer[],
  matches: Awaited<ReturnType<typeof listStageMatches>>,
): FairnessSchedule {
  const playerIds = new Set(
    players.map((player) => player.id),
  )

  const grouped = new Map<number, FairnessMatch[]>()

  for (const match of matches) {
    if (match.matchType !== "individual_rotation") {
      continue
    }

    const teamA = teamIds(match.sideA)
    const teamB = teamIds(match.sideB)

    const roundMatches =
      grouped.get(match.roundNumber) ?? []

    roundMatches.push({
      id: match.id,
      roundNumber: match.roundNumber,
      teamA,
      teamB,
    })

    grouped.set(match.roundNumber, roundMatches)
  }

  const rounds: FairnessRound[] =
    Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([roundNumber, roundMatches]) => {
        const active = new Set<string>()

        for (const match of roundMatches) {
          for (const id of match.teamA) active.add(id)
          for (const id of match.teamB) active.add(id)
        }

        return {
          roundNumber,
          matches: roundMatches,
          restingPlayerIds: Array.from(playerIds).filter(
            (id) => !active.has(id),
          ),
        }
      })

  return { rounds }
}

function buildPlayRestMatrix(
  players: readonly FairnessPlayer[],
  schedule: FairnessSchedule,
): IndividualRotationPlayRestMatrix {
  const rounds = schedule.rounds.map(
    (round) => round.roundNumber,
  )

  const activeByRound =
    new Map<number, Set<string>>()

  for (const round of schedule.rounds) {
    const active = new Set<string>()

    for (const match of round.matches) {
      for (const playerId of match.teamA) {
        active.add(playerId)
      }

      for (const playerId of match.teamB) {
        active.add(playerId)
      }
    }

    activeByRound.set(
      round.roundNumber,
      active,
    )
  }

  return {
    rounds,
    players: players.map((player) => {
      const rawStates = rounds.map(
        (roundNumber) =>
          activeByRound
            .get(roundNumber)
            ?.has(player.id)
            ? "play"
            : "rest",
      )

      const states:
        Array<"play" | "rest" | "warning"> =
        rawStates.map((state, index) => {
          if (state === "play") {
            return "play"
          }

          const previousRest =
            index > 0 &&
            rawStates[index - 1] === "rest"

          const nextRest =
            index < rawStates.length - 1 &&
            rawStates[index + 1] === "rest"

          return previousRest || nextRest
            ? "warning"
            : "rest"
        })

      return {
        playerId: player.id,
        displayName: player.displayName,
        seed:
          typeof player.seed === "number" &&
          player.seed > 0
            ? player.seed
            : null,
        states,
      }
    }),
  }
}

export async function getIndividualRotationFairnessReportAction(
  stageId: string,
): Promise<IndividualRotationFairnessReport> {
  const stage =
    await requireIndividualRotationStage(stageId)

  const [players, matches] = await Promise.all([
    loadPlayers(stage.id, stage.competitionId),
    listStageMatches(stage.id),
  ])

  if (players.length < 4) {
    throw new Error(
      "At least 4 active players are required for fairness analysis.",
    )
  }

  const schedule = buildSchedule(players, matches)

  if (schedule.rounds.length === 0) {
    throw new Error(
      "Generate the Individual Rotation schedule before opening Fairness.",
    )
  }

  return {
    ...analyzeFairnessSchedule(players, schedule),
    playerCount: players.length,
    playRestMatrix:
      buildPlayRestMatrix(
        players,
        schedule,
      ),
  }
}


function readIntegerSetting(
  settings: Record<string, unknown>,
  key: string,
): number | null {
  const value = settings[key]

  return typeof value === "number" &&
    Number.isInteger(value)
    ? value
    : null
}

function mapTemplateScheduleToPlayers(
  players: readonly FairnessPlayer[],
  schedule: FairnessSchedule,
): FairnessSchedule {
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

  const remap = (templatePlayerId: string) => {
    const playerId =
      playerIdByTemplateId.get(templatePlayerId)

    if (!playerId) {
      throw new Error(
        `Template player ${templatePlayerId} cannot be mapped to a Stage Entry.`,
      )
    }

    return playerId
  }

  return {
    rounds: schedule.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((match) => ({
        ...match,
        teamA: [
          remap(match.teamA[0]),
          remap(match.teamA[1]),
        ] as const,
        teamB: [
          remap(match.teamB[0]),
          remap(match.teamB[1]),
        ] as const,
      })),
      restingPlayerIds:
        round.restingPlayerIds.map(remap),
    })),
  }
}

export async function getIndividualRotationFairnessPreviewAction(
  stageId: string,
): Promise<IndividualRotationFairnessReport> {
  const stage =
    await requireIndividualRotationStage(stageId)

  if (
    stage.status === "generated" ||
    stage.status === "running" ||
    stage.status === "completed"
  ) {
    return getIndividualRotationFairnessReportAction(
      stage.id,
    )
  }

  const players = await loadPlayers(
    stage.id,
    stage.competitionId,
  )

  if (players.length < 4) {
    throw new Error(
      "Assign at least 4 active players before opening Fairness Preview.",
    )
  }

  if (players.length > 16) {
    throw new Error(
      "Individual Rotation Fairness Preview supports up to 16 players per Stage.",
    )
  }

  const courtCount =
    readIntegerSetting(
      stage.settings,
      "courtCount",
    )

  const requestedRounds =
    readIntegerSetting(
      stage.settings,
      "requestedRounds",
    )

  if (!courtCount || courtCount < 1) {
    throw new Error(
      "Save the Planner court configuration before opening Fairness Preview.",
    )
  }

  if (!requestedRounds || requestedRounds < 1) {
    throw new Error(
      "Choose and save the requested number of rounds in the Planner before opening Fairness Preview.",
    )
  }

  const usableCourtCount = Math.min(
    courtCount,
    Math.floor(players.length / 4),
    4,
  )

  const seedCount =
    players.filter(
      (player) =>
        typeof player.seed === "number" &&
        player.seed > 0,
    ).length

  if (
    seedCount !== 0 &&
    seedCount !== 2 &&
    seedCount !== 3 &&
    seedCount !== 4
  ) {
    throw new Error(
      "Individual Rotation templates support 0, 2, 3 or 4 Keep Apart players. Update the Stage Keep Apart selection before Fairness Preview.",
    )
  }

  const template =
    await getIndividualRotationTemplate({
      playerCount: players.length,
      usableCourtCount,
      seedCount,
      roundCount: requestedRounds,
      engineVersion:
        INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
    })

  if (!template) {
    throw new Error(
      `No precomputed Individual Rotation template is available for ${players.length} players, ${usableCourtCount} usable court(s), ${seedCount} Keep Apart player(s), and ${requestedRounds} round(s).`,
    )
  }

  const schedule =
    mapTemplateScheduleToPlayers(
      players,
      template.schedule,
    )

  return {
    ...analyzeFairnessSchedule(
      players,
      schedule,
    ),
    playerCount: players.length,
    playRestMatrix:
      buildPlayRestMatrix(
        players,
        schedule,
      ),
  }
}
