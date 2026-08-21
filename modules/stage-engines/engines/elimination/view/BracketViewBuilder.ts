import type { CompetitionEntry } from "../../../../competition-entries/types"
import type { CompetitionStage } from "../../../../competition-stages/types"
import type { MatchRow, MatchSlot } from "../../../../matches"

import type {
  BracketViewMatch,
  BracketViewModel,
  BracketViewParticipant,
  BracketViewRound,
  BracketViewScore,
} from "./types"

export type BracketViewBuilderInput = {
  stage: CompetitionStage
  entries: CompetitionEntry[]
  matches: MatchRow[]
  seedsByEntryId: Map<string, number | null>
}

export class BracketViewBuilder {
  build(input: BracketViewBuilderInput): BracketViewModel {
    const entriesById = new Map(
      input.entries.map((entry) => [entry.id, entry]),
    )

    const orderedMatches = [...input.matches].sort(
      (a, b) =>
        a.round_number - b.round_number ||
        a.match_order - b.match_order ||
        a.match_number - b.match_number,
    )

    const groupedRounds = new Map<number, BracketViewMatch[]>()

    for (const row of orderedMatches) {
      const viewMatch = this.mapMatch(
        row,
        entriesById,
        input.seedsByEntryId,
      )

      const current =
        groupedRounds.get(row.round_number) ?? []

      current.push(viewMatch)
      groupedRounds.set(row.round_number, current)
    }

    const rounds: BracketViewRound[] = Array.from(
      groupedRounds.entries(),
    )
      .sort(([a], [b]) => a - b)
      .map(([number, matches]) => ({
        number,
        name: this.getRoundName(matches.length),
        matches,
      }))

    return {
      stageId: input.stage.id,
      competitionId: input.stage.competitionId,
      stageName: input.stage.name,
      stageStatus: input.stage.status,
      bracketId: this.readMetadataString(
        input.stage.metadata,
        "bracketId",
      ),
      bracketSize: this.readMetadataNumber(
        input.stage.metadata,
        "bracketSize",
      ),
      engineType:
        this.readMetadataString(
          input.stage.metadata,
          "engineType",
        ) ?? "single-elimination",
      rounds,
      matchCount: orderedMatches.length,
    }
  }

  private mapMatch(
    row: MatchRow,
    entriesById: Map<string, CompetitionEntry>,
    seedsByEntryId: Map<string, number | null>,
  ): BracketViewMatch {
    return {
      id: row.id,
      matchNumber: row.match_number,
      visibleMatchNumber: row.visible_match_number,
      roundNumber: row.round_number,
      order: row.match_order,
      status: row.status,
      sideA: this.mapParticipant(
        row.side_a,
        entriesById,
        seedsByEntryId,
      ),
      sideB: this.mapParticipant(
        row.side_b,
        entriesById,
        seedsByEntryId,
      ),
      score: this.mapScore(row.score),
      winnerSide: row.winner_side,
      finishType: row.finish_type,
      retiredSide: row.retired_side,
      courtLabel: row.court_label,
      isBye: row.is_bye,
      nextMatchId: row.next_match_id,
      nextMatchSlot: row.next_match_slot,
    }
  }

  private mapParticipant(
    slot: MatchSlot,
    entriesById: Map<string, CompetitionEntry>,
    seedsByEntryId: Map<string, number | null>,
  ): BracketViewParticipant {
    if (
      slot.type === "entry" &&
      slot.entryId
    ) {
      const entry =
        entriesById.get(slot.entryId)

      return {
        entryId: slot.entryId,
        displayName:
          entry?.display_name ??
          "Unknown entry",
        seed:
          seedsByEntryId.get(
            slot.entryId,
          ) ?? null,
        slotType: slot.type,
        sourceMatchId: null,
      }
    }

    if (slot.type === "winner") {
      return {
        entryId: null,
        displayName:
          slot.label ??
          "Winner of previous match",
        seed: null,
        slotType: slot.type,
        sourceMatchId:
          slot.sourceMatchId ?? null,
      }
    }

    if (slot.type === "loser") {
      return {
        entryId: null,
        displayName:
          slot.label ??
          "Loser of previous match",
        seed: null,
        slotType: slot.type,
        sourceMatchId:
          slot.sourceMatchId ?? null,
      }
    }

    if (slot.type === "bye") {
      return {
        entryId: null,
        displayName: "BYE",
        seed: null,
        slotType: slot.type,
        sourceMatchId: null,
      }
    }

    return {
      entryId: null,
      displayName:
        slot.label ?? "TBD",
      seed: null,
      slotType: "tbd",
      sourceMatchId:
        slot.sourceMatchId ?? null,
    }
  }

  private mapScore(
    raw: Record<string, unknown>,
  ): BracketViewScore {
    const sets = Array.isArray(raw.sets)
      ? raw.sets.map((item) => {
          const set =
            typeof item === "object" &&
            item !== null
              ? (item as Record<
                  string,
                  unknown
                >)
              : {}

          return {
            a:
              typeof set.a === "number"
                ? set.a
                : null,
            b:
              typeof set.b === "number"
                ? set.b
                : null,
          }
        })
      : []

    const rawValueA =
      raw.scoreA ?? raw.a

    const rawValueB =
      raw.scoreB ?? raw.b

    return {
      valueA:
        typeof rawValueA === "string" ||
        typeof rawValueA === "number"
          ? String(rawValueA)
          : null,
      valueB:
        typeof rawValueB === "string" ||
        typeof rawValueB === "number"
          ? String(rawValueB)
          : null,
      sets,
    }
  }

  private getRoundName(
    matchCount: number,
  ): string {
    switch (matchCount) {
      case 1:
        return "Final"
      case 2:
        return "Semi Finals"
      case 4:
        return "Quarter Finals"
      case 8:
        return "Round of 16"
      case 16:
        return "Round of 32"
      case 32:
        return "Round of 64"
      default:
        return `${matchCount * 2}-player round`
    }
  }

  private readMetadataString(
    metadata: Record<string, unknown>,
    key: string,
  ): string | null {
    const value = metadata[key]

    return typeof value === "string"
      ? value
      : null
  }

  private readMetadataNumber(
    metadata: Record<string, unknown>,
    key: string,
  ): number | null {
    const value = metadata[key]

    return typeof value === "number"
      ? value
      : null
  }
}