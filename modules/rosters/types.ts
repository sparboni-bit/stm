export type RosterEntryStatus = "active" | "inactive"

export type Roster = {
  id: string
  organization_id: string
  name: string
  description: string | null
  created_by: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type RosterEntry = {
  id: string
  roster_id: string
  display_name: string
  sort_order: number
  status: RosterEntryStatus
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type RosterPair = {
  id: string
  roster_id: string
  player_a_entry_id: string
  player_b_entry_id: string
  sort_order: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type RosterWithEntries = Roster & {
  entries: RosterEntry[]
  pairs: RosterPair[]
}

export type CreateRosterInput = {
  organizationId: string
  createdBy: string
  name: string
  description?: string | null
}

export type AddRosterEntryInput = {
  rosterId: string
  displayName: string
}

export type BulkRosterPairInput = {
  playerAName: string
  playerBName: string
}
