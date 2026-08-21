import { analyzeFairnessSchedule,optimizeFairnessSchedule,type FairnessPlayer } from "./index"
const players:FairnessPlayer[]=Array.from({length:10},(_,i)=>({id:`P${i+1}`,displayName:`Player ${i+1}`,seed:i<2?i+1:undefined}))
const started=Date.now()
const result=optimizeFairnessSchedule(players,{courtCount:2,roundCount:5,beamWidth:40,localCandidateWidth:100,guidedCandidateWidth:600,candidateLimitPerStep:20000})
const a=analyzeFairnessSchedule(players,result.schedule),m=a.metrics
console.log(JSON.stringify({rawPenalty:result.rawPenalty,score:a.score,games:`${m.minMatchesPerPlayer}-${m.maxMatchesPerPlayer}`,rests:`${m.minSitoutsPerPlayer}-${m.maxSitoutsPerPlayer}`,consecutiveSitouts:m.consecutiveSitouts,partnerRepeats:m.repeatedPartnerRelations,opponentRepeats:m.repeatedOpponentRelations,seedPairs:m.seededPartnerships,explored:result.exploredStates,selected:result.locallySelectedStates,elapsedMs:Date.now()-started},null,2))
function ok(c:boolean,s:string){if(!c)throw new Error("FAILED: "+s);console.log("PASS: "+s)}
ok(result.rawPenalty===400,"raw penalty = B4 baseline 400")
ok(m.repeatedPartnerRelations===0,"no repeated partnerships")
ok(m.seededPartnerships===0,"no seeded partnerships")
ok(m.consecutiveSitouts===0,"no consecutive sit-outs")
ok(m.minMatchesPerPlayer===4&&m.maxMatchesPerPlayer===4,"all players play 4")
ok(m.minSitoutsPerPlayer===1&&m.maxSitoutsPerPlayer===1,"all players rest once")
console.log("B5 guided candidate benchmark PASS")
