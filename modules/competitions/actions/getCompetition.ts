"use server"

import { getCompetition } from "../repositories/competition.repository"
import type { Competition } from "../types"

export async function getCompetitionAction(
  id: string
): Promise<Competition | null> {
  const { data, error } = await getCompetition(id)

  if (error || !data) {
    return null
  }

  return data as Competition
}