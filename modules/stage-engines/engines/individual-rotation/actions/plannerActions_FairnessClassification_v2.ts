"use server"

import { revalidatePath } from "next/cache"

import { listCompetitionEntries } from "../../../../competition-entries/repositories/competition-entry.repository"
import { listCompetitionStageEntries } from "../../../../competition-stage-entries/repositories/competition-stage-entry.repository"
import {
  getCompetitionStage,
  updateCompetitionStageSettings,
} from "../../../../competition-stages/repositories/competition-stage.repository"

import {
  analyzeFairnessSchedule,
  calculateFairnessFloor,
  DEFAULT_FAIRNESS_WEIGHTS,
  normalizedFairnessScore,
  optimizeFairnessSchedule,
  type FairnessPlayer,
} from "../fairness"

export type IndividualRotationPlannerSettingsInput = {
  courtCount: number
  availableMinutes: number
  matchDurationMinutes: number
  rotationMinutes: number
  requestedRounds: number | null
}

export type IndividualRotationPlannerSummary = {
  playerCount: number
  seedCount: number
}

export type IndividualRotationProposal = {
  kind: "minimum_fair" | "recommended" | "maximum_play"
  rounds: number
  normalizedScore: number
  rawPenalty: number
  theoreticalFloor: number
  avoidablePenalty: number
  minGames: number
  maxGames: number
  minRests: number
  maxRests: number
  partnerRepeats: number
  opponentRepeats: number
  consecutiveSitouts: number
  seedPairs: number
  maxPartnerCount: number
  maxOpponentCount: number
}

export type IndividualRotationPlannerProposals = {
  playerCount: number
  seedCount: number
  courtsUsed: number
  maxRoundsByTime: number
  evaluatedRounds: number[]
  proposals: IndividualRotationProposal[]
  curve: IndividualRotationProposal[]
}

function integer(value:number,label:string,min:number,max:number){
  if(!Number.isInteger(value)||value<min||value>max) throw new Error(`${label} must be an integer between ${min} and ${max}.`)
  return value
}

async function requireIndividualRotationStage(stageId:string){
  const id=stageId.trim()
  if(!id) throw new Error("Stage id is required.")
  const stage=await getCompetitionStage(id)
  if(!stage) throw new Error("Competition Stage not found.")
  if(stage.stageType!=="individual_rotation") throw new Error("This action is only available for Individual Rotation.")
  return stage
}

export async function saveIndividualRotationPlannerSettingsAction(stageId:string,input:IndividualRotationPlannerSettingsInput){
  const stage=await requireIndividualRotationStage(stageId)
  const courtCount=integer(input.courtCount,"Court count",1,32)
  const availableMinutes=integer(input.availableMinutes,"Available minutes",1,1440)
  const matchDurationMinutes=integer(input.matchDurationMinutes,"Match duration",1,240)
  const rotationMinutes=integer(input.rotationMinutes,"Rotation minutes",0,60)
  const requestedRounds=input.requestedRounds===null?null:integer(input.requestedRounds,"Requested rounds",1,100)
  const roundDurationMinutes=matchDurationMinutes+rotationMinutes
  const maxRoundsByTime=Math.floor(availableMinutes/roundDurationMinutes)
  if(maxRoundsByTime<1) throw new Error("The available time is not enough to complete one round.")
  if(requestedRounds!==null&&requestedRounds>maxRoundsByTime) throw new Error(`Requested rounds exceed the time limit. Maximum: ${maxRoundsByTime}.`)
  const updated=await updateCompetitionStageSettings(stage.id,{courtCount,availableMinutes,matchDurationMinutes,rotationMinutes,requestedRounds,planner:{maxRoundsByTime,roundDurationMinutes}})
  revalidatePath(`/competitions/${stage.competitionId}/stages/${stage.id}`)
  revalidatePath(`/competitions/${stage.competitionId}`)
  return updated
}

async function loadPlayers(stageId:string,competitionId:string):Promise<FairnessPlayer[]>{
  const [stageEntries,competitionEntries]=await Promise.all([
    listCompetitionStageEntries(stageId),
    listCompetitionEntries(competitionId),
  ])
  const names=new Map(competitionEntries.map(e=>[e.id,e.display_name]))
  return stageEntries
    .filter(e=>e.status==="active")
    .map(e=>({
      id:e.competition_entry_id,
      displayName:names.get(e.competition_entry_id)??"Player",
      seed:typeof e.seed==="number"&&e.seed>0?e.seed:null,
    }))
}

export async function getIndividualRotationPlannerSummaryAction(stageId:string):Promise<IndividualRotationPlannerSummary>{
  const stage=await requireIndividualRotationStage(stageId)
  const players=await loadPlayers(stage.id,stage.competitionId)
  return {playerCount:players.length,seedCount:players.filter(p=>p.seed!=null).length}
}

function classify(rounds:number,score:number,metrics:ReturnType<typeof analyzeFairnessSchedule>["metrics"]):IndividualRotationProposal{
  const floor=0 // replaced by caller
  return {
    kind:"recommended",rounds,normalizedScore:score,rawPenalty:0,theoreticalFloor:floor,avoidablePenalty:0,
    minGames:metrics.minMatchesPerPlayer,maxGames:metrics.maxMatchesPerPlayer,
    minRests:metrics.minSitoutsPerPlayer,maxRests:metrics.maxSitoutsPerPlayer,
    partnerRepeats:metrics.repeatedPartnerRelations,opponentRepeats:metrics.repeatedOpponentRelations,
    consecutiveSitouts:metrics.consecutiveSitouts,seedPairs:metrics.seededPartnerships,
    maxPartnerCount:metrics.maxPartnerCount,maxOpponentCount:metrics.maxOpponentCount,
  }
}

export async function calculateIndividualRotationPlannerProposalsAction(
  stageId:string,
  input:IndividualRotationPlannerSettingsInput,
):Promise<IndividualRotationPlannerProposals>{
  const stage=await requireIndividualRotationStage(stageId)
  const players=await loadPlayers(stage.id,stage.competitionId)
  if(players.length<4) throw new Error("Assign at least 4 active players before calculating proposals.")
  if(players.length>12) throw new Error("Planner proposals are optimized for a maximum of 12 players per Stage.")

  const requestedCourts=integer(input.courtCount,"Court count",1,32)
  const available=integer(input.availableMinutes,"Available minutes",1,1440)
  const matchMinutes=integer(input.matchDurationMinutes,"Match duration",1,240)
  const rotation=integer(input.rotationMinutes,"Rotation minutes",0,60)
  const courtsUsed=Math.min(requestedCourts,Math.floor(players.length/4))
  const maxRoundsByTime=Math.floor(available/(matchMinutes+rotation))
  if(courtsUsed<1||maxRoundsByTime<1) throw new Error("The current configuration cannot produce a playable round.")

  // Product guard: proposals beyond 7 rounds add computation while normally
  // representing Maximum Play rather than the fairness sweet spot.
  // We always include maxRoundsByTime separately, even when it is > 7.
  const roundSet=new Set<number>()
  for(let r=1;r<=Math.min(maxRoundsByTime,7);r++) roundSet.add(r)
  roundSet.add(maxRoundsByTime)
  const evaluatedRounds=[...roundSet].sort((a,b)=>a-b)

  const results:IndividualRotationProposal[]=[]
  for(const rounds of evaluatedRounds){
    const optimized=optimizeFairnessSchedule(players,{
      courtCount:courtsUsed,roundCount:rounds,beamWidth:40,localCandidateWidth:80,
      guidedCandidateWidth:240,activeSetWidth:24,partialBeamWidth:120,
    })
    const analysis=analyzeFairnessSchedule(players,optimized.schedule)
    const floor=calculateFairnessFloor(
      players,courtsUsed,rounds,
      DEFAULT_FAIRNESS_WEIGHTS.participationSpread,
      DEFAULT_FAIRNESS_WEIGHTS.sitoutSpread,
      DEFAULT_FAIRNESS_WEIGHTS.consecutiveSitout,
    )
    const p=classify(rounds,normalizedFairnessScore(optimized.rawPenalty,floor.total),analysis.metrics)
    p.rawPenalty=optimized.rawPenalty
    p.theoreticalFloor=floor.total
    p.avoidablePenalty=Math.max(0,optimized.rawPenalty-floor.total)
    results.push(p)
  }

  const hardClean=(p:IndividualRotationProposal)=>{
    const floor=calculateFairnessFloor(
      players,courtsUsed,p.rounds,
      DEFAULT_FAIRNESS_WEIGHTS.participationSpread,
      DEFAULT_FAIRNESS_WEIGHTS.sitoutSpread,
      DEFAULT_FAIRNESS_WEIGHTS.consecutiveSitout,
    )

    return (
      p.partnerRepeats===0 &&
      p.seedPairs===0 &&
      p.consecutiveSitouts<=floor.consecutiveSitouts
    )
  }

  // Minimum Fair: smallest meaningful schedule with the hard fairness rules
  // satisfied. Prefer >=3 rounds so "minimum" still represents rotation.
  const minimumFair=
    results.find(p=>p.rounds>=3&&hardClean(p)) ??
    results.find(hardClean) ??
    results[0]

  // Recommended: among hard-clean schedules, maximize useful play while
  // retaining high normalized fairness. 90+ is the production-quality band.
  const recommendedPool=results.filter(p=>hardClean(p)&&p.normalizedScore>=90)
  const recommended=
    [...recommendedPool].sort((a,b)=>b.rounds-a.rounds||b.normalizedScore-a.normalizedScore)[0] ??
    [...results].sort((a,b)=>b.normalizedScore-a.normalizedScore||b.rounds-a.rounds)[0]

  const maximumPlay=results.find(p=>p.rounds===maxRoundsByTime) ?? results.at(-1)!

  return {
    playerCount:players.length,
    seedCount:players.filter(p=>p.seed!=null).length,
    courtsUsed,maxRoundsByTime,evaluatedRounds,
    proposals:[
      {...minimumFair,kind:"minimum_fair"},
      {...recommended,kind:"recommended"},
      {...maximumPlay,kind:"maximum_play"},
    ],
    curve: results,
  }
}
