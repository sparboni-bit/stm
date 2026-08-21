export type CompetitionEntryType = "player" | "team"

export type CompetitionEntryStatus =
  | "active"
  | "withdrawn"
  | "disabled"

export type CompetitionEntry = {
  id: string
  competition_id: string
  player_id: string | null
  team_id: string | null
  entry_type: CompetitionEntryType
  display_name: string
  source: string
  status: CompetitionEntryStatus
  sort_order: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type CreateCompetitionEntryInput = {
  competitionId: string
  displayName: string
  entryType?: CompetitionEntryType
}
