import {
  FairnessState,
  progressiveRepeatPenalty,
} from "./FairnessState"

import type {
  FairnessMatch,
  FairnessPenaltyBreakdown,
  FairnessPlayer,
  FairnessSchedule,
  FairnessWeights,
} from "./types"

import {
  DEFAULT_FAIRNESS_WEIGHTS,
} from "./types"

function spread(values: readonly number[]): number {
  if (values.length === 0) return 0
  return Math.max(...values) - Math.min(...values)
}

function pairPenalty(
  maps: readonly Map<string, number>[],
): number {
  let directionalTotal = 0

  for (const map of maps) {
    for (const count of map.values()) {
      directionalTotal +=
        progressiveRepeatPenalty(count)
    }
  }

  return directionalTotal / 2
}

function isSeeded(player: FairnessPlayer): boolean {
  return (
    player.seed !== null &&
    player.seed !== undefined &&
    player.seed > 0
  )
}

function hasStrength(
  player: FairnessPlayer,
): player is FairnessPlayer & { strength: number } {
  return (
    player.strength !== null &&
    player.strength !== undefined &&
    Number.isFinite(player.strength)
  )
}

function matchSeedPenalty(
  match: FairnessMatch,
  state: FairnessState,
): number {
  const a1 = state.getPlayer(match.teamA[0])
  const a2 = state.getPlayer(match.teamA[1])
  const b1 = state.getPlayer(match.teamB[0])
  const b2 = state.getPlayer(match.teamB[1])

  let penalty = 0

  if (isSeeded(a1) && isSeeded(a2)) penalty += 1
  if (isSeeded(b1) && isSeeded(b2)) penalty += 1

  return penalty
}

/**
 * Competitive balance is evaluated only when all four players
 * have a real numeric strength. Seed is NOT converted into strength.
 */
function matchStrengthImbalance(
  match: FairnessMatch,
  state: FairnessState,
): number {
  const players = [
    state.getPlayer(match.teamA[0]),
    state.getPlayer(match.teamA[1]),
    state.getPlayer(match.teamB[0]),
    state.getPlayer(match.teamB[1]),
  ]

  if (!players.every(hasStrength)) {
    return 0
  }

  const [a1, a2, b1, b2] = players

  return Math.abs(
    a1.strength +
      a2.strength -
      b1.strength -
      b2.strength,
  )
}

export function scoreFairnessSchedule(
  players: readonly FairnessPlayer[],
  schedule: FairnessSchedule,
  weights: FairnessWeights =
    DEFAULT_FAIRNESS_WEIGHTS,
): FairnessPenaltyBreakdown {
  const state = new FairnessState(players)
  state.applySchedule(schedule.rounds)

  const snapshot = state.getSnapshot()

  const participationSpread = spread(
    snapshot.map((row) => row.played),
  )

  const sitoutSpread = spread(
    snapshot.map((row) => row.rested),
  )

  const consecutiveSitouts = snapshot.reduce(
    (total, row) =>
      total + row.consecutiveSitouts,
    0,
  )

  const partnerUnits = pairPenalty(
    state.getPartnerMaps(),
  )

  const opponentUnits = pairPenalty(
    state.getOpponentMaps(),
  )

  let seededPartnerships = 0
  let strengthImbalance = 0

  for (const round of schedule.rounds) {
    for (const match of round.matches) {
      seededPartnerships += matchSeedPenalty(
        match,
        state,
      )

      strengthImbalance +=
        matchStrengthImbalance(match, state)
    }
  }

  const penalties: FairnessPenaltyBreakdown = {
    participation:
      participationSpread *
      weights.participationSpread,

    sitouts:
      sitoutSpread * weights.sitoutSpread,

    consecutiveSitouts:
      consecutiveSitouts *
      weights.consecutiveSitout,

    partners:
      partnerUnits * weights.partnerRepeat,

    opponents:
      opponentUnits * weights.opponentRepeat,

    seeds:
      seededPartnerships *
      weights.seededPartnership,

    strengthBalance:
      strengthImbalance *
      weights.teamStrengthImbalance,

    total: 0,
  }

  penalties.total =
    penalties.participation +
    penalties.sitouts +
    penalties.consecutiveSitouts +
    penalties.partners +
    penalties.opponents +
    penalties.seeds +
    penalties.strengthBalance

  return penalties
}
