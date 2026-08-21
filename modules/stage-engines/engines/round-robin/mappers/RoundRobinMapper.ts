import type { MatchSlot } from "@/modules/matches/types"

import type {
  RoundRobinSchedule,
} from "../domain/RoundRobinSchedule"

export type MappedRoundRobinMatch = {
  competition_id: string
  stage_id: string
  match_number: number
  visible_match_number: number
  status: "ready"
  phase_key: string
  group_key: string
  round_number: number
  match_order: number
  match_type: "round_robin"
  side_a: MatchSlot
  side_b: MatchSlot
  score: Record<string, unknown>
  is_bye: false
  finish_type: "normal"
  metadata: Record<string, unknown>
}

export class RoundRobinMapper {
  map(input: {
    competitionId: string
    stageId: string
    schedule: RoundRobinSchedule
  }): {
    matches: MappedRoundRobinMatch[]
  } {
    let matchNumber = 1
    const matches: MappedRoundRobinMatch[] = []

    for (const group of input.schedule.groups) {
      for (const round of group.rounds) {
        for (const match of round.matches) {
          matches.push({
            competition_id:
              input.competitionId,
            stage_id: input.stageId,
            match_number: matchNumber,
            visible_match_number:
              matchNumber,
            status: "ready",
            phase_key: "round_robin",
            group_key: group.key,
            round_number:
              round.roundNumber,
            match_order:
              match.matchOrder,
            match_type: "round_robin",
            side_a: {
              type: "entry",
              entryId:
                match.sideAEntryId,
            },
            side_b: {
              type: "entry",
              entryId:
                match.sideBEntryId,
            },
            score: {},
            is_bye: false,
            finish_type: "normal",
            metadata: {
              scheduleId:
                input.schedule.id,
              groupName:
                group.name,
            },
          })

          matchNumber += 1
        }
      }
    }

    return { matches }
  }
}
