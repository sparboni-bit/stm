import { createClient } from "@/lib/supabase/server"

import type {
  MappedRoundRobinMatch,
} from "../mappers/RoundRobinMapper"

export async function persistRoundRobinSchedule(
  input: {
    stageId: string
    mapped: {
      matches: MappedRoundRobinMatch[]
    }
  },
) {
  const supabase = await createClient()

  const { data: stage, error: stageError } =
    await supabase
      .from("competition_stages")
      .select("id, status")
      .eq("id", input.stageId)
      .single()

  if (stageError) {
    throw new Error(stageError.message)
  }

  if (
    stage.status !== "draft" &&
    stage.status !== "configured"
  ) {
    throw new Error(
      "Round Robin can only be generated from a draft or configured Stage.",
    )
  }

  const { count, error: countError } =
    await supabase
      .from("matches")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("stage_id", input.stageId)

  if (countError) {
    throw new Error(countError.message)
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "This Stage already contains matches.",
    )
  }

  if (input.mapped.matches.length === 0) {
    throw new Error(
      "The Round Robin schedule contains no matches.",
    )
  }

  const { error: insertError } =
    await supabase
      .from("matches")
      .insert(input.mapped.matches)

  if (insertError) {
    throw new Error(insertError.message)
  }

  const now = new Date().toISOString()

  const {
    data: updatedStage,
    error: updateError,
  } = await supabase
    .from("competition_stages")
    .update({
      status: "generated",
      updated_at: now,
    })
    .eq("id", input.stageId)
    .in("status", ["draft", "configured"])
    .select("id, status")
    .single()

  if (
    updateError ||
    !updatedStage ||
    updatedStage.status !== "generated"
  ) {
    await supabase
      .from("matches")
      .delete()
      .eq("stage_id", input.stageId)

    throw new Error(
      updateError
        ? `Round Robin matches were generated, but Stage lifecycle update failed: ${updateError.message}`
        : "Round Robin matches were generated, but the Stage did not transition to generated.",
    )
  }
}
