import { createClient } from "@/lib/supabase/server"
import type { IndividualRotationTemplateRecord } from "./types"

export async function upsertIndividualRotationTemplates(
  records: readonly IndividualRotationTemplateRecord[],
): Promise<void> {
  if (!records.length) return

  const supabase = await createClient()

  const { error } = await supabase
    .from("individual_rotation_templates")
    .upsert(
      records.map((record) => ({
        player_count: record.playerCount,
        usable_court_count: record.usableCourtCount,
        seed_count: record.seedCount,
        round_count: record.roundCount,
        engine_version: record.engineVersion,
        schedule: record.schedule,
        metrics: record.metrics,
        raw_penalty: record.rawPenalty,
        theoretical_floor: record.theoreticalFloor,
        fairness_score: record.fairnessScore,
        generated_at: new Date().toISOString(),
      })),
      {
        onConflict:
          "player_count,usable_court_count,seed_count,round_count,engine_version",
      },
    )

  if (error) throw new Error(error.message)
}

export async function listIndividualRotationTemplates(input: {
  playerCount: number
  usableCourtCount: number
  seedCount: number
  engineVersion: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("individual_rotation_templates")
    .select("*")
    .eq("player_count", input.playerCount)
    .eq("usable_court_count", input.usableCourtCount)
    .eq("seed_count", input.seedCount)
    .eq("engine_version", input.engineVersion)
    .order("round_count", { ascending: true })

  if (error) throw new Error(error.message)

  return data ?? []
}

export async function getIndividualRotationTemplate(input: {
  playerCount: number
  usableCourtCount: number
  seedCount: number
  roundCount: number
  engineVersion: string
}): Promise<IndividualRotationTemplateRecord | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("individual_rotation_templates")
    .select("*")
    .eq("player_count", input.playerCount)
    .eq("usable_court_count", input.usableCourtCount)
    .eq("seed_count", input.seedCount)
    .eq("round_count", input.roundCount)
    .eq("engine_version", input.engineVersion)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

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

export async function listIndividualRotationTemplateCoverage(input: {
  minPlayers: number
  maxPlayers: number
  engineVersion: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("individual_rotation_templates")
    .select(
      "player_count,usable_court_count,seed_count,round_count",
    )
    .gte("player_count", input.minPlayers)
    .lte("player_count", input.maxPlayers)
    .eq("engine_version", input.engineVersion)

  if (error) throw new Error(error.message)

  return data ?? []
}
