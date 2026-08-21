import {
  analyzeFairnessSchedule,
  optimizeFairnessSchedule,
  type FairnessPlayer,
} from "./index"

type Scenario = {
  players: number
  courts: number
  rounds: readonly number[]
  seeds: number
}

const scenarios: readonly Scenario[] = [
  { players: 12, courts: 3, rounds: [3, 4, 5, 6], seeds: 4 },
  { players: 13, courts: 3, rounds: [3, 4, 5, 6], seeds: 4 },
  { players: 16, courts: 4, rounds: [3, 4, 5, 6], seeds: 4 },
]

function createPlayers(
  count: number,
  seedCount: number,
): FairnessPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `P${i + 1}`,
    displayName: `Player ${i + 1}`,
    seed: i < seedCount ? i + 1 : undefined,
  }))
}

console.log(
  "players | courts | rounds | raw | score | games | rests | consecutive | partnerRep | opponentRep | maxPartner | maxOpponent | seedPairs | explored | selected | time",
)

for (const scenario of scenarios) {
  const players = createPlayers(
    scenario.players,
    scenario.seeds,
  )

  console.log(
    `\n=== ${scenario.players} players / ${scenario.courts} courts / ${scenario.seeds} seeds ===`,
  )

  for (const roundCount of scenario.rounds) {
    const started = Date.now()

    try {
      const result = optimizeFairnessSchedule(
        players,
        {
          courtCount: scenario.courts,
          roundCount,
          beamWidth: 40,
          localCandidateWidth: 100,
          guidedCandidateWidth: 600,
          activeSetWidth: 160,
          candidateLimitPerStep: 20_000,
        },
      )

      const analysis = analyzeFairnessSchedule(
        players,
        result.schedule,
      )

      const m = analysis.metrics
      const elapsed = Date.now() - started

      console.log(
        [
          scenario.players,
          scenario.courts,
          roundCount,
          result.rawPenalty,
          analysis.score,
          `${m.minMatchesPerPlayer}-${m.maxMatchesPerPlayer}`,
          `${m.minSitoutsPerPlayer}-${m.maxSitoutsPerPlayer}`,
          m.consecutiveSitouts,
          m.repeatedPartnerRelations,
          m.repeatedOpponentRelations,
          m.maxPartnerCount,
          m.maxOpponentCount,
          m.seededPartnerships,
          result.exploredStates,
          result.locallySelectedStates,
          `${elapsed}ms`,
        ].join(" | "),
      )
    } catch (error) {
      console.error(
        [
          scenario.players,
          scenario.courts,
          roundCount,
          "ERROR",
          error instanceof Error
            ? error.message
            : String(error),
        ].join(" | "),
      )
    }
  }
}

console.log("\nB6 scalability benchmark completed.")
