"use server"

import {
  loadBracketView,
} from "../../engines/elimination/repositories"

import type {
  BracketViewModel,
} from "../../engines/elimination/view"

export type GetEliminationBracketViewResult =
  | {
      success: true
      view: BracketViewModel | null
    }
  | {
      success: false
      message: string
    }

export async function getEliminationBracketView(
  stageId: string,
): Promise<GetEliminationBracketViewResult> {
  try {
    const view = await loadBracketView(stageId)

    return {
      success: true,
      view,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load the bracket.",
    }
  }
}
