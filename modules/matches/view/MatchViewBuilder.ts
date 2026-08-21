import type {
  CompetitionEntry,
} from "../../competition-entries/types"

import type {
  MatchRow,
  MatchSlot,
} from "../types"

import type {
  MatchDetailView,
  MatchParticipantMemberView,
  MatchParticipantView,
} from "./types"

export type MatchViewBuilderInput = {
  match: MatchRow
  entries: CompetitionEntry[]
  seedsByEntryId?: Map<
    string,
    number | null
  >
}

export class MatchViewBuilder {
  build(
    input: MatchViewBuilderInput,
  ): MatchDetailView {
    const entriesById =
      new Map(
        input.entries.map(
          (entry) => [
            entry.id,
            entry,
          ],
        ),
      )

    const seedsByEntryId =
      input.seedsByEntryId ??
      new Map<
        string,
        number | null
      >()

    return {
      id: input.match.id,
      competitionId:
        input.match.competition_id,
      stageId:
        input.match.stage_id,

      matchNumber:
        input.match.match_number,

      visibleMatchNumber:
        input.match
          .visible_match_number,

      status:
        input.match.status,

      roundNumber:
        input.match.round_number,

      matchOrder:
        input.match.match_order,

      matchType:
        input.match.match_type,

      groupKey:
        input.match.group_key,

      courtId:
        input.match.court_id,

      courtLabel:
        input.match.court_label,

      sideA:
        this.mapParticipant(
          input.match.side_a,
          entriesById,
          seedsByEntryId,
        ),

      sideB:
        this.mapParticipant(
          input.match.side_b,
          entriesById,
          seedsByEntryId,
        ),

      score:
        input.match.score,

      winnerSide:
        input.match.winner_side,

      loserSide:
        input.match.loser_side,

      isBye:
        input.match.is_bye,

      nextMatchId:
        input.match.next_match_id,

      nextMatchSlot:
        input.match.next_match_slot,

      finishType:
        input.match.finish_type,

      retiredSide:
        input.match.retired_side,

      scheduledAt:
        input.match.scheduled_at,

      startedAt:
        input.match.started_at,

      completedAt:
        input.match.completed_at,

      metadata:
        input.match.metadata,
    }
  }

  private mapParticipant(
    slot: MatchSlot,
    entriesById: Map<
      string,
      CompetitionEntry
    >,
    seedsByEntryId: Map<
      string,
      number | null
    >,
  ): MatchParticipantView {
    if (
      slot.type === "entry" &&
      slot.entryId
    ) {
      const entry =
        entriesById.get(
          slot.entryId,
        )

      return {
        entryId:
          slot.entryId,

        displayName:
          entry?.display_name ??
          "Unknown entry",

        seed:
          seedsByEntryId.get(
            slot.entryId,
          ) ?? null,

        slotType:
          slot.type,

        sourceMatchId:
          slot.sourceMatchId ??
          null,
      }
    }

    if (
      slot.type === "rotation_team" &&
      Array.isArray(slot.entryIds) &&
      slot.entryIds.length === 2
    ) {
      const members: MatchParticipantMemberView[] =
        slot.entryIds.map((entryId) => {
          const entry = entriesById.get(entryId)

          return {
            entryId,
            displayName:
              entry?.display_name ??
              "Unknown entry",
            seed:
              seedsByEntryId.get(entryId) ??
              null,
          }
        })

      return {
        entryId: null,
        displayName: members
          .map((member) => member.displayName)
          .join(" + "),
        seed: null,
        slotType: slot.type,
        sourceMatchId:
          slot.sourceMatchId ?? null,
        members,
      }
    }

    if (
      slot.type === "winner"
    ) {
      return {
        entryId: null,
        displayName:
          slot.label ??
          "Winner of previous match",
        seed: null,
        slotType:
          slot.type,
        sourceMatchId:
          slot.sourceMatchId ??
          null,
      }
    }

    if (
      slot.type === "loser"
    ) {
      return {
        entryId: null,
        displayName:
          slot.label ??
          "Loser of previous match",
        seed: null,
        slotType:
          slot.type,
        sourceMatchId:
          slot.sourceMatchId ??
          null,
      }
    }

    if (
      slot.type === "bye"
    ) {
      return {
        entryId: null,
        displayName: "BYE",
        seed: null,
        slotType:
          slot.type,
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
        slot.sourceMatchId ??
        null,
    }
  }
}