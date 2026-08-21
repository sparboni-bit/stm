import {
  analyzeFairnessSchedule,
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

/**
 * GOOD:
 * - everyone plays exactly 3 matches;
 * - no sit-outs (8 players / 2 courts);
 * - every player has a different partner in every round;
 * - seeds P1 and P2 are never partners.
 */
const goodSchedule: FairnessSchedule = {
  rounds: [
    {
      roundNumber: 1,
      restingPlayerIds: [],
      matches: [
        {
          roundNumber: 1,
          courtNumber: 1,
          teamA: ["P1", "P3"],
          teamB: ["P2", "P4"],
        },
        {
          roundNumber: 1,
          courtNumber: 2,
          teamA: ["P5", "P7"],
          teamB: ["P6", "P8"],
        },
      ],
    },
    {
      roundNumber: 2,
      restingPlayerIds: [],
      matches: [
        {
          roundNumber: 2,
          courtNumber: 1,
          teamA: ["P1", "P5"],
          teamB: ["P2", "P6"],
        },
        {
          roundNumber: 2,
          courtNumber: 2,
          teamA: ["P3", "P7"],
          teamB: ["P4", "P8"],
        },
      ],
    },
    {
      roundNumber: 3,
      restingPlayerIds: [],
      matches: [
        {
          roundNumber: 3,
          courtNumber: 1,
          teamA: ["P1", "P7"],
          teamB: ["P2", "P8"],
        },
        {
          roundNumber: 3,
          courtNumber: 2,
          teamA: ["P3", "P5"],
          teamB: ["P4", "P6"],
        },
      ],
    },
  ],
}

/**
 * BAD:
 * - participation is still perfectly equal;
 * - P1/P2 are partners in every round;
 * - other partnerships are also repeated;
 * - opponents repeat heavily;
 * - the two seeds are always on the same team.
 *
 * This deliberately proves that equal participation alone is not
 * sufficient to call a schedule fair.
 */
const badSchedule: FairnessSchedule = {
  rounds: [
    {
      roundNumber: 1,
      restingPlayerIds: [],
      matches: [
        {
          roundNumber: 1,
          courtNumber: 1,
          teamA: ["P1", "P2"],
          teamB: ["P3", "P4"],
        },
        {
          roundNumber: 1,
          courtNumber: 2,
          teamA: ["P5", "P6"],
          teamB: ["P7", "P8"],
        },
      ],
    },
    {
      roundNumber: 2,
      restingPlayerIds: [],
      matches: [
        {
          roundNumber: 2,
          courtNumber: 1,
          teamA: ["P1", "P2"],
          teamB: ["P3", "P4"],
        },
        {
          roundNumber: 2,
          courtNumber: 2,
          teamA: ["P5", "P6"],
          teamB: ["P7", "P8"],
        },
      ],
    },
    {
      roundNumber: 3,
      restingPlayerIds: [],
      matches: [
        {
          roundNumber: 3,
          courtNumber: 1,
          teamA: ["P1", "P2"],
          teamB: ["P3", "P4"],
        },
        {
          roundNumber: 3,
          courtNumber: 2,
          teamA: ["P5", "P6"],
          teamB: ["P7", "P8"],
        },
      ],
    },
  ],
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

function printAnalysis(
  label: string,
  schedule: FairnessSchedule,
) {
  const analysis = analyzeFairnessSchedule(
    players,
    schedule,
  )

  console.log(`\n=== ${label} ===`)
  console.log(
    JSON.stringify(
      {
        score: analysis.score,
        grade: analysis.grade,
        penalties: analysis.penalties,
        metrics: {
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
        },
      },
      null,
      2,
    ),
  )

  return analysis
}

const good = printAnalysis(
  "GOOD SCHEDULE",
  goodSchedule,
)

const bad = printAnalysis(
  "BAD SCHEDULE",
  badSchedule,
)

console.log("\n=== ASSERTIONS ===")

assert(
  good.penalties.total < bad.penalties.total,
  "GOOD total penalty is lower than BAD",
)

assert(
  good.score > bad.score,
  "GOOD display score is higher than BAD",
)

assert(
  good.metrics.participationSpread === 0 &&
    bad.metrics.participationSpread === 0,
  "both schedules have identical perfect participation",
)

assert(
  good.metrics.repeatedPartnerRelations <
    bad.metrics.repeatedPartnerRelations,
  "GOOD has fewer repeated partner relations",
)

assert(
  good.metrics.repeatedOpponentRelations <
    bad.metrics.repeatedOpponentRelations,
  "GOOD has fewer repeated opponent relations",
)

assert(
  good.metrics.seededPartnerships === 0,
  "GOOD never puts the two seeds together",
)

assert(
  bad.metrics.seededPartnerships > 0,
  "BAD puts seeds together",
)

console.log(
  "\nFairness scorer comparison completed successfully.",
)
