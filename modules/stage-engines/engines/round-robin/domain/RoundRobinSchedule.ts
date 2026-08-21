export type RoundRobinScheduleEntry = {
  entryId: string
  displayName: string
  seed: number | null
}

export type RoundRobinMatch = {
  id: string
  groupKey: string
  roundNumber: number
  matchOrder: number
  sideAEntryId: string
  sideBEntryId: string
}

export type RoundRobinRound = {
  roundNumber: number
  matches: RoundRobinMatch[]
}

export type RoundRobinGroup = {
  key: string
  name: string
  entries: RoundRobinScheduleEntry[]
  rounds: RoundRobinRound[]
}

export type RoundRobinSchedule = {
  id: string
  groupCount: number
  roundCount: number
  matchCount: number
  groups: RoundRobinGroup[]
}
