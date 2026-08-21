"use server"

import { getCompetitionStage } from "../repositories/competition-stage.repository"

export async function getCompetitionStageAction(
  stageId: string,
) {
  const normalizedStageId = stageId.trim()

  if (!normalizedStageId) {
    throw new Error("Stage id is required.")
  }

  return getCompetitionStage(normalizedStageId)
}
