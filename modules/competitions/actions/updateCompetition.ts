"use server"

import { revalidatePath } from "next/cache"

import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { updateCompetition } from "../repositories/competition.repository"

function dateToTimestamp(value: string): string {
  return `${value}T12:00:00.000Z`
}

export async function updateCompetitionAction(
  competitionId: string,
  formData: FormData,
): Promise<{ success: true }> {
  const currentWorkspace = await getCurrentWorkspace()

  if (!currentWorkspace) {
    throw new Error("No active workspace.")
  }

  const title = String(formData.get("title") ?? "").trim()
  const rawDescription = String(formData.get("description") ?? "").trim()
  const startDate = String(formData.get("start_date") ?? "").trim()
  const endDate = String(formData.get("end_date") ?? "").trim()

  if (!title) {
    throw new Error("Event name is required.")
  }

  if (!startDate || !endDate) {
    throw new Error("Date From and Date To are required.")
  }

  if (endDate < startDate) {
    throw new Error("Date To cannot be earlier than Date From.")
  }

  await updateCompetition(competitionId, {
    title,
    description: rawDescription.length > 0 ? rawDescription : null,
    start_at: dateToTimestamp(startDate),
    end_at: dateToTimestamp(endDate),
  })

  revalidatePath(`/competitions/${competitionId}`)
  revalidatePath("/competitions")

  return { success: true }
}
