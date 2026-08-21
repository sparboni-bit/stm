import type { BracketSlot } from "../domain"

export type EliminationMatchInsert = {
  id: string
  competition_id: string
  stage_id: string

  match_number: number
  visible_match_number: number | null

status:
  | "pending"
  | "ready"
  | "on_court"
  | "completed"
  | "cancelled"

  phase_key: string | null
  group_key: string | null

  round_number: number
  match_order: number

  match_type: "elimination"

  court_label: string | null

  side_a: BracketSlot
  side_b: BracketSlot

  score: Record<string, unknown>

  winner_side: "A" | "B" | null
  loser_side: "A" | "B" | null

  is_bye: boolean

  next_match_id: string | null
  next_match_slot: "A" | "B" | null

  finish_type: "normal"
  retired_side: "A" | "B" | null

  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null

  metadata: Record<string, unknown>
}

export type BracketStageMetadataUpdate = {
  bracketId: string
  bracketSize: number
  engineType: string
  roundCount: number
  matchCount: number
}