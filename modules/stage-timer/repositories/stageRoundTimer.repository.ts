import { createClient } from "@/lib/supabase/server"
import type { StageRoundTimer, StageRoundTimerStatus } from "../types"

type Row = {
  id: string
  competition_id: string
  stage_id: string
  round_number: number | null
  status: string
  duration_seconds: number
  started_at: string | null
  ends_at: string | null
  paused_remaining_seconds: number | null
  created_at: string
  updated_at: string
}

const select = `id, competition_id, stage_id, round_number, status, duration_seconds, started_at, ends_at, paused_remaining_seconds, created_at, updated_at`

function map(row: Row): StageRoundTimer {
  return {
    id: row.id,
    competitionId: row.competition_id,
    stageId: row.stage_id,
    roundNumber: row.round_number,
    status: row.status as StageRoundTimerStatus,
    durationSeconds: row.duration_seconds,
    startedAt: row.started_at,
    endsAt: row.ends_at,
    pausedRemainingSeconds: row.paused_remaining_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getStageRoundTimer(stageId: string): Promise<StageRoundTimer | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("stage_round_timers").select(select).eq("stage_id", stageId).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? map(data as Row) : null
}

async function rpc(name: string, args: Record<string, unknown>): Promise<StageRoundTimer> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  if (!data) throw new Error("Timer operation returned no data.")
  return map(data as Row)
}

export function startStageRoundTimer(stageId: string, durationSeconds: number, roundNumber: number | null) {
  return rpc("start_stage_round_timer", { p_stage_id: stageId, p_duration_seconds: durationSeconds, p_round_number: roundNumber })
}
export function pauseStageRoundTimer(stageId: string) { return rpc("pause_stage_round_timer", { p_stage_id: stageId }) }
export function resumeStageRoundTimer(stageId: string) { return rpc("resume_stage_round_timer", { p_stage_id: stageId }) }
export function resetStageRoundTimer(stageId: string, durationSeconds: number) { return rpc("reset_stage_round_timer", { p_stage_id: stageId, p_duration_seconds: durationSeconds }) }
export function endStageRoundTimer(stageId: string) { return rpc("end_stage_round_timer", { p_stage_id: stageId }) }
