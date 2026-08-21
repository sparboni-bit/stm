export type CompetitionStageEntryStatus = "active" | "withdrawn"

export type CompetitionStageEntry = {
  id: string
  competition_id: string
  stage_id: string
  competition_entry_id: string
  seed: number | null
  status: CompetitionStageEntryStatus
  sort_order: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}
