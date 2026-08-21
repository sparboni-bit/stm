import {
  analyzeFairnessSchedule, calculateFairnessFloor, normalizedFairnessScore,
  optimizeFairnessSchedule, DEFAULT_FAIRNESS_WEIGHTS, type FairnessPlayer,
} from "./index"

type Scenario={players:number;courts:number;rounds:number;seeds:number;maxMs:number}
const scenarios:readonly Scenario[]=[
 {players:8,courts:2,rounds:3,seeds:2,maxMs:5000},{players:8,courts:2,rounds:5,seeds:2,maxMs:8000},
 {players:9,courts:2,rounds:3,seeds:2,maxMs:6000},{players:9,courts:2,rounds:5,seeds:2,maxMs:10000},
 {players:10,courts:2,rounds:3,seeds:2,maxMs:7000},{players:10,courts:2,rounds:5,seeds:2,maxMs:10000},
 {players:11,courts:2,rounds:3,seeds:4,maxMs:8000},{players:11,courts:2,rounds:5,seeds:4,maxMs:12000},
 {players:12,courts:2,rounds:3,seeds:4,maxMs:10000},{players:12,courts:3,rounds:3,seeds:4,maxMs:10000},
 {players:12,courts:3,rounds:5,seeds:4,maxMs:18000},
]
const roster=(n:number,s:number):FairnessPlayer[]=>Array.from({length:n},(_,i)=>({id:`P${i+1}`,displayName:`Player ${i+1}`,seed:i<s?i+1:undefined}))
const minSpread=(total:number,n:number)=>total%n===0?0:1
let hardFailures=0,warnings=0

console.log("players | courts | rounds | raw | floor | avoidable | score | games | rests | consecutive | partnerRep | opponentRep | maxPartner | maxOpponent | seedPairs | explored | time | status")

for(const x of scenarios){
 const players=roster(x.players,x.seeds)
 const usable=Math.min(x.courts,Math.floor(x.players/4)), active=usable*4
 const expectedGameSpread=minSpread(active*x.rounds,x.players)
 const expectedRestSpread=minSpread((x.players-active)*x.rounds,x.players)
 const floor=calculateFairnessFloor(players,x.courts,x.rounds,DEFAULT_FAIRNESS_WEIGHTS.participationSpread,DEFAULT_FAIRNESS_WEIGHTS.sitoutSpread)
 const started=Date.now()
 try{
  const r=optimizeFairnessSchedule(players,{courtCount:x.courts,roundCount:x.rounds,beamWidth:40,localCandidateWidth:80,guidedCandidateWidth:240,activeSetWidth:24,partialBeamWidth:120})
  const a=analyzeFairnessSchedule(players,r.schedule),m=a.metrics,ms=Date.now()-started
  const gs=m.maxMatchesPerPlayer-m.minMatchesPerPlayer, rs=m.maxSitoutsPerPlayer-m.minSitoutsPerPlayer
  const failures:string[]=[]
  if(gs!==expectedGameSpread)failures.push(`gameSpread=${gs},min=${expectedGameSpread}`)
  if(rs!==expectedRestSpread)failures.push(`restSpread=${rs},min=${expectedRestSpread}`)
  if(m.consecutiveSitouts!==0)failures.push(`consecutive=${m.consecutiveSitouts}`)
  if(m.repeatedPartnerRelations!==0)failures.push(`partnerRep=${m.repeatedPartnerRelations}`)
  if(m.seededPartnerships!==0)failures.push(`seedPairs=${m.seededPartnerships}`)
  hardFailures+=failures.length
  const warn:string[]=[]
  if(m.maxOpponentCount>2)warn.push(`maxOpponent=${m.maxOpponentCount}`)
  if(ms>x.maxMs)warn.push(`slow>${x.maxMs}ms`)
  if(x.players===10&&x.courts===2&&x.rounds===5&&r.rawPenalty>400)warn.push(`known-best-raw=400,current=${r.rawPenalty}`)
  warnings+=warn.length
  const status=failures.length?`FAIL:${failures.join(",")}`:warn.length?`PASS/WARN:${warn.join(",")}`:"PASS"
  console.log([x.players,x.courts,x.rounds,r.rawPenalty,floor.total,Math.max(0,r.rawPenalty-floor.total),normalizedFairnessScore(r.rawPenalty,floor.total),`${m.minMatchesPerPlayer}-${m.maxMatchesPerPlayer}`,`${m.minSitoutsPerPlayer}-${m.maxSitoutsPerPlayer}`,m.consecutiveSitouts,m.repeatedPartnerRelations,m.repeatedOpponentRelations,m.maxPartnerCount,m.maxOpponentCount,m.seededPartnerships,r.exploredStates,`${ms}ms`,status].join(" | "))
 }catch(e){hardFailures++;console.error(`${x.players}/${x.courts}/${x.rounds} ERROR: ${e instanceof Error?e.message:String(e)}`)}
}
console.log("\n=== B9 PRODUCTION GATE ===")
console.log(`hard failures: ${hardFailures}`)
console.log(`warnings: ${warnings}`)
if(hardFailures)throw new Error(`B9 FAILED with ${hardFailures} hard failure(s)`)
console.log("B9 HARD ACCEPTANCE PASS — fairness engine is eligible for v1.0 freeze.")
