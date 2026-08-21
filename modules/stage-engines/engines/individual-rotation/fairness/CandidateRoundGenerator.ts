import { FairnessState } from "./FairnessState"
import type { FairnessMatch, FairnessPlayer, FairnessRound } from "./types"

export type CandidateRoundGeneratorOptions = {
  roundNumber:number
  courtCount:number
  maxCandidates?:number
  history?:readonly FairnessRound[]
  activeSetWidth?:number
  guidedCandidateWidth?:number
}

type RankedRound={round:FairnessRound; score:number; key:string}

export function generateCandidateRounds(players:readonly FairnessPlayer[], options:CandidateRoundGeneratorOptions):FairnessRound[] {
  const {roundNumber,courtCount,maxCandidates=20000,history=[],guidedCandidateWidth=600}=options
  if(roundNumber<1) throw new Error("roundNumber must be >= 1")
  if(courtCount<1) throw new Error("courtCount must be >= 1")
  const courts=Math.min(courtCount,Math.floor(players.length/4))
  if(courts<1) return []
  const activeCount=courts*4
  const ids=players.map(p=>p.id)
  if(new Set(ids).size!==ids.length) throw new Error("Fairness players must have unique ids")

  const state=new FairnessState(players); state.applySchedule(history)
  const byId=new Map(players.map(p=>[p.id,p]))
  const ranked:RankedRound[]=[]
  let generated=0

  for(const activeIds of combinations(ids,activeCount)){
    const active=new Set(activeIds)
    const resting=ids.filter(id=>!active.has(id))
    const restScore=restHeuristic(activeIds,resting,state)

    for(const matches of partitionIntoMatches(activeIds,roundNumber)){
      if(++generated>maxCandidates) break
      const round:FairnessRound={
        roundNumber,
        matches:matches.map((m,i)=>({...m,courtNumber:i+1})),
        restingPlayerIds:resting,
      }
      const key=roundKey(round)
      const score=restScore+matches.reduce((s,m)=>s+matchHeuristic(m,state,byId),0)
      insertBounded(ranked,{round,score,key},guidedCandidateWidth)
    }
    if(generated>maxCandidates) break
  }
  return ranked.map(x=>x.round)
}

function restHeuristic(active:readonly string[], resting:readonly string[], state:FairnessState):number{
  const played=state.getPlayerIds().map(id=>state.getPlayed(id)+(active.includes(id)?1:0))
  const rested=state.getPlayerIds().map(id=>state.getRested(id)+(resting.includes(id)?1:0))
  return spread(played)*100000+spread(rested)*50000
}

function matchHeuristic(match:FairnessMatch,state:FairnessState,byId:ReadonlyMap<string,FairnessPlayer>):number{
  const [a1,a2]=match.teamA,[b1,b2]=match.teamB
  let p=0
  p+=repeat(state.getPartnerCount(a1,a2))*10000
  p+=repeat(state.getPartnerCount(b1,b2))*10000
  for(const [a,b] of [[a1,b1],[a1,b2],[a2,b1],[a2,b2]] as const) p+=repeat(state.getOpponentCount(a,b))*1000
  if(seeded(byId.get(a1))&&seeded(byId.get(a2))) p+=15000
  if(seeded(byId.get(b1))&&seeded(byId.get(b2))) p+=15000
  return p
}
function repeat(n:number){return n<=0?0:n*n}
function seeded(p:FairnessPlayer|undefined){return !!p?.seed&&p.seed>0}
function spread(v:readonly number[]){return v.length?Math.max(...v)-Math.min(...v):0}

function* combinations(values:readonly string[],size:number,start=0,prefix:string[]=[]):Generator<string[]>{
  if(prefix.length===size){yield [...prefix];return}
  const remaining=size-prefix.length
  for(let i=start;i<=values.length-remaining;i++){prefix.push(values[i]);yield* combinations(values,size,i+1,prefix);prefix.pop()}
}
function* partitionIntoMatches(ids:readonly string[],roundNumber:number):Generator<FairnessMatch[]>{
  if(ids.length===0){yield [];return}
  const first=ids[0],rest=ids.slice(1)
  for(const trio of combinations(rest,3)){
    const group=[first,...trio], remaining=rest.filter(id=>!trio.includes(id))
    for(const split of teamSplits(group)){
      const match:FairnessMatch={roundNumber,teamA:split.teamA,teamB:split.teamB}
      for(const tail of partitionIntoMatches(remaining,roundNumber)) yield [match,...tail]
    }
  }
}
function teamSplits(g:readonly string[]){
  const [a,b,c,d]=g
  return [
    {teamA:[a,b] as const,teamB:[c,d] as const},
    {teamA:[a,c] as const,teamB:[b,d] as const},
    {teamA:[a,d] as const,teamB:[b,c] as const},
  ]
}
function roundKey(r:FairnessRound){
  return r.matches.map(m=>[
    [...m.teamA].sort().join("+"),
    [...m.teamB].sort().join("+")
  ].sort().join("v")).sort().join("|")+"::R:"+[...r.restingPlayerIds].sort().join(",")
}
function insertBounded(list:RankedRound[],x:RankedRound,max:number){
  let lo=0,hi=list.length
  while(lo<hi){const mid=(lo+hi)>>1; const c=x.score-list[mid].score||x.key.localeCompare(list[mid].key); if(c<0)hi=mid;else lo=mid+1}
  if(lo>=max)return
  list.splice(lo,0,x); if(list.length>max)list.pop()
}
