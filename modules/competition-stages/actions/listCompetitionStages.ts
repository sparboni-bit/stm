"use server"

import { listCompetitionStages } from "../repositories/competition-stage.repository"

export async function listCompetitionStagesAction(
  competitionId: string,
) {
  return listCompetitionStages(competitionId)
}