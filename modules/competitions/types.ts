export type PlayMode =
  | "singles"
  | "doubles"
  | "individual_doubles"

export type StructureType =
  | "single_elimination"
  | "round_robin"
  | "round_robin_bracket"
  | "round_robin_bracket_consolation"

export type CompetitionStatus =
  | "draft"
  | "configure"
  | "ready"
  | "generated"
  | "running"
  | "completed"
  | "archived"

export type Competition = {
  id: string
  organization_id: string
  owner_member_id: string
  created_by: string | null
  title: string
  description: string | null

  /**
   * Legacy Competition-level fields.
   *
   * New stage-based Competitions leave these null.
   * Play mode and competitive structure belong to Competition Stages.
   */
  structure_type: StructureType | null
  play_mode: PlayMode | null

  status: CompetitionStatus
  start_at: string | null
  end_at: string | null
  settings: Record<string, unknown>
  structure: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type CompetitionListResult = {
  active: Competition[]
  archived: Competition[]
}

export type CompetitionDetail = {
  id: string
  title: string
  description: string | null
  status: string
  structure_type: string | null
  play_mode: string | null
  workspace_name: string
  organization_type:
    | "personal"
    | "business"
  created_at: string
  updated_at: string
}
