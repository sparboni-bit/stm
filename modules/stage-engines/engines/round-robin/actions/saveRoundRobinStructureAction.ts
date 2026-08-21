"use server"

import {
  configureCompetitionStage,
  updateCompetitionStageSettings,
} from "@/modules/competition-stages/repositories/competition-stage.repository"

export type SaveRoundRobinStructureInput = {
  stageId: string
  groupCount: number
}

export async function saveRoundRobinStructureAction(
  input: SaveRoundRobinStructureInput,
) {
  if (
    !Number.isInteger(input.groupCount) ||
    input.groupCount < 1 ||
    input.groupCount > 4
  ) {
    throw new Error("Group count must be between 1 and 4.")
  }

  const stage = await updateCompetitionStageSettings(
    input.stageId,
    {
      playMode: "singles",
      groupCount: input.groupCount,
      groupAssignment: "balanced",
      seedDistribution: "snake",
    },
  )

  if (stage.status === "draft") {
    await configureCompetitionStage(input.stageId)
  }

  return {
    success: true as const,
  }
}
