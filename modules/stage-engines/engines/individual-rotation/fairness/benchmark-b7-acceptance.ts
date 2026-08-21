import {
  analyzeFairnessSchedule,
  optimizeFairnessSchedule,
  type FairnessPlayer,
} from "./index"

type Case = {
  players: number
  courts: number
  rounds: number
  seeds: number
  expectedGames?: string
  expectedRests?: string
}

const cases: readonly Case[] = [
  { players: 12, courts: 3, rounds: 3, seeds: 4 },
  {
    players: 13,
    courts: 3,
    rounds: 3,
    seeds: 4,
    expectedGames: "2-3",
    expectedRests: "0-1",
  },
  { players: 16, courts: 4, rounds: 3, seeds: 4 },
]

function roster(
  count: number,
  seeds: number,
): FairnessPlayer[] {
  return Array.from(
    { length: count },
    (_, i) => ({
      id: `P${i + 1}`,
      displayName: `Player ${i + 1}`,
      seed: i < seeds ? i + 1 : undefined,
    }),
  )
}

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(`FAILED: ${message}`)
  }
  console.log(`PASS: ${message}`)
}

for (const test of cases) {
  const players = roster(
    test.players,
    test.seeds,
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
  const m = analysis.metrics

  const games =
    `${m.minMatchesPerPlayer}-${m.maxMatchesPerPlayer}`
  const rests =
    `${m.minSitoutsPerPlayer}-${m.maxSitoutsPerPlayer}`

  console.log(
    `\n=== ${test.players}/${test.courts}/${test.rounds} ===`,
  )
  console.log(
    JSON.stringify(
      {
        rawPenalty: result.rawPenalty,
        score: analysis.score,
        games,
        rests,
        consecutiveSitouts:
          m.consecutiveSitouts,
        partnerRepeats:
          m.repeatedPartnerRelations,
        opponentRepeats:
          m.repeatedOpponentRelations,
        seedPairs:
          m.seededPartnerships,
        explored:
          result.exploredStates,
        elapsedMs:
          Date.now() - started,
      },
      null,
      2,
    ),
  )

  assert(
    m.repeatedPartnerRelations === 0,
    `${test.players}: no repeated partnerships`,
  )
  assert(
    m.seededPartnerships === 0,
    `${test.players}: no seeded partnerships`,
  )
  assert(
    m.consecutiveSitouts === 0,
    `${test.players}: no consecutive sit-outs`,
  )

  if (test.expectedGames) {
    assert(
      games === test.expectedGames,
      `${test.players}: games ${test.expectedGames}`,
    )
  }

  if (test.expectedRests) {
    assert(
      rests === test.expectedRests,
      `${test.players}: rests ${test.expectedRests}`,
    )
  }
}

console.log("\nB7 acceptance benchmark PASS")
