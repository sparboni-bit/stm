import type {
  BracketMatch,
  BracketTree,
} from "../domain"

import type {
  BracketStageMetadataUpdate,
  EliminationMatchInsert,
} from "./types"

export type BracketMapperInput = {
  competitionId: string
  stageId: string
  tree: BracketTree
}

export type BracketMapperResult = {
  matches: EliminationMatchInsert[]
  stageMetadata: BracketStageMetadataUpdate
}

export class BracketMapper {
  map(
    input: BracketMapperInput,
  ): BracketMapperResult {
    const { competitionId, stageId, tree } = input

    const roundNumberById = new Map(
      tree.rounds.map((round) => [
        round.id,
        round.order,
      ]),
    )

    const matches = tree.matches.map(
      (match, index) =>
        this.mapMatch({
          competitionId,
          stageId,
          match,
          roundNumber:
            this.getRoundNumber(
              match.roundId,
              roundNumberById,
            ),
          matchNumber: index + 1,
        }),
    )

    return {
      matches,
      stageMetadata: {
        bracketId: tree.id,
        bracketSize: tree.size,
        engineType: tree.engineType,
        roundCount: tree.rounds.length,
        matchCount: tree.matches.length,
      },
    }
  }

  private mapMatch(input: {
    competitionId: string
    stageId: string
    match: BracketMatch
    roundNumber: number
    matchNumber: number
  }): EliminationMatchInsert {
    const {
      competitionId,
      stageId,
      match,
      roundNumber,
      matchNumber,
    } = input

    return {
      id: match.id,
      competition_id: competitionId,
      stage_id: stageId,

      match_number: matchNumber,
      visible_match_number: matchNumber,

      status: match.status,

      phase_key: "elimination",
      group_key: null,

      round_number: roundNumber,
      match_order: match.position,

      match_type: "elimination",

      court_label: match.courtId ?? null,

      side_a: match.slotA,
      side_b: match.slotB,

      score: {},

      winner_side:
        this.resolveWinnerSide(match),

      loser_side:
        this.resolveLoserSide(match),

      is_bye:
        match.slotA.type === "bye" ||
        match.slotB.type === "bye",

      next_match_id:
        match.nextMatchId ?? null,

      next_match_slot:
        match.nextSlot ?? null,

      finish_type: "normal",
      retired_side: null,

      scheduled_at:
        match.scheduledAt?.toISOString() ?? null,

      started_at: null,
      completed_at:
        match.status === "completed"
          ? new Date().toISOString()
          : null,

      metadata: {
        ...(match.metadata ?? {}),
        bracketRoundId: match.roundId,
        winnerEntryId:
          match.winnerEntryId ?? null,
      },
    }
  }

  private getRoundNumber(
    roundId: string,
    roundNumberById: Map<string, number>,
  ): number {
    const roundNumber =
      roundNumberById.get(roundId)

    if (!roundNumber) {
      throw new Error(
        `Round "${roundId}" was not found in the bracket.`,
      )
    }

    return roundNumber
  }

  private resolveWinnerSide(
    match: BracketMatch,
  ): "A" | "B" | null {
    if (!match.winnerEntryId) {
      return null
    }

    if (
      match.slotA.type === "entry" &&
      match.slotA.entryId ===
        match.winnerEntryId
    ) {
      return "A"
    }

    if (
      match.slotB.type === "entry" &&
      match.slotB.entryId ===
        match.winnerEntryId
    ) {
      return "B"
    }

    return null
  }

  private resolveLoserSide(
    match: BracketMatch,
  ): "A" | "B" | null {
    const winnerSide =
      this.resolveWinnerSide(match)

    if (winnerSide === "A") {
      return "B"
    }

    if (winnerSide === "B") {
      return "A"
    }

    return null
  }
}