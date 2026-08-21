import type { CompetitionEntry } from "@/modules/competition-entries/types"
import type { CompetitionStage } from "@/modules/competition-stages/types"
import type { CompetitionStageEntry } from "@/modules/competition-stage-entries/types"
import type { CompetitionCourt } from "@/modules/competition-courts/types"
import type { MatchRow } from "@/modules/matches/types"

export type GuestCompetitionStatus =
  | "draft" | "configure" | "ready" | "generated"
  | "running" | "completed" | "archived"

export type GuestCompetition = {
  id: string
  title: string
  description: string | null
  status: GuestCompetitionStatus
  startAt: string | null
  endAt: string | null
  settings: Record<string, unknown>
  structure: Record<string, unknown>
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type GuestTournamentDocument = {
  schemaVersion: number
  competition: GuestCompetition
  entries: CompetitionEntry[]
  stages: CompetitionStage[]
  stageEntries: CompetitionStageEntry[]
  courts: CompetitionCourt[]
  matches: MatchRow[]
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type GuestTournamentIndex = {
  schemaVersion: number
  tournaments: GuestTournamentDocument[]
}
