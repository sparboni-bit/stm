"use server"

import { revalidatePath } from "next/cache"
import { saveBestOf3MatchResult } from "../repositories"

export type SaveBestOf3ResultActionInput = {
  competitionId: string
  stageId: string
  matchId: string
  sets: Array<{
    scoreA: number
    scoreB: number
  }>
}

export async function saveBestOf3ResultAction(
  input: SaveBestOf3ResultActionInput,
): Promise<void> {
  if (!input.competitionId.trim()) {
    throw new Error("Competition id is required.")
  }

  if (!input.stageId.trim()) {
    throw new Error("Stage id is required.")
  }

  await saveBestOf3MatchResult({
    matchId: input.matchId,
    sets: input.sets,
  })

  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}`,
  )

  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}/matches/${input.matchId}`,
  )
}
