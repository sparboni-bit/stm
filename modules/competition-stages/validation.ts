import {
  competitionStageTypes,
  type CompetitionStageType,
  type CreateCompetitionStageInput,
} from "./types"

export type CompetitionStageValidationResult =
  | {
      success: true
      data: CreateCompetitionStageInput
    }
  | {
      success: false
      error: string
    }

export function validateCreateCompetitionStage(
  input: CreateCompetitionStageInput,
): CompetitionStageValidationResult {
  const competitionId = input.competitionId.trim()
  const name = input.name.trim()

  if (!competitionId) {
    return {
      success: false,
      error: "Competition is required.",
    }
  }

  if (!name) {
    return {
      success: false,
      error: "Stage name is required.",
    }
  }

  if (name.length > 100) {
    return {
      success: false,
      error: "Stage name cannot exceed 100 characters.",
    }
  }

  if (
    !competitionStageTypes.includes(
      input.stageType as CompetitionStageType,
    )
  ) {
    return {
      success: false,
      error: "Invalid stage type.",
    }
  }

  return {
    success: true,
    data: {
      competitionId,
      name,
      stageType: input.stageType,
    },
  }
}