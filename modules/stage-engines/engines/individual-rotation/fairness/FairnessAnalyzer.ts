import { FairnessState } from "./FairnessState"
import { scoreFairnessSchedule } from "./FairnessScorer"

import type {
  FairnessAnalysis,
  FairnessMetrics,
  FairnessPlayer,
  FairnessSchedule,
  FairnessWeights,
} from "./types"

import {
  DEFAULT_FAIRNESS_WEIGHTS,
} from "./types"

function min(values: readonly number[]): number {
  return values.length ? Math.min(...values) : 0
}

function max(values: readonly number[]): number {
  return values.length ? Math.max(...values) : 0
}

function maxRelationCount(
  maps: readonly Map<string, number>[],
): number {
  let result = 0

  for (const map of maps) {
    for (const count of map.values()) {
      result = Math.max(result, count)
    }
  }

  return result
}

function countSeededPartnerships(
  players: readonly FairnessPlayer[],
  schedule: FairnessSchedule,
): number {
  const seeded = new Set(
    players
      .filter(
        (player) =>
          player.seed !== null &&
          player.seed !== undefined &&
          player.seed > 0,
      )
      .map((player) => player.id),
  )

  let count = 0

  for (const round of schedule.rounds) {
    for (const match of round.matches) {
      if (
        seeded.has(match.teamA[0]) &&
        seeded.has(match.teamA[1])
      ) {
        count += 1
      }

      if (
        seeded.has(match.teamB[0]) &&
        seeded.has(match.teamB[1])
      ) {
        count += 1
      }
    }
  }

  return count
}

function normalizedScore(totalPenalty: number): number {
  // A bounded, monotonic display score.
  // Optimizer comparisons must use raw penalty, not this score.
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 / (1 + totalPenalty / 10_000),
      ),
    ),
  )
}

function grade(
  score: number,
): FairnessAnalysis["grade"] {
  if (score >= 90) return "excellent"
  if (score >= 75) return "good"
  if (score >= 60) return "acceptable"
  return "poor"
}

export function analyzeFairnessSchedule(
  players: readonly FairnessPlayer[],
  schedule: FairnessSchedule,
  weights: FairnessWeights =
    DEFAULT_FAIRNESS_WEIGHTS,
): FairnessAnalysis {
  const state = new FairnessState(players)
  state.applySchedule(schedule.rounds)

  const playerStats = state.getSnapshot()

  const played = playerStats.map(
    (row) => row.played,
  )
  const rested = playerStats.map(
    (row) => row.rested,
  )

  const partnerMaps = state.getPartnerMaps()
  const opponentMaps = state.getOpponentMaps()

  const repeatedPartnerRelations =
    playerStats.reduce(
      (total, row) =>
        total + row.repeatedPartnerRelations,
      0,
    ) / 2

  const repeatedOpponentRelations =
    playerStats.reduce(
      (total, row) =>
        total + row.repeatedOpponentRelations,
      0,
    ) / 2

  const metrics: FairnessMetrics = {
    totalRounds: schedule.rounds.length,
    totalMatches: schedule.rounds.reduce(
      (total, round) =>
        total + round.matches.length,
      0,
    ),

    minMatchesPerPlayer: min(played),
    maxMatchesPerPlayer: max(played),
    participationSpread:
      max(played) - min(played),

    minSitoutsPerPlayer: min(rested),
    maxSitoutsPerPlayer: max(rested),
    sitoutSpread: max(rested) - min(rested),

    consecutiveSitouts: playerStats.reduce(
      (total, row) =>
        total + row.consecutiveSitouts,
      0,
    ),

    repeatedPartnerRelations,
    repeatedOpponentRelations,

    maxPartnerCount:
      maxRelationCount(partnerMaps),

    maxOpponentCount:
      maxRelationCount(opponentMaps),

    seededPartnerships:
      countSeededPartnerships(
        players,
        schedule,
      ),

    // Detailed strength imbalance is already represented
    // in the scorer. It is exposed in Checkpoint B when
    // candidate matches receive explicit strength data.
    totalTeamStrengthImbalance: 0,

    playerStats,
  }

  const penalties = scoreFairnessSchedule(
    players,
    schedule,
    weights,
  )

  const score = normalizedScore(
    penalties.total,
  )

  return {
    metrics,
    penalties,
    score,
    grade: grade(score),
  }
}
