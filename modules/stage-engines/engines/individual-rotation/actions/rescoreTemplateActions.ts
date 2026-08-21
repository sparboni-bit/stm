"use server"

import { createClient } from "@/lib/supabase/server"
import {
  calculateFairnessFloor,
  DEFAULT_FAIRNESS_WEIGHTS,
  normalizedFairnessScore,
  type FairnessPlayer,
} from "../fairness"

type TemplateRow={
  id:string
  player_count:number
  usable_court_count:number
  seed_count:number
  round_count:number
  raw_penalty:number
}

function canonicalPlayers(n:number,seeds:number):FairnessPlayer[]{
  return Array.from({length:n},(_,i)=>({
    id:`P${String(i+1).padStart(2,"0")}`,
    displayName:`Player ${String(i+1).padStart(2,"0")}`,
    seed:i<seeds?i+1:null,
  }))
}

export async function rescoreIndividualRotationTemplatesAction(input?:{
  minPlayers?:number
  maxPlayers?:number
}){
  const minPlayers=input?.minPlayers??4
  const maxPlayers=input?.maxPlayers??16
  const supabase=await createClient()

  const {data,error}=await supabase
    .from("individual_rotation_templates")
    .select("id,player_count,usable_court_count,seed_count,round_count,raw_penalty")
    .gte("player_count",minPlayers)
    .lte("player_count",maxPlayers)

  if(error)throw new Error(error.message)
  const rows=(data??[]) as TemplateRow[]

  for(const row of rows){
    const floor=calculateFairnessFloor(
      canonicalPlayers(row.player_count,row.seed_count),
      row.usable_court_count,row.round_count,
      DEFAULT_FAIRNESS_WEIGHTS.participationSpread,
      DEFAULT_FAIRNESS_WEIGHTS.sitoutSpread,
      DEFAULT_FAIRNESS_WEIGHTS.consecutiveSitout,
    )
    const fairnessScore=normalizedFairnessScore(row.raw_penalty,floor.total)
    const {error:updateError}=await supabase
      .from("individual_rotation_templates")
      .update({theoretical_floor:floor.total,fairness_score:fairnessScore})
      .eq("id",row.id)
    if(updateError)throw new Error(`Rescore failed for ${row.id}: ${updateError.message}`)
  }
  return {updated:rows.length,minPlayers,maxPlayers}
}
