"use server"

import { listStageMatches } from "../repositories"
import type { MatchDetailView } from "../view"

export async function listStageMatchesAction(
  stageId: string,
): Promise<MatchDetailView[]> {
  return listStageMatches(stageId)
}
