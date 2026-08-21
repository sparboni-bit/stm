"use server"

import {
  generateTemplateFamily,
  INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
  INDIVIDUAL_ROTATION_TEMPLATE_MAX_ROUNDS,
  listIndividualRotationTemplateCoverage,
  listValidTemplateFamilies,
  upsertIndividualRotationTemplates,
} from "../templates"

export type GenerateTemplateFamilyInput={
  playerCount:number
  usableCourtCount:number
  seedCount:number
  maxRounds?:number
}

export async function generateIndividualRotationTemplateFamilyAction(input:GenerateTemplateFamilyInput){
  const startedAt=Date.now()
  const maxRounds=input.maxRounds??INDIVIDUAL_ROTATION_TEMPLATE_MAX_ROUNDS
  const records=generateTemplateFamily({
    playerCount:input.playerCount,
    usableCourtCount:input.usableCourtCount,
    seedCount:input.seedCount,
    maxRounds,
    engineVersion:INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
  })
  await upsertIndividualRotationTemplates(records)
  return {
    family:{playerCount:input.playerCount,usableCourtCount:input.usableCourtCount,seedCount:input.seedCount},
    engineVersion:INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
    maxRounds,
    durationMs:Date.now()-startedAt,
    rows:records.map(r=>({
      roundCount:r.roundCount,fairnessScore:r.fairnessScore,rawPenalty:r.rawPenalty,
      theoreticalFloor:r.theoreticalFloor,partnerRepeats:r.metrics.repeatedPartnerRelations,
      opponentRepeats:r.metrics.repeatedOpponentRelations,
      consecutiveSitouts:r.metrics.consecutiveSitouts,seedPairs:r.metrics.seededPartnerships,
    })),
  }
}

export async function listIndividualRotationTemplateBatchFamiliesAction(input?:{minPlayers?:number;maxPlayers?:number}){
  return listValidTemplateFamilies(input)
}

export async function getIndividualRotationTemplateBatchStatusAction(input?:{
  minPlayers?:number
  maxPlayers?:number
  maxRounds?:number
}){
  const minPlayers=input?.minPlayers??4
  const maxPlayers=input?.maxPlayers??16
  const maxRounds=input?.maxRounds??INDIVIDUAL_ROTATION_TEMPLATE_MAX_ROUNDS
  const families=listValidTemplateFamilies({minPlayers,maxPlayers})
  const coverage=await listIndividualRotationTemplateCoverage({
    minPlayers,maxPlayers,engineVersion:INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
  })

  const roundMap=new Map<string,Set<number>>()
  for(const row of coverage){
    const key=`${row.player_count}-${row.usable_court_count}-${row.seed_count}`
    const set=roundMap.get(key)??new Set<number>()
    set.add(row.round_count)
    roundMap.set(key,set)
  }

  return families.map(f=>{
    const key=`${f.playerCount}-${f.usableCourtCount}-${f.seedCount}`
    const rounds=roundMap.get(key)??new Set<number>()
    const missingRounds=Array.from({length:maxRounds},(_,i)=>i+1).filter(r=>!rounds.has(r))
    return {...f,complete:missingRounds.length===0,storedRounds:rounds.size,missingRounds}
  })
}

export async function generateIndividualRotationTemplateTestAction(){
  const result=await generateIndividualRotationTemplateFamilyAction({
    playerCount:11,usableCourtCount:2,seedCount:0,maxRounds:8,
  })
  return result.rows
}
