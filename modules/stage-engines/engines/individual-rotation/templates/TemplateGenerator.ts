import {
  analyzeFairnessSchedule,
  calculateFairnessFloor,
  DEFAULT_FAIRNESS_WEIGHTS,
  normalizedFairnessScore,
  optimizeFairnessSchedule,
} from "../fairness"
import type { FairnessPlayer } from "../fairness/types"

import {
  INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
  type IndividualRotationTemplateRecord,
} from "./types"

export function buildCanonicalPlayers(
  playerCount: number,
  seedCount: number,
): FairnessPlayer[] {
  if (
    !Number.isInteger(playerCount) ||
    playerCount < 4 ||
    playerCount > 16
  ) {
    throw new Error("Player count must be 4-16.")
  }

  if (
    !Number.isInteger(seedCount) ||
    seedCount < 0 ||
    seedCount > 4 ||
    seedCount === 1
  ) {
    throw new Error("Keep Apart count must be 0 or 2-4.")
  }

  return Array.from({ length: playerCount }, (_, index) => {
    const number = index + 1

    return {
      id: `P${String(number).padStart(2, "0")}`,
      displayName: `Player ${String(number).padStart(2, "0")}`,
      seed: number <= seedCount ? number : null,
    }
  })
}

export function generateTemplateFamily(input: {
  playerCount: number
  usableCourtCount: number
  seedCount: number
  maxRounds: number
  engineVersion?: string
}): IndividualRotationTemplateRecord[] {
  const {
    playerCount,
    usableCourtCount,
    seedCount,
    maxRounds,
  } = input

  if (
    usableCourtCount < 1 ||
    usableCourtCount >
      Math.min(4, Math.floor(playerCount / 4))
  ) {
    throw new Error("Invalid usable court count.")
  }

  if (
    !Number.isInteger(maxRounds) ||
    maxRounds < 1 ||
    maxRounds > 100
  ) {
    throw new Error("Invalid maximum rounds.")
  }

  const engineVersion =
    input.engineVersion ??
    INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION

  const players = buildCanonicalPlayers(
    playerCount,
    seedCount,
  )

  const records: IndividualRotationTemplateRecord[] = []

  /*
   * IMPORTANT:
   * Every round count is optimized independently from zero.
   *
   * Template R7 is therefore the best schedule found for 7 rounds;
   * it is NOT constrained to be an extension of template R6.
   *
   * Extension of an already-generated live tournament remains a
   * separate use case and can continue to use existingRounds.
   */
  for (
    let roundCount = 1;
    roundCount <= maxRounds;
    roundCount += 1
  ) {
    const optimized = optimizeFairnessSchedule(
      players,
      {
        courtCount: usableCourtCount,
        roundCount,
        beamWidth: 40,
        localCandidateWidth: 80,
        guidedCandidateWidth: 240,
        activeSetWidth: 24,
        partialBeamWidth: 120,
      },
    )

    const analysis = analyzeFairnessSchedule(
      players,
      optimized.schedule,
    )

    const floor = calculateFairnessFloor(
      players,
      usableCourtCount,
      roundCount,
      DEFAULT_FAIRNESS_WEIGHTS.participationSpread,
      DEFAULT_FAIRNESS_WEIGHTS.sitoutSpread,
    )

    records.push({
      playerCount,
      usableCourtCount,
      seedCount,
      roundCount,
      engineVersion,
      schedule: optimized.schedule,
      metrics: analysis.metrics,
      rawPenalty: optimized.rawPenalty,
      theoreticalFloor: floor.total,
      fairnessScore: normalizedFairnessScore(
        optimized.rawPenalty,
        floor.total,
      ),
    })
  }

  return records
}
