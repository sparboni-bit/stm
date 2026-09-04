"use server"

import { revalidatePath } from "next/cache"

import {
  createCompetitionStage,
  listCompetitionStages,
} from "../repositories/competition-stage.repository"
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
  const stageType = String(
    formData.get("stageType") ?? "",
  ) as CompetitionStageType

  const requestedName = String(
    formData.get("name") ?? "",
  ).trim()

  let name = requestedName

  if (!name) {
    const prefixes: Partial<Record<CompetitionStageType, string>> = {
      individual_rotation: "IR",
      round_robin: "RR",
      elimination: "EL",
    }

    const prefix = prefixes[stageType]

    if (!prefix) {
      return {
        success: false,
        message: "Invalid stage type.",
      }
    }

    const stages = await listCompetitionStages(competitionId)
    const autoNamePattern = new RegExp(`^${prefix}(\\d+)$`, "i")
    const highestNumber = stages.reduce((highest, stage) => {
      if (stage.stageType !== stageType) return highest
      const match = stage.name.trim().match(autoNamePattern)
      if (!match) return highest
      const value = Number(match[1])
      return Number.isFinite(value) ? Math.max(highest, value) : highest
    }, 0)

    name = `${prefix}${highestNumber + 1}`
  }

  const validation =
    validateCreateCompetitionStage({
      competitionId,
      name,
      stageType,
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