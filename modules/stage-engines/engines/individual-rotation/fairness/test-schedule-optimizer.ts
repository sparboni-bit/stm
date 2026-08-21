import {
  analyzeFairnessSchedule,
  optimizeFairnessSchedule,
  type FairnessPlayer,
} from "./index"

const players: FairnessPlayer[] = [
  { id: "P1", displayName: "Player 1", seed: 1 },
  { id: "P2", displayName: "Player 2", seed: 2 },
  { id: "P3", displayName: "Player 3" },
  { id: "P4", displayName: "Player 4" },
  { id: "P5", displayName: "Player 5" },
  { id: "P6", displayName: "Player 6" },
  { id: "P7", displayName: "Player 7" },
  { id: "P8", displayName: "Player 8" },
]

const result = optimizeFairnessSchedule(
  players,
  {
    courtCount: 2,
    roundCount: 3,
    beamWidth: 40,
  },
)

const analysis = analyzeFairnessSchedule(
  players,
  result.schedule,
)

console.log("\n=== OPTIMIZED SCHEDULE ===")

for (const round of result.schedule.rounds) {
  console.log(`\nRound ${round.roundNumber}`)

  for (const match of round.matches) {
    console.log(
      `Court ${match.courtNumber}: ` +
        `${match.teamA.join(" + ")} vs ` +
        `${match.teamB.join(" + ")}`,
    )
  }

  if (round.restingPlayerIds.length > 0) {
    console.log(
      `Rest: ${round.restingPlayerIds.join(", ")}`,
    )
  }
}

console.log("\n=== ANALYSIS ===")
console.log(
  JSON.stringify(
    {
      rawPenalty: result.rawPenalty,
      exploredStates: result.exploredStates,
      score: analysis.score,
      grade: analysis.grade,
      participationSpread:
        analysis.metrics.participationSpread,
      sitoutSpread:
        analysis.metrics.sitoutSpread,
      consecutiveSitouts:
        analysis.metrics.consecutiveSitouts,
      repeatedPartnerRelations:
        analysis.metrics.repeatedPartnerRelations,
      repeatedOpponentRelations:
        analysis.metrics.repeatedOpponentRelations,
      maxPartnerCount:
        analysis.metrics.maxPartnerCount,
      maxOpponentCount:
        analysis.metrics.maxOpponentCount,
      seededPartnerships:
        analysis.metrics.seededPartnerships,
      penalties: analysis.penalties,
    },
    null,
    2,
  ),
)

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(`FAILED: ${message}`)
  }

  console.log(`PASS: ${message}`)
}

console.log("\n=== ASSERTIONS ===")

assert(
  result.schedule.rounds.length === 3,
  "three rounds generated",
)

assert(
  analysis.metrics.participationSpread === 0,
  "participation is perfectly equal",
)

assert(
  analysis.metrics.sitoutSpread === 0,
  "sit-outs are perfectly equal",
)

assert(
  analysis.metrics.repeatedPartnerRelations === 0,
  "no repeated partnerships",
)

assert(
  analysis.metrics.seededPartnerships === 0,
  "seeded players are never partners",
)

console.log("\nB2 Beam Search test PASS")
