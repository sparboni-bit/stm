"use server"

import { getMatchSchedule } from "../repositories/match.repository"

export async function getMatchScheduleAction(
  matchId: string,
) {
  return getMatchSchedule(matchId)
}
