import { createClient } from "@/lib/supabase/server"

import type {
  IndividualRotationMapperResult,
} from "../mappers/IndividualRotationMapper"

export type PersistIndividualRotationScheduleInput = {
  stageId: string
  mapped: IndividualRotationMapperResult
}

export async function persistIndividualRotationSchedule(
  input: PersistIndividualRotationScheduleInput,
): Promise<void> {
  const stageId = input.stageId.trim()

  if (!stageId) {
    throw new Error("Stage id is required.")
  }

  if (
    input.mapped.matches.length === 0
  ) {
    throw new Error(
      "The Individual Rotation schedule contains no matches.",
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc(
    "persist_individual_rotation_schedule",
    {
      p_stage_id: stageId,
      p_matches:
        input.mapped.matches,
      p_metadata:
        input.mapped.stageMetadata,
    },
  )

  if (error) {
    throw new Error(error.message)
  }
}
