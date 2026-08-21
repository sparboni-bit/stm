"use server"

import { listCompetitionEntries } from "../../../../competition-entries/repositories/competition-entry.repository"
import { listCompetitionStageEntries } from "../../../../competition-stage-entries/repositories/competition-stage-entry.repository"
import { getCompetitionStage } from "../../../../competition-stages/repositories/competition-stage.repository"

import { buildGuidedCandidateRounds } from "../fairness/GuidedRoundBuilder"
import { scoreFairnessSchedule } from "../fairness/FairnessScorer"
import type {
  FairnessPlayer,
  FairnessRound,
} from "../fairness/types"

import {
  appendIndividualRotationRound,
  listExistingRotationMatches,
} from "../repositories/appendRound.repository"

function historyFromMatches(
  matches: Awaited<
    ReturnType<typeof listExistingRotationMatches>
  >,
  playerIds: readonly string[],
): FairnessRound[] {
  const grouped = new Map<
    number,
    typeof matches
  >()

  for (const match of matches) {
    if (!match.roundNumber) {
      continue
    }

    const list =
      grouped.get(match.roundNumber) ?? []

    list.push(match)

    grouped.set(
      match.roundNumber,
      list,
    )
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(
      ([roundNumber, roundMatches]) => {
        const active = new Set<string>()

        const mapped = roundMatches.map(
          (match) => {
            const sideA =
              match.sideA?.entryIds ?? []

            const sideB =
              match.sideB?.entryIds ?? []

            if (
              sideA.length !== 2 ||
              sideB.length !== 2
            ) {
              throw new Error(
                `Round ${roundNumber} contains an invalid rotation team.`,
              )
            }

            for (const playerId of [
              ...sideA,
              ...sideB,
            ]) {
              active.add(playerId)
            }

            return {
              id: match.id,
              roundNumber,
              courtNumber:
                match.matchOrder,
              teamA: [
                sideA[0],
                sideA[1],
              ] as const,
              teamB: [
                sideB[0],
                sideB[1],
              ] as const,
            }
          },
        )

        return {
          roundNumber,
          matches: mapped,
          restingPlayerIds:
            playerIds.filter(
              (playerId) =>
                !active.has(playerId),
            ),
        }
      },
    )
}

async function loadFairnessPlayers(
  stageId: string,
  competitionId: string,
): Promise<FairnessPlayer[]> {
  const [
    stageEntries,
    competitionEntries,
  ] = await Promise.all([
    listCompetitionStageEntries(stageId),
    listCompetitionEntries(
      competitionId,
    ),
  ])

  const names = new Map(
    competitionEntries.map((entry) => [
      entry.id,
      entry.display_name,
    ]),
  )

  return stageEntries
    .filter(
      (entry) =>
        entry.status === "active",
    )
    .map((entry) => ({
      id:
        entry.competition_entry_id,
      displayName:
        names.get(
          entry.competition_entry_id,
        ) ?? "Player",
      seed:
        typeof entry.seed ===
          "number" &&
        entry.seed > 0
          ? entry.seed
          : null,
    }))
}

export async function addIndividualRotationRoundAction(
  stageId: string,
) {
  const stage =
    await getCompetitionStage(stageId)

  if (!stage) {
    throw new Error(
      "Competition Stage not found.",
    )
  }

  if (
    stage.stageType !==
    "individual_rotation"
  ) {
    throw new Error(
      "Stage is not Individual Rotation.",
    )
  }

  if (
    stage.status !== "generated" &&
    stage.status !== "running"
  ) {
    throw new Error(
      "A round can only be added after generation.",
    )
  }

  const players =
    await loadFairnessPlayers(
      stage.id,
      stage.competitionId,
    )

  if (players.length < 4) {
    throw new Error(
      "At least four active players are required.",
    )
  }

  const existing =
    await listExistingRotationMatches(
      stage.id,
    )

  if (!existing.length) {
    throw new Error(
      "No generated schedule found.",
    )
  }

  const history =
    historyFromMatches(
      existing,
      players.map(
        (player) => player.id,
      ),
    )

  const nextRound =
    Math.max(
      ...history.map(
        (round) =>
          round.roundNumber,
      ),
    ) + 1

  const configuredCourts =
    typeof stage.settings
      .courtCount === "number"
      ? stage.settings.courtCount
      : 1

  const courtCount = Math.max(
    1,
    Math.min(
      configuredCourts,
      Math.floor(
        players.length / 4,
      ),
    ),
  )

  const candidates =
    buildGuidedCandidateRounds(
      players,
      {
        roundNumber: nextRound,
        courtCount,
        history,
      },
    )

  if (!candidates.length) {
    throw new Error(
      "Unable to generate another fair round.",
    )
  }

  const best = candidates
    .map((candidate) => ({
      candidate,
      penalty:
        scoreFairnessSchedule(
          players,
          {
            rounds: [
              ...history,
              candidate,
            ],
          },
        ).total,
    }))
    .sort(
      (a, b) =>
        a.penalty - b.penalty,
    )[0]

  const startMatchNumber =
    Math.max(
      ...existing.map(
        (match) =>
          match.matchNumber,
      ),
    ) + 1

  const payload =
    best.candidate.matches.map(
      (match, index) => ({
        id: crypto.randomUUID(),

        match_number:
          startMatchNumber + index,

        visible_match_number:
          startMatchNumber + index,

        status: "ready",

        phase_key: null,
        group_key: null,

        round_number:
          nextRound,

        match_order:
          index + 1,

        match_type:
          "individual_rotation",

        court_label:
          `Court ${
            match.courtNumber ??
            index + 1
          }`,

        side_a: {
          type: "rotation_team",
          entryIds: [
            ...match.teamA,
          ],
        },

        side_b: {
          type: "rotation_team",
          entryIds: [
            ...match.teamB,
          ],
        },

        score: {},

        winner_side: null,
        loser_side: null,

        is_bye: false,

        next_match_id: null,
        next_match_slot: null,

        finish_type: "normal",
        retired_side: null,

        scheduled_at: null,
        started_at: null,
        completed_at: null,

        metadata: {
          engine:
            "individual_rotation",

          roundNumber:
            nextRound,

          courtNumber:
            match.courtNumber ??
            index + 1,

          restingPlayerIds: [
            ...best.candidate
              .restingPlayerIds,
          ],

          appended: true,
        },
      }),
    )

  await appendIndividualRotationRound({
    stageId: stage.id,
    roundNumber: nextRound,
    matches: payload,
    metadata: {
      appendRound: {
        lastRoundNumber:
          nextRound,

        fairnessRawPenalty:
          best.penalty,

        updatedAt:
          new Date().toISOString(),
      },
    },
  })

  return {
    success: true as const,
    roundNumber: nextRound,
    matchCount:
      payload.length,
    fairnessRawPenalty:
      best.penalty,
  }
}
