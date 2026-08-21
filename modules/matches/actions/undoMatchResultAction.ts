"use server"

import { revalidatePath } from "next/cache"

import { undoMatchResult } from "../repositories/match.repository"

export async function undoMatchResultAction(input: {
  competitionId: string
  stageId: string
  matchId: string
}): Promise<void> {
  await undoMatchResult(input.matchId)

  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}`,
  )
  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}/matches/${input.matchId}`,
  )
}
