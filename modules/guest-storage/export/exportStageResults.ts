"use client"

import type { CompetitionEntry } from "@/modules/competition-entries/types"
import type { CompetitionStage } from "@/modules/competition-stages/types"
import type { MatchRow } from "@/modules/matches/types"
import { buildIndividualRotationStandings } from "@/modules/matches/standings/individualRotationStandings"
import { buildRoundRobinStandings } from "@/modules/matches/standings/roundRobinStandings"
import { MatchViewBuilder } from "@/modules/matches/view/MatchViewBuilder"

type ExportInput = {
  tournamentTitle: string
  stage: CompetitionStage
  matches: MatchRow[]
  entries: CompetitionEntry[]
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function row(values: unknown[]) {
  return values.map(csvCell).join(";")
}

function safeFilePart(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "Stage"
}

function slotLabel(slot: unknown, entriesById: Map<string, CompetitionEntry>) {
  if (!slot || typeof slot !== "object") return "TBD"
  const value = slot as Record<string, unknown>
  if (value.type === "bye") return "BYE"
  if (value.type === "entry" && typeof value.entryId === "string") {
    return entriesById.get(value.entryId)?.display_name ?? "Unknown entry"
  }
  if (value.type === "rotation_team" && Array.isArray(value.entryIds)) {
    return value.entryIds
      .filter((id): id is string => typeof id === "string")
      .map((id) => entriesById.get(id)?.display_name ?? "Unknown entry")
      .join(" + ")
  }
  return typeof value.label === "string" ? value.label : "TBD"
}

function scoreLabel(match: MatchRow) {
  if (match.is_bye) return "BYE"
  if (match.status !== "completed") return ""
  if (match.finish_type === "retirement") return "RET"
  const score = match.score as Record<string, unknown>
  if (Array.isArray(score.sets)) {
    return score.sets.map((item) => {
      const set = item as Record<string, unknown>
      return `${set.a ?? ""}-${set.b ?? ""}`
    }).join(" / ")
  }
  const a = score.scoreA ?? score.a
  const b = score.scoreB ?? score.b
  return a != null && b != null ? `${a}-${b}` : ""
}

function commonHeader(input: ExportInput, typeLabel: string) {
  const now = new Date()
  return [
    row(["Tournament", input.tournamentTitle]),
    row(["Stage", input.stage.name]),
    row(["Stage Type", typeLabel]),
    row(["Export Date", now.toLocaleString()]),
    "",
  ]
}

function matchRows(input: ExportInput, typeLabel: string) {
  const entriesById = new Map(input.entries.map((entry) => [entry.id, entry]))
  const stageMatches = input.matches
    .filter((match) => match.stage_id === input.stage.id)
    .sort((a, b) => a.round_number - b.round_number || a.match_order - b.match_order || a.match_number - b.match_number)
  return [
    row(["MATCHES"]),
    row(["Group", "Round", "Match", "Court", "Side A", "Side B", "Score", "Winner", "Status"]),
    ...stageMatches.map((match) => {
      const a = slotLabel(match.side_a, entriesById)
      const b = slotLabel(match.side_b, entriesById)
      return row([
        match.group_key ?? "",
        match.round_number,
        match.visible_match_number ?? match.match_number,
        match.court_label ?? "",
        a,
        b,
        scoreLabel(match),
        match.winner_side === "A" ? a : match.winner_side === "B" ? b : "",
        match.is_bye ? "BYE" : match.status,
      ])
    }),
  ]
}

function buildIndividualRotation(input: ExportInput) {
  const builder = new MatchViewBuilder()
  const views = input.matches
    .filter((match) => match.stage_id === input.stage.id && match.match_type === "individual_rotation")
    .map((match) => builder.build({ match, entries: input.entries }))
  const standings = buildIndividualRotationStandings(views)
  return [
    ...commonHeader(input, "Individual Rotation"),
    row(["STANDINGS"]),
    row(["Position", "Player", "Played", "Won", "Drawn", "Lost", "Points For", "Points Against", "Difference"]),
    ...standings.map((item, index) => row([index + 1, item.displayName, item.played, item.won, item.drawn, item.lost, item.pointsFor, item.pointsAgainst, item.diff])),
    "",
    ...matchRows(input, "Individual Rotation"),
  ].join("\r\n")
}

function buildRoundRobin(input: ExportInput) {
  const builder = new MatchViewBuilder()
  const views = input.matches
    .filter((match) => match.stage_id === input.stage.id && match.match_type === "round_robin")
    .map((match) => builder.build({ match, entries: input.entries }))
  const standings = buildRoundRobinStandings(views)
  const lines = [...commonHeader(input, "Round Robin"), row(["STANDINGS"])]
  for (const group of standings) {
    lines.push(row([`Group ${group.groupKey}`]))
    lines.push(row(["Position", "Player / Team", "Seed", "Played", "Won", "Lost", "Points For", "Points Against", "Difference"]))
    group.rows.forEach((item, index) => lines.push(row([index + 1, item.displayName, item.seed ?? "", item.played, item.won, item.lost, item.pointsFor, item.pointsAgainst, item.diff])))
    lines.push("")
  }
  lines.push(...matchRows(input, "Round Robin"))
  return lines.join("\r\n")
}

function buildElimination(input: ExportInput) {
  const lines = [...commonHeader(input, "Elimination"), ...matchRows(input, "Elimination")]
  const final = input.matches
    .filter((match) => match.stage_id === input.stage.id)
    .sort((a, b) => b.round_number - a.round_number || b.match_order - a.match_order)[0]
  if (final) {
    const entriesById = new Map(input.entries.map((entry) => [entry.id, entry]))
    const a = slotLabel(final.side_a, entriesById)
    const b = slotLabel(final.side_b, entriesById)
    const winner = final.winner_side === "A" ? a : final.winner_side === "B" ? b : ""
    const finalist = final.winner_side === "A" ? b : final.winner_side === "B" ? a : ""
    lines.push("", row(["WINNER", winner]), row(["FINALIST", finalist]))
  }
  return lines.join("\r\n")
}

export function exportStageResultsCsv(input: ExportInput) {
  const csv = input.stage.stageType === "individual_rotation"
    ? buildIndividualRotation(input)
    : input.stage.stageType === "round_robin"
      ? buildRoundRobin(input)
      : buildElimination(input)

  const date = new Date().toISOString().slice(0, 10)
  const fileName = `${safeFilePart(input.stage.name)}_Results_${date}.csv`
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
