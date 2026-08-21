import { createClient } from "@/lib/supabase/server"

import type {
  CompetitionStatisticsView,
} from "../view-models/competition-statistics"

export async function getCompetitionStatistics(
  competitionId: string,
): Promise<CompetitionStatisticsView> {
  const supabase = await createClient()

  const [
    playersResult,
    matchesResult,
  ] = await Promise.all([
    supabase
      .from("competition_entries")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("competition_id", competitionId),

    supabase
      .from("matches")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("competition_id", competitionId),
  ])

  return {
    players: playersResult.count ?? 0,
    teams: 0,
    matches: matchesResult.count ?? 0,
    courts: 0,
  }
}