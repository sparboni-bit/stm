import {
  analyzeFairnessSchedule,
  generateCandidateRounds,
  scoreFairnessSchedule,
  type FairnessPlayer,
  type FairnessSchedule,
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

const candidates = generateCandidateRounds(
  players,
  {
    roundNumber: 1,
    courtCount: 2,
  },
)

console.log(
  `Generated complete round candidates: ${candidates.length}`,
)

if (candidates.length === 0) {
  throw new Error("No candidate rounds generated")
}

const ranked = candidates
  .map((round) => {
    const schedule: FairnessSchedule = {
      rounds: [round],
    }

    return {
      round,
      penalty:
        scoreFairnessSchedule(
          players,
          schedule,
        ).total,
    }
  })
  .sort((a, b) => a.penalty - b.penalty)

const best = ranked[0]
const bestSchedule: FairnessSchedule = {
  rounds: [best.round],
}

const analysis = analyzeFairnessSchedule(
  players,
  bestSchedule,
)

console.log("\n=== BEST ROUND ===")
console.log(
  JSON.stringify(best.round, null, 2),
)

console.log("\n=== ANALYSIS ===")
console.log(
  JSON.stringify(
    {
      rawPenalty: best.penalty,
      score: analysis.score,
      seededPartnerships:
        analysis.metrics.seededPartnerships,
      repeatedPartnerRelations:
        analysis.metrics.repeatedPartnerRelations,
      repeatedOpponentRelations:
        analysis.metrics.repeatedOpponentRelations,
      participationSpread:
        analysis.metrics.participationSpread,
    },
    null,
    2,
  ),
)

if (analysis.metrics.participationSpread !== 0) {
  throw new Error(
    "Expected perfect participation for 8 players / 2 courts",
  )
}

if (analysis.metrics.seededPartnerships !== 0) {
  throw new Error(
    "Best first-round candidate should separate the seeds",
  )
}

if (
  analysis.metrics.repeatedPartnerRelations !== 0
) {
  throw new Error(
    "A single round cannot contain repeated partnerships",
  )
}

console.log("\nB1 candidate round test PASS")
