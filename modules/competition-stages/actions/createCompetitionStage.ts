"use server"

import { revalidatePath } from "next/cache"

import { createCompetitionStage } from "../repositories/competition-stage.repository"
import type {
  CompetitionStageType,
} from "../types"
import { validateCreateCompetitionStage } from "../validation"

export type CreateCompetitionStageActionState = {
  success: boolean
  message: string
}

export async function createCompetitionStageAction(
  competitionId: string,
  _previousState: CreateCompetitionStageActionState,
  formData: FormData,
): Promise<CreateCompetitionStageActionState> {
  const validation =
    validateCreateCompetitionStage({
      competitionId,
      name: String(
        formData.get("name") ?? "",
      ),
      stageType: String(
        formData.get("stageType") ?? "",
      ) as CompetitionStageType,
    })

  if (!validation.success) {
    return {
      success: false,
      message: validation.error,
    }
  }

  try {
    await createCompetitionStage(validation.data)

    revalidatePath(
      `/competitions/${competitionId}`,
    )

    return {
      success: true,
      message: "Stage created successfully.",
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create the stage.",
    }
  }
}