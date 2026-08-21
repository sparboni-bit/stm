"use server"

import { getMatchDetail } from "../repositories"
import type { MatchDetailView } from "../view"

export async function getMatchAction(
  matchId: string,
): Promise<MatchDetailView | null> {
  return getMatchDetail(matchId)
}
