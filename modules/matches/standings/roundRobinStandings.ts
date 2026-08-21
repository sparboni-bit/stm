import type { MatchDetailView } from "../view"

export type RoundRobinStandingRow = {
  entryId: string
  displayName: string
  seed: number | null
  played: number
  won: number
  lost: number
  pointsFor: number
  pointsAgainst: number
  diff: number
}

export type RoundRobinGroupStandings = {
  groupKey: string
  rows: RoundRobinStandingRow[]
}

function scoreTotal(match: MatchDetailView, side: "A" | "B"): number {
  if (Array.isArray(match.score.sets) && match.score.sets.length > 0) {
    return match.score.sets.reduce((total, item) => {
      if (typeof item !== "object" || item === null) return total
      const row = item as Record<string, unknown>
      const value = side === "A" ? row.a : row.b
      const parsed = Number(value)
      return Number.isFinite(parsed) ? total + parsed : total
    }, 0)
  }

  const value =
    side === "A"
      ? match.score.scoreA ?? match.score.a
      : match.score.scoreB ?? match.score.b

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function ensureRow(
  rows: Map<string, RoundRobinStandingRow>,
  participant: MatchDetailView["sideA"],
): RoundRobinStandingRow | null {
  if (!participant.entryId) return null

  const existing = rows.get(participant.entryId)
  if (existing) return existing

  const created: RoundRobinStandingRow = {
    entryId: participant.entryId,
    displayName: participant.displayName,
    seed: participant.seed,
    played: 0,
    won: 0,
    lost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    diff: 0,
  }

  rows.set(participant.entryId, created)
  return created
}

export function buildRoundRobinStandings(
  matches: MatchDetailView[],
): RoundRobinGroupStandings[] {
  const groups = new Map<string, Map<string, RoundRobinStandingRow>>()

  for (const match of matches) {
    if (match.matchType !== "round_robin" || !match.groupKey) continue

    const rows =
      groups.get(match.groupKey) ??
      new Map<string, RoundRobinStandingRow>()

    groups.set(match.groupKey, rows)
    ensureRow(rows, match.sideA)
    ensureRow(rows, match.sideB)
  }

  for (const match of matches) {
    if (
      match.matchType !== "round_robin" ||
      !match.groupKey ||
      match.status !== "completed"
    ) continue

    const rows = groups.get(match.groupKey)
    if (!rows) continue

    const rowA = ensureRow(rows, match.sideA)
    const rowB = ensureRow(rows, match.sideB)
    if (!rowA || !rowB) continue

    const scoreA = scoreTotal(match, "A")
    const scoreB = scoreTotal(match, "B")

    rowA.played += 1
    rowA.pointsFor += scoreA
    rowA.pointsAgainst += scoreB

    rowB.played += 1
    rowB.pointsFor += scoreB
    rowB.pointsAgainst += scoreA

    if (match.winnerSide === "A") {
      rowA.won += 1
      rowB.lost += 1
    } else if (match.winnerSide === "B") {
      rowB.won += 1
      rowA.lost += 1
    }
  }

  return Array.from(groups.entries())
    .map(([groupKey, rows]) => {
      const result = Array.from(rows.values()).map((row) => ({
        ...row,
        diff: row.pointsFor - row.pointsAgainst,
      }))

      result.sort(
        (a, b) =>
          b.won - a.won ||
          b.diff - a.diff ||
          b.pointsFor - a.pointsFor ||
          a.displayName.localeCompare(b.displayName),
      )

      return { groupKey, rows: result }
    })
    .sort((a, b) => a.groupKey.localeCompare(b.groupKey))
}
