"use server"

import { revalidatePath } from "next/cache"
import {
  endStageRoundTimer,
  getStageRoundTimer,
  pauseStageRoundTimer,
  resetStageRoundTimer,
  resumeStageRoundTimer,
  startStageRoundTimer,
} from "../repositories"

function refresh(competitionId: string, stageId: string) {
  revalidatePath(`/competitions/${competitionId}/stages/${stageId}`)
}

export async function getStageRoundTimerAction(stageId: string) {
  return getStageRoundTimer(stageId)
}
export async function startStageRoundTimerAction(stageId: string, competitionId: string, durationSeconds: number, roundNumber: number | null = null) {
  const timer = await startStageRoundTimer(stageId, durationSeconds, roundNumber)
  refresh(competitionId, stageId)
  return timer
}
export async function pauseStageRoundTimerAction(stageId: string, competitionId: string) {
  const timer = await pauseStageRoundTimer(stageId); refresh(competitionId, stageId); return timer
}
export async function resumeStageRoundTimerAction(stageId: string, competitionId: string) {
  const timer = await resumeStageRoundTimer(stageId); refresh(competitionId, stageId); return timer
}
export async function resetStageRoundTimerAction(stageId: string, competitionId: string, durationSeconds: number) {
  const timer = await resetStageRoundTimer(stageId, durationSeconds); refresh(competitionId, stageId); return timer
}
export async function endStageRoundTimerAction(stageId: string, competitionId: string) {
  const timer = await endStageRoundTimer(stageId); refresh(competitionId, stageId); return timer
}
