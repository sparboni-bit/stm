export type CompetitionCourtStatus = "available" | "unavailable"

export type CompetitionCourt = {
  id: string
  competitionId: string
  courtNumber: number
  name: string
  status: CompetitionCourtStatus
  sortOrder: number
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CompetitionCourtRow = {
  id: string
  competition_id: string
  court_number: number
  name: string
  status: CompetitionCourtStatus
  sort_order: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}
