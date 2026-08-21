import {
  analyzeFairnessSchedule,
  calculateFairnessFloor,
  normalizedFairnessScore,
  optimizeFairnessSchedule,
  DEFAULT_FAIRNESS_WEIGHTS,
  type FairnessPlayer,
} from "./index"

type Case = {
  players: number
  courts: number
  rounds: number
}

const cases: readonly Case[] = [
  { players: 8, courts: 2, rounds: 3 },
  { players: 9, courts: 2, rounds: 3 },
  { players: 10, courts: 2, rounds: 5 },
  { players: 11, courts: 2, rounds: 3 },
  { players: 12, courts: 3, rounds: 3 },
  // Diagnostic only: proves why 13/3/3 raw 18,000 can be optimal.
  { players: 13, courts: 3, rounds: 3 },
]

function roster(count: number): FairnessPlayer[] {
  return Array.from(
    { length: count },
    (_, i) => ({
      id: `P${i + 1}`,
      displayName: `Player ${i + 1}`,
      seed: i < Math.min(4, count) ? i + 1 : undefined,
    }),
  )
}

for (const test of cases) {
  const players = roster(test.players)

  const floor = calculateFairnessFloor(
    players,
    test.courts,
    test.rounds,
    DEFAULT_FAIRNESS_WEIGHTS.participationSpread,
    DEFAULT_FAIRNESS_WEIGHTS.sitoutSpread,
  )

  const started = Date.now()

  const result = optimizeFairnessSchedule(
    players,
    {
      courtCount: test.courts,
      roundCount: test.rounds,
      beamWidth: 40,
      localCandidateWidth: 80,
      guidedCandidateWidth: 240,
      activeSetWidth: 24,
      partialBeamWidth: 120,
    },
  )

  const analysis =
    analyzeFairnessSchedule(
      players,
      result.schedule,
    )

  const normalized =
    normalizedFairnessScore(
      result.rawPenalty,
      floor.total,
    )

  console.log(
    `\n=== ${test.players}/${test.courts}/${test.rounds} ===`,
  )
  console.log(
    JSON.stringify(
      {
        rawPenalty: result.rawPenalty,
        oldDisplayScore: analysis.score,
        theoreticalFloor: floor,
        avoidablePenalty: Math.max(
          0,
          result.rawPenalty - floor.total,
        ),
        normalizedScore: normalized,
        partnerRepeats:
          analysis.metrics.repeatedPartnerRelations,
        opponentRepeats:
          analysis.metrics.repeatedOpponentRelations,
        seedPairs:
          analysis.metrics.seededPartnerships,
        games:
          `${analysis.metrics.minMatchesPerPlayer}-${analysis.metrics.maxMatchesPerPlayer}`,
        rests:
          `${analysis.metrics.minSitoutsPerPlayer}-${analysis.metrics.maxSitoutsPerPlayer}`,
        elapsedMs:
          Date.now() - started,
      },
      null,
      2,
    ),
  )
}

console.log("\nB8 fairness-floor benchmark completed.")
