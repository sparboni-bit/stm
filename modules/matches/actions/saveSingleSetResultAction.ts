"use server"

import { revalidatePath } from "next/cache"
import { saveSingleSetMatchResult } from "../repositories"

export type SaveSingleSetResultActionInput = {
  competitionId: string
  stageId: string
  matchId: string
  scoreA: number
  scoreB: number
}

export async function saveSingleSetResultAction(
  input: SaveSingleSetResultActionInput,
): Promise<void> {
  if (!input.competitionId.trim()) throw new Error("Competition id is required.")
  if (!input.stageId.trim()) throw new Error("Stage id is required.")

  await saveSingleSetMatchResult({
    matchId: input.matchId,
    scoreA: input.scoreA,
    scoreB: input.scoreB,
  })

  revalidatePath(`/competitions/${input.competitionId}/stages/${input.stageId}`)
  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}/matches/${input.matchId}`,
  )
}
