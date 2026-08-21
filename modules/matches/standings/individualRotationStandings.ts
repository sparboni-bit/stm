import type { MatchDetailView, MatchParticipantView } from "../view"

export type IndividualRotationStandingRow = {
  entryId: string
  displayName: string
  played: number
  won: number
  drawn: number
  lost: number
  pointsFor: number
  pointsAgainst: number
  diff: number
}

function scoreValues(match: MatchDetailView, side: "A" | "B"): string[] {
  if (Array.isArray(match.score.sets) && match.score.sets.length > 0) {
    return match.score.sets
      .map((item) => {
        if (typeof item !== "object" || item === null) return null
        const row = item as Record<string, unknown>
        const value = side === "A" ? row.a : row.b
        return typeof value === "number" || typeof value === "string"
          ? String(value)
          : null
      })
      .filter((value): value is string => value !== null)
  }

  const key = side === "A" ? "scoreA" : "scoreB"
  const legacyKey = side === "A" ? "a" : "b"
  const value = match.score[key] ?? match.score[legacyKey]

  return typeof value === "number" || typeof value === "string"
    ? [String(value)]
    : []
}

function scoreTotal(match: MatchDetailView, side: "A" | "B"): number {
  return scoreValues(match, side).reduce((total, value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? total + parsed : total
  }, 0)
}

function rotationMembers(
  participant: MatchParticipantView,
): Array<{ entryId: string; displayName: string }> {
  if (Array.isArray(participant.members) && participant.members.length > 0) {
    return participant.members.map((member) => ({
      entryId: member.entryId,
      displayName: member.displayName,
    }))
  }

  if (participant.entryId) {
    return [{
      entryId: participant.entryId,
      displayName: participant.displayName,
    }]
  }

  return []
}

export function buildIndividualRotationStandings(
  matches: MatchDetailView[],
): IndividualRotationStandingRow[] {
  const rows = new Map<string, IndividualRotationStandingRow>()

  function ensurePlayer(entryId: string, displayName: string) {
    const existing = rows.get(entryId)
    if (existing) return existing

    const created: IndividualRotationStandingRow = {
      entryId,
      displayName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      diff: 0,
    }

    rows.set(entryId, created)
    return created
  }

  for (const match of matches) {
    for (const member of rotationMembers(match.sideA)) {
      ensurePlayer(member.entryId, member.displayName)
    }
    for (const member of rotationMembers(match.sideB)) {
      ensurePlayer(member.entryId, member.displayName)
    }
  }

  for (const match of matches) {
    if (match.status !== "completed") {
      continue
    }

    const membersA = rotationMembers(match.sideA)
    const membersB = rotationMembers(match.sideB)
    if (membersA.length === 0 || membersB.length === 0) continue

    const scoreA = scoreTotal(match, "A")
    const scoreB = scoreTotal(match, "B")

    for (const member of membersA) {
      const row = ensurePlayer(member.entryId, member.displayName)
      row.played += 1
      row.pointsFor += scoreA
      row.pointsAgainst += scoreB
      if (match.winnerSide === "A") row.won += 1
      else if (match.winnerSide === "B") row.lost += 1
      else row.drawn += 1
    }

    for (const member of membersB) {
      const row = ensurePlayer(member.entryId, member.displayName)
      row.played += 1
      row.pointsFor += scoreB
      row.pointsAgainst += scoreA
      if (match.winnerSide === "B") row.won += 1
      else if (match.winnerSide === "A") row.lost += 1
      else row.drawn += 1
    }
  }

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

  return result
}
