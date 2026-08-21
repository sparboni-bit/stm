import {
  analyzeFairnessSchedule,
  optimizeFairnessSchedule,
  type FairnessPlayer,
} from "./index"

type Expected = {
  playerCount: number
  courtCount: number
  roundCount: number
  referencePenalty: number
  maxPartnerRepeats: number
  maxSeedPairs: number
  maxConsecutiveSitouts: number
}

const cases: readonly Expected[] = [
  {
    playerCount: 8,
    courtCount: 2,
    roundCount: 3,
    referencePenalty: 0,
    maxPartnerRepeats: 0,
    maxSeedPairs: 0,
    maxConsecutiveSitouts: 0,
  },
  {
    playerCount: 8,
    courtCount: 2,
    roundCount: 4,
    referencePenalty: 800,
    maxPartnerRepeats: 0,
    maxSeedPairs: 0,
    maxConsecutiveSitouts: 0,
  },
  {
    playerCount: 8,
    courtCount: 2,
    roundCount: 5,
    referencePenalty: 2400,
    maxPartnerRepeats: 0,
    maxSeedPairs: 0,
    maxConsecutiveSitouts: 0,
  },
  {
    playerCount: 9,
    courtCount: 2,
    roundCount: 5,
    referencePenalty: 19200,
    maxPartnerRepeats: 0,
    maxSeedPairs: 0,
    maxConsecutiveSitouts: 0,
  },
  {
    playerCount: 10,
    courtCount: 2,
    roundCount: 5,
    referencePenalty: 400,
    maxPartnerRepeats: 0,
    maxSeedPairs: 0,
    maxConsecutiveSitouts: 0,
  },
]

function players(
  count: number,
): FairnessPlayer[] {
  return Array.from(
    { length: count },
    (_, i) => ({
      id: `P${i + 1}`,
      displayName: `Player ${i + 1}`,
      seed: i < 2 ? i + 1 : undefined,
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
}

console.log(
  "players | rounds | raw | ref | partnerRep | opponentRep | consecutive | seedPairs | explored | selected | time",
)

for (const test of cases) {
  const roster = players(test.playerCount)
  const started = Date.now()

  const result = optimizeFairnessSchedule(
    roster,
    {
      courtCount: test.courtCount,
      roundCount: test.roundCount,
      beamWidth: 40,
      localCandidateWidth: 100,
      candidateLimitPerStep: 20_000,
    },
  )

  const analysis =
    analyzeFairnessSchedule(
      roster,
      result.schedule,
    )

  const m = analysis.metrics
  const elapsed = Date.now() - started

  console.log(
    [
      test.playerCount,
      test.roundCount,
      result.rawPenalty,
      test.referencePenalty,
      m.repeatedPartnerRelations,
      m.repeatedOpponentRelations,
      m.consecutiveSitouts,
      m.seededPartnerships,
      result.exploredStates,
      result.locallySelectedStates,
      `${elapsed}ms`,
    ].join(" | "),
  )

  assert(
    m.repeatedPartnerRelations <=
      test.maxPartnerRepeats,
    `${test.playerCount}/${test.roundCount}: partner repeats`,
  )

  assert(
    m.seededPartnerships <=
      test.maxSeedPairs,
    `${test.playerCount}/${test.roundCount}: seed partnerships`,
  )

  assert(
    m.consecutiveSitouts <=
      test.maxConsecutiveSitouts,
    `${test.playerCount}/${test.roundCount}: consecutive sit-outs`,
  )

  // We permit a small search-quality tolerance in B4.
  // The important invariant is that hard/very-high-priority
  // fairness dimensions do not regress.
  const tolerance =
    Math.max(
      400,
      test.referencePenalty * 0.05,
    )

  assert(
    result.rawPenalty <=
      test.referencePenalty + tolerance,
    `${test.playerCount}/${test.roundCount}: penalty remains close to B3 reference`,
  )
}

console.log(
  "\nB4 scalable beam benchmark PASS",
)
