import { analyzeFairnessSchedule, optimizeFairnessSchedule, type FairnessPlayer } from "./index"

type Scenario = { name:string; playerCount:number; courtCount:number; roundCounts:readonly number[]; seedCount:number }

const scenarios: readonly Scenario[] = [
  { name:"8 players / 2 courts", playerCount:8, courtCount:2, roundCounts:[3,4,5,6,7], seedCount:2 },
  { name:"9 players / 2 courts", playerCount:9, courtCount:2, roundCounts:[3,4,5,6], seedCount:2 },
  { name:"10 players / 2 courts", playerCount:10, courtCount:2, roundCounts:[3,4,5,6], seedCount:2 },
]

function createPlayers(count:number, seedCount:number): FairnessPlayer[] {
  return Array.from({length:count},(_,i)=>({
    id:`P${i+1}`, displayName:`Player ${i+1}`, seed:i<seedCount ? i+1 : undefined,
  }))
}

for (const scenario of scenarios) {
  const players=createPlayers(scenario.playerCount,scenario.seedCount)
  console.log(`\n=== ${scenario.name} ===`)
  console.log("rounds | raw | score | games | rests | consecutive | partnerRep | opponentRep | maxPartner | maxOpponent | seedPairs | states | time")

  for (const roundCount of scenario.roundCounts) {
    const started=Date.now()
    const result=optimizeFairnessSchedule(players,{
      courtCount:scenario.courtCount, roundCount, beamWidth:40, candidateLimitPerStep:20_000,
    })
    const analysis=analyzeFairnessSchedule(players,result.schedule)
    const m=analysis.metrics
    console.log([
      roundCount,result.rawPenalty,analysis.score,
      `${m.minMatchesPerPlayer}-${m.maxMatchesPerPlayer}`,
      `${m.minSitoutsPerPlayer}-${m.maxSitoutsPerPlayer}`,
      m.consecutiveSitouts,m.repeatedPartnerRelations,m.repeatedOpponentRelations,
      m.maxPartnerCount,m.maxOpponentCount,m.seededPartnerships,
      result.exploredStates,`${Date.now()-started}ms`,
    ].join(" | "))
  }
}

console.log("\nB3 fairness curve benchmark completed.")
