"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION,
  type IndividualRotationTemplateRecord,
} from "@/modules/stage-engines/engines/individual-rotation/templates/types"

function projectRefFromUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  try {
    return new URL(url).hostname.split(".")[0] || "unknown"
  } catch {
    return "invalid-url"
  }
}

export async function getGuestIndividualRotationTemplateAction(input: {
  playerCount: number
  usableCourtCount: number
  seedCount: number
  roundCount: number
}): Promise<IndividualRotationTemplateRecord | null> {
  if (
    !Number.isInteger(input.playerCount) ||
    input.playerCount < 4 ||
    input.playerCount > 16
  ) {
    throw new Error("Individual Rotation requires between 4 and 16 players.")
  }

  if (
    !Number.isInteger(input.usableCourtCount) ||
    input.usableCourtCount < 1 ||
    input.usableCourtCount > 4
  ) {
    throw new Error("Invalid usable court count.")
  }

  if (
    !Number.isInteger(input.roundCount) ||
    input.roundCount < 1 ||
    input.roundCount > 12
  ) {
    throw new Error("Individual Rotation rounds must be between 1 and 12.")
  }

  if (input.seedCount !== 0 && input.seedCount !== 2) {
    throw new Error(
      "Individual Rotation templates support either 0 or 2 seeded players.",
    )
  }

  const supabase = createAdminClient()
  const engineVersion = INDIVIDUAL_ROTATION_TEMPLATE_ENGINE_VERSION

  const { data, error } = await supabase
    .from("individual_rotation_templates")
    .select("*")
    .eq("player_count", input.playerCount)
    .eq("usable_court_count", input.usableCourtCount)
    .eq("seed_count", input.seedCount)
    .eq("round_count", input.roundCount)
    .eq("engine_version", engineVersion)
    .maybeSingle()

  if (error) {
    throw new Error(
      `Unable to load Individual Rotation template: ${error.message}`,
    )
  }

  if (!data) {
    const { data: nearby, error: nearbyError } = await supabase
      .from("individual_rotation_templates")
      .select(
        "player_count,usable_court_count,seed_count,round_count,engine_version",
      )
      .eq("player_count", input.playerCount)
      .eq("usable_court_count", input.usableCourtCount)
      .order("seed_count", { ascending: true })
      .order("round_count", { ascending: true })
      .limit(50)

    if (nearbyError) {
      throw new Error(
        `Template lookup returned no row and diagnostic lookup failed: ${nearbyError.message}`,
      )
    }

    const visible = nearby ?? []
    const sample = visible
      .slice(0, 12)
      .map(
        (row) =>
          `${row.player_count}/${row.usable_court_count}/${row.seed_count}/${row.round_count}/${row.engine_version}`,
      )
      .join(", ")

    throw new Error(
      [
        "Precomputed IR template lookup returned no row.",
        `Project ref: ${projectRefFromUrl()}.`,
        `Requested: ${input.playerCount}/${input.usableCourtCount}/${input.seedCount}/${input.roundCount}/${engineVersion}.`,
        `Rows visible with same players/courts: ${visible.length}.`,
        sample ? `Sample: ${sample}.` : "Sample: none.",
      ].join(" "),
    )
  }

  return {
    playerCount: data.player_count,
    usableCourtCount: data.usable_court_count,
    seedCount: data.seed_count,
    roundCount: data.round_count,
    engineVersion: data.engine_version,
    schedule: data.schedule,
    metrics: data.metrics,
    rawPenalty: data.raw_penalty,
    theoreticalFloor: data.theoretical_floor,
    fairnessScore: data.fairness_score,
  } as IndividualRotationTemplateRecord
}
