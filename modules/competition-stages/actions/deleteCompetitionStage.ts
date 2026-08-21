"use server"

import { revalidatePath } from "next/cache"

import { deleteCompetitionStage } from "../repositories/competition-stage.repository"

export async function deleteCompetitionStageAction(
  competitionId: string,
  formData: FormData,
): Promise<void> {
  const stageId = String(
    formData.get("stageId") ?? "",
  ).trim()

  if (!stageId) {
    throw new Error("Stage id is required.")
  }

  await deleteCompetitionStage(stageId)

  revalidatePath(
    `/competitions/${competitionId}`,
  )
}