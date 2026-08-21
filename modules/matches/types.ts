export type MatchStatus =
  | "pending"
  | "ready"
  | "on_court"
  | "completed"

export type MatchSide =
  | "A"
  | "B"

export type MatchSlot = {
  type:
    | "entry"
    | "winner"
    | "loser"
    | "bye"
    | "tbd"
    | "rotation_team"

  entryId?: string

  entryIds?: [string, string]

  sourceMatchId?: string

  label?: string

  metadata?: Record<string, unknown>
}

export type MatchRow = {
  id: string

  competition_id: string

  stage_id: string

  match_number: number

  visible_match_number: number | null

  status: MatchStatus

  phase_key: string | null

  group_key: string | null

  round_number: number

  match_order: number

  match_type: string

  court_id: string | null

  court_label: string | null

  side_a: MatchSlot

  side_b: MatchSlot

  score: Record<string, unknown>

  winner_side: MatchSide | null

  loser_side: MatchSide | null

  is_bye: boolean

  next_match_id: string | null

  next_match_slot: MatchSide | null

  finish_type: string

  retired_side: MatchSide | null

  scheduled_at: string | null

  started_at: string | null

  completed_at: string | null

  metadata: Record<string, unknown>

  created_at: string

  updated_at: string
}