"use server"

import { revalidatePath } from "next/cache"

import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { setCompetitionClosed } from "../repositories/competition.repository"

export async function setCompetitionClosedAction(
  competitionId: string,
  isClosed: boolean,
): Promise<{ success: true }> {
  const currentWorkspace =
    await getCurrentWorkspace()

  if (!currentWorkspace) {
    throw new Error("No active workspace.")
  }

  await setCompetitionClosed(
    competitionId,
    isClosed,
  )

  revalidatePath("/competitions")
  revalidatePath(
    `/competitions/${competitionId}`,
  )

  return { success: true }
}
