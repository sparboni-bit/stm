"use server"

import { revalidatePath } from "next/cache"

import { saveMatchSchedule } from "../repositories/match.repository"

export async function saveMatchScheduleAction(input: {
  competitionId: string
  stageId: string
  matchId: string
  courtId: string | null
  scheduledAt: string | null
}): Promise<void> {
  let scheduledAt: string | null = null

  if (input.scheduledAt?.trim()) {
    const parsed = new Date(input.scheduledAt)

    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid scheduled date/time.")
    }

    scheduledAt = parsed.toISOString()
  }

  await saveMatchSchedule({
    matchId: input.matchId,
    courtId: input.courtId,
    scheduledAt,
  })

  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}`,
  )
  revalidatePath(
    `/competitions/${input.competitionId}/stages/${input.stageId}/matches/${input.matchId}`,
  )
}
