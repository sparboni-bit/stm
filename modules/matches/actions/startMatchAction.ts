"use server"

import { revalidatePath } from "next/cache"

import { startMatch } from "../repositories/match.repository"

export async function startMatchAction(input: {
  competitionId: string
  stageId: string
  matchId: string
}): Promise<void> {
  await startMatch(input.matchId)

  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}`,
  )
  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}/matches/${input.matchId}`,
  )
}
