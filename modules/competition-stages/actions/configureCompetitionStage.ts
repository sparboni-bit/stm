"use server"

import { revalidatePath } from "next/cache"

import {
  configureCompetitionStage,
} from "../repositories/competition-stage.repository"

export async function configureCompetitionStageAction(
  stageId: string,
): Promise<void> {
  const normalizedStageId = stageId.trim()

  if (!normalizedStageId) {
    throw new Error("Stage id is required.")
  }

  const stage =
    await configureCompetitionStage(normalizedStageId)

  revalidatePath(
    `/competitions/${stage.competitionId}`,
  )

  revalidatePath(
    `/competitions/${stage.competitionId}/stages/${stage.id}`,
  )
}