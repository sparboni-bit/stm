import type {
  IndividualRotationSchedule,
} from "../domain/IndividualRotationSchedule"

export type IndividualRotationMappedMatch = {
  id: string
  match_number: number
  visible_match_number: number
  status: "ready"
  phase_key: null
  group_key: null
  round_number: number
  match_order: number
  match_type: "individual_rotation"
  court_label: string | null
  side_a: {
    type: "rotation_team"
    entryIds: [string, string]
  }
  side_b: {
    type: "rotation_team"
    entryIds: [string, string]
  }
  score: Record<string, never>
  winner_side: null
  loser_side: null
  is_bye: false
  next_match_id: null
  next_match_slot: null
  finish_type: "normal"
  retired_side: null
  scheduled_at: null
  started_at: null
  completed_at: null
  metadata: {
    engine: "individual_rotation"
    roundNumber: number
    courtNumber: number | null
    restingPlayerIds: string[]
  }
}

export type IndividualRotationMapperResult = {
  matches: IndividualRotationMappedMatch[]
  stageMetadata: {
    generation: {
      engineId: "individual_rotation"
      engineVersion: "1.0"
      scheduleId: string
      roundCount: number
      matchCount: number
      fairnessRawPenalty: number
      restingPlayersByRound: Record<
        string,
        string[]
      >
    }
  }
}

export class IndividualRotationMapper {
  map(
    schedule: IndividualRotationSchedule,
  ): IndividualRotationMapperResult {
    const restingPlayersByRound:
      Record<string, string[]> = {}

    const matches:
      IndividualRotationMappedMatch[] = []

    let matchNumber = 1

    for (
      const round of schedule.schedule.rounds
    ) {
      restingPlayersByRound[
        String(round.roundNumber)
      ] = [
        ...round.restingPlayerIds,
      ]

      let matchOrder = 1

      for (const match of round.matches) {
        const courtNumber =
          match.courtNumber ?? null

        matches.push({
          id: crypto.randomUUID(),
          match_number: matchNumber,
          visible_match_number:
            matchNumber,
          status: "ready",
          phase_key: null,
          group_key: null,
          round_number:
            round.roundNumber,
          match_order: matchOrder,
          match_type:
            "individual_rotation",
          court_label:
            courtNumber === null
              ? null
              : `Court ${courtNumber}`,
          side_a: {
            type: "rotation_team",
            entryIds: [
              match.teamA[0],
              match.teamA[1],
            ],
          },
          side_b: {
            type: "rotation_team",
            entryIds: [
              match.teamB[0],
              match.teamB[1],
            ],
          },
          score: {},
          winner_side: null,
          loser_side: null,
          is_bye: false,
          next_match_id: null,
          next_match_slot: null,
          finish_type: "normal",
          retired_side: null,
          scheduled_at: null,
          started_at: null,
          completed_at: null,
          metadata: {
            engine:
              "individual_rotation",
            roundNumber:
              round.roundNumber,
            courtNumber,
            restingPlayerIds: [
              ...round.restingPlayerIds,
            ],
          },
        })

        matchNumber += 1
        matchOrder += 1
      }
    }

    return {
      matches,
      stageMetadata: {
        generation: {
          engineId:
            "individual_rotation",
          engineVersion: "1.0",
          scheduleId: schedule.id,
          roundCount:
            schedule.roundCount,
          matchCount:
            schedule.matchCount,
          fairnessRawPenalty:
            schedule.fairnessRawPenalty,
          restingPlayersByRound,
        },
      },
    }
  }
}
