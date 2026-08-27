"use server"

import { revalidatePath } from "next/cache"

import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { deleteCompetition } from "../repositories/competition.repository"

export async function deleteCompetitionAction(
  competitionId: string,
): Promise<void> {
  const currentWorkspace = await getCurrentWorkspace()

  if (!currentWorkspace) {
    throw new Error("No active workspace.")
  }

  await deleteCompetition(competitionId)

  revalidatePath("/competitions")
}