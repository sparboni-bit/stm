import { createClient } from "@/lib/supabase/server"

import { BracketLoader } from "../loaders"

import type { BracketTree } from "../domain"

export async function loadEliminationBracket(
  stageId: string,
): Promise<BracketTree> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("stage_id", stageId)
    .order("round_number")
    .order("match_order")

  if (error) {
    throw new Error(error.message)
  }

  return BracketLoader.load(data ?? [])
}