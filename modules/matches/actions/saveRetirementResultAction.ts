"use server"

import { revalidatePath } from "next/cache"

import { saveRetirementMatchResult } from "../repositories"
import type { MatchSide } from "../types"

export type SaveRetirementResultActionInput = {
  competitionId: string
  stageId: string
  matchId: string
  retiredSide: MatchSide
  scoreFormat: "single_set" | "best_of_3"
  sets: Array<{
    scoreA: number
    scoreB: number
  }>
}

export async function saveRetirementResultAction(
  input: SaveRetirementResultActionInput,
): Promise<void> {
  if (!input.competitionId.trim()) {
    throw new Error(
      "Competition id is required.",
    )
  }

  if (!input.stageId.trim()) {
    throw new Error(
      "Stage id is required.",
    )
  }

  await saveRetirementMatchResult({
    matchId: input.matchId,
    retiredSide: input.retiredSide,
    scoreFormat: input.scoreFormat,
    sets: input.sets,
  })

  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}`,
  )

  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}/matches/${input.matchId}`,
  )
}
