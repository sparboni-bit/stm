"use server"

import { revalidatePath } from "next/cache"

import { listCompetitionEntries } from "../../../../competition-entries/repositories/competition-entry.repository"
import { listCompetitionStageEntries } from "../../../../competition-stage-entries/repositories/competition-stage-entry.repository"
import {
  getCompetitionStage,
  updateCompetitionStageSettings,
} from "../../../../competition-stages/repositories/competition-stage.repository"

import type {
  FairnessMetrics,
  FairnessPlayer,
} from "../fairness"

import { resolveIndividualRotationTemplateFamily } from "../templates/TemplateResolver"

export type IndividualRotationPlannerSettingsInput = {
  courtCount: number
  availableMinutes: number
  matchDurationMinutes: number
  rotationMinutes: number
  requestedRounds: number | null
}

export type IndividualRotationPlannerSummary = {
  playerCount: number
  seedCount: number
}

export type IndividualRotationProposal = {
  kind: "minimum_fair" | "recommended" | "maximum_play"
  rounds: number
  normalizedScore: number
  rawPenalty: number
  theoreticalFloor: number
  avoidablePenalty: number
  minGames: number
  maxGames: number
  minRests: number
  maxRests: number
  partnerRepeats: number
  opponentRepeats: number
  consecutiveSitouts: number
  seedPairs: number
  maxPartnerCount: number
  maxOpponentCount: number
}

export type IndividualRotationPlannerProposals = {
  playerCount: number
  seedCount: number
  courtsUsed: number
  maxRoundsByTime: number
  evaluatedRounds: number[]
  proposals: IndividualRotationProposal[]
  curve: IndividualRotationProposal[]
}

function integer(
  value: number,
  label: string,
  min: number,
  max: number,
) {
  if (
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new Error(
      `${label} must be an integer between ${min} and ${max}.`,
    )
  }

  return value
}

async function requireIndividualRotationStage(
  stageId: string,
) {
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

export async function saveIndividualRotationPlannerSettingsAction(
  stageId: string,
  input: IndividualRotationPlannerSettingsInput,
) {
  const stage =
    await requireIndividualRotationStage(stageId)

  const courtCount = integer(
    input.courtCount,
    "Court count",
    1,
    32,
  )

  const availableMinutes = integer(
    input.availableMinutes,
    "Available minutes",
    1,
    1440,
  )

  const matchDurationMinutes = integer(
    input.matchDurationMinutes,
    "Match duration",
    1,
    240,
  )

  const rotationMinutes = integer(
    input.rotationMinutes,
    "Rotation minutes",
    0,
    60,
  )

  const requestedRounds =
    input.requestedRounds === null
      ? null
      : integer(
          input.requestedRounds,
          "Requested rounds",
          1,
          12,
        )

  const roundDurationMinutes =
    matchDurationMinutes + rotationMinutes

  const maxRoundsByTime = Math.floor(
    availableMinutes / roundDurationMinutes,
  )

  if (maxRoundsByTime < 1) {
    throw new Error(
      "The available time is not enough to complete one round.",
    )
  }

  const maxAvailableRounds = Math.min(
    maxRoundsByTime,
    12,
  )

  if (
    requestedRounds !== null &&
    requestedRounds > maxAvailableRounds
  ) {
    throw new Error(
      `Requested rounds exceed the available template/time limit. Maximum: ${maxAvailableRounds}.`,
    )
  }

  const updated =
    await updateCompetitionStageSettings(
      stage.id,
      {
        courtCount,
        availableMinutes,
        matchDurationMinutes,
        rotationMinutes,
        requestedRounds,
        planner: {
          maxRoundsByTime,
          maxAvailableRounds,
          roundDurationMinutes,
        },
      },
    )

  revalidatePath(
    `/competitions/${stage.competitionId}/stages/${stage.id}`,
  )

  revalidatePath(
    `/competitions/${stage.competitionId}`,
  )

  return updated
}

async function loadPlayers(
  stageId: string,
  competitionId: string,
): Promise<FairnessPlayer[]> {
  const [
    stageEntries,
    competitionEntries,
  ] = await Promise.all([
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

export async function getIndividualRotationPlannerSummaryAction(
  stageId: string,
): Promise<IndividualRotationPlannerSummary> {
  const stage =
    await requireIndividualRotationStage(stageId)

  const players = await loadPlayers(
    stage.id,
    stage.competitionId,
  )

  return {
    playerCount: players.length,
    seedCount: players.filter(
      (player) => player.seed != null,
    ).length,
  }
}

function proposalFromTemplate(
  row: {
    round_count: number
    fairness_score: number
    raw_penalty: number
    theoretical_floor: number
    metrics: FairnessMetrics
  },
): IndividualRotationProposal {
  const metrics = row.metrics

  return {
    kind: "recommended",

    rounds: row.round_count,

    normalizedScore:
      row.fairness_score,

    rawPenalty:
      row.raw_penalty,

    theoreticalFloor:
      row.theoretical_floor,

    avoidablePenalty:
      Math.max(
        0,
        row.raw_penalty -
          row.theoretical_floor,
      ),

    minGames:
      metrics.minMatchesPerPlayer,

    maxGames:
      metrics.maxMatchesPerPlayer,

    minRests:
      metrics.minSitoutsPerPlayer,

    maxRests:
      metrics.maxSitoutsPerPlayer,

    partnerRepeats:
      metrics.repeatedPartnerRelations,

    opponentRepeats:
      metrics.repeatedOpponentRelations,

    consecutiveSitouts:
      metrics.consecutiveSitouts,

    seedPairs:
      metrics.seededPartnerships,

    maxPartnerCount:
      metrics.maxPartnerCount,

    maxOpponentCount:
      metrics.maxOpponentCount,
  }
}

export async function calculateIndividualRotationPlannerProposalsAction(
  stageId: string,
  input: IndividualRotationPlannerSettingsInput,
): Promise<IndividualRotationPlannerProposals> {
  const stage =
    await requireIndividualRotationStage(stageId)

  const players = await loadPlayers(
    stage.id,
    stage.competitionId,
  )

  if (players.length < 4) {
    throw new Error(
      "Assign at least 4 active players before calculating proposals.",
    )
  }

  /*
   * Individual Rotation Template Library V1
   * supports up to 16 players per Stage.
   *
   * Larger groups should be divided across
   * multiple Individual Rotation stages.
   */
  if (players.length > 16) {
    const suggestedStages =
      Math.ceil(players.length / 16)

    const basePlayers =
      Math.floor(
        players.length /
          suggestedStages,
      )

    const remainder =
      players.length %
      suggestedStages

    const distribution =
      Array.from(
        { length: suggestedStages },
        (_, index) =>
          basePlayers +
          (index < remainder ? 1 : 0),
      )

    throw new Error(
      `Individual Rotation supports up to 16 players per Stage. ` +
        `For ${players.length} players, create ${suggestedStages} ` +
        `Individual Rotation stages with a balanced distribution: ` +
        `${distribution.join(" + ")} players.`,
    )
  }

  const requestedCourts = integer(
    input.courtCount,
    "Court count",
    1,
    32,
  )

  const available = integer(
    input.availableMinutes,
    "Available minutes",
    1,
    1440,
  )

  const matchMinutes = integer(
    input.matchDurationMinutes,
    "Match duration",
    1,
    240,
  )

  const rotation = integer(
    input.rotationMinutes,
    "Rotation minutes",
    0,
    60,
  )

  const courtsUsed = Math.min(
    requestedCourts,
    Math.floor(players.length / 4),
    4,
  )

  const roundDuration =
    matchMinutes + rotation

  const maxRoundsByTime =
    Math.floor(
      available / roundDuration,
    )

  if (
    courtsUsed < 1 ||
    maxRoundsByTime < 1
  ) {
    throw new Error(
      "The current configuration cannot produce a playable round.",
    )
  }

  /*
   * Template Library V1 contains R1–R12.
   */
  const maxAvailableRounds =
    Math.min(
      maxRoundsByTime,
      12,
    )

  const actualSeedCount =
    players.filter(
      (player) => player.seed != null,
    ).length

  /*
   * TemplateResolver performs canonical
   * seed normalization:
   *
   * 0 seed → 0S
   * 1 seed  → 0S
   * 2+ seed → 2S
   */
  const templates =
    await resolveIndividualRotationTemplateFamily({
      playerCount:
        players.length,

      usableCourtCount:
        courtsUsed,

      seedCount:
        actualSeedCount,
    })

  const availableTemplates =
    templates
      .filter(
        (row) =>
          row.round_count >= 1 &&
          row.round_count <=
            maxAvailableRounds,
      )
      .sort(
        (a, b) =>
          a.round_count -
          b.round_count,
      )

  if (!availableTemplates.length) {
    throw new Error(
      `No Individual Rotation templates are available for ` +
        `${players.length} players, ${courtsUsed} courts and ` +
        `${actualSeedCount} seeded players.`,
    )
  }

  /*
   * Coverage must be continuous from
   * R1 to maxAvailableRounds.
   */
  const byRound = new Map(
    availableTemplates.map(
      (row) => [
        row.round_count,
        row,
      ],
    ),
  )

  const missingRounds: number[] = []

  for (
    let round = 1;
    round <= maxAvailableRounds;
    round += 1
  ) {
    if (!byRound.has(round)) {
      missingRounds.push(round)
    }
  }

  if (missingRounds.length) {
    throw new Error(
      `Individual Rotation Template Library is incomplete. ` +
        `Missing rounds: ${missingRounds.join(", ")}.`,
    )
  }

  /*
   * No optimization occurs here.
   *
   * Fairness values and metrics were
   * calculated offline and persisted
   * with the template.
   */
  const results =
    availableTemplates.map(
      proposalFromTemplate,
    )

  const evaluatedRounds =
    results.map(
      (proposal) =>
        proposal.rounds,
    )

  const hardClean = (
    proposal:
      IndividualRotationProposal,
  ) =>
    proposal.partnerRepeats === 0 &&
    proposal.seedPairs === 0 &&
    proposal.consecutiveSitouts === 0

  /*
   * Minimum Fair:
   * smallest meaningful rotation that
   * satisfies the hard fairness rules.
   */
  const minimumFair =
    results.find(
      (proposal) =>
        proposal.rounds >= 3 &&
        hardClean(proposal),
    ) ??
    results.find(hardClean) ??
    results[0]

  /*
   * Recommended:
   * maximize useful play while keeping
   * production-quality fairness.
   */
  const recommendedPool =
    results.filter(
      (proposal) =>
        hardClean(proposal) &&
        proposal.normalizedScore >= 90,
    )

  const recommended =
    [...recommendedPool]
      .sort(
        (a, b) =>
          b.rounds -
            a.rounds ||
          b.normalizedScore -
            a.normalizedScore,
      )[0] ??
    [...results]
      .sort(
        (a, b) =>
          b.normalizedScore -
            a.normalizedScore ||
          b.rounds -
            a.rounds,
      )[0]

  /*
   * Maximum Play:
   * maximum number of rounds supported
   * both by available time and by the
   * Template Library V1.
   */
  const maximumPlay =
    results.find(
      (proposal) =>
        proposal.rounds ===
        maxAvailableRounds,
    ) ??
    results.at(-1)!

  return {
    playerCount:
      players.length,

    seedCount:
      actualSeedCount,

    courtsUsed,

    /*
     * Keep the physical time capacity
     * visible to the UI.
     */
    maxRoundsByTime,

    evaluatedRounds,

    proposals: [
      {
        ...minimumFair,
        kind: "minimum_fair",
      },
      {
        ...recommended,
        kind: "recommended",
      },
      {
        ...maximumPlay,
        kind: "maximum_play",
      },
    ],

    curve:
      results,
  }
}