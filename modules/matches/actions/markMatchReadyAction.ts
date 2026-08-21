"use server"

import { revalidatePath } from "next/cache"

import { markMatchReady } from "../repositories/match.repository"

export async function markMatchReadyAction(input: {
  competitionId: string
  stageId: string
  matchId: string
}): Promise<void> {
  await markMatchReady(input.matchId)

  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}`,
  )
  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}/matches/${input.matchId}`,
  )
}
