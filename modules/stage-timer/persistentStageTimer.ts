"use client"

export const ACTIVE_STAGE_TIMER_STORAGE_KEY = "pickleball-arena-active-stage-timer-v1"
export const ACTIVE_STAGE_TIMER_EVENT = "pickleball-arena-active-stage-timer-changed"

export type PersistentStageTimerStatus = "running" | "paused" | "ended"

export type PersistentStageTimerState = {
  competitionId: string
  stageId: string
  stageName: string
  durationSeconds: number
  remainingSeconds: number
  status: PersistentStageTimerStatus
  endAt: number | null
  updatedAt: number
}

function isTimerState(value: unknown): value is PersistentStageTimerState {
  if (!value || typeof value !== "object") return false
  const timer = value as Partial<PersistentStageTimerState>
  return (
    typeof timer.competitionId === "string" &&
    typeof timer.stageId === "string" &&
    typeof timer.stageName === "string" &&
    typeof timer.durationSeconds === "number" &&
    typeof timer.remainingSeconds === "number" &&
    (timer.status === "running" || timer.status === "paused" || timer.status === "ended") &&
    (timer.endAt === null || typeof timer.endAt === "number") &&
    typeof timer.updatedAt === "number"
  )
}

export function getPersistentTimerRemaining(timer: PersistentStageTimerState, now = Date.now()) {
  if (timer.status === "running" && timer.endAt !== null) {
    return Math.max(0, Math.ceil((timer.endAt - now) / 1000))
  }
  return Math.max(0, timer.remainingSeconds)
}

export function readPersistentStageTimer(): PersistentStageTimerState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(ACTIVE_STAGE_TIMER_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isTimerState(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writePersistentStageTimer(timer: PersistentStageTimerState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACTIVE_STAGE_TIMER_STORAGE_KEY, JSON.stringify(timer))
  window.dispatchEvent(new CustomEvent(ACTIVE_STAGE_TIMER_EVENT, { detail: timer }))
}

export function clearPersistentStageTimer() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(ACTIVE_STAGE_TIMER_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(ACTIVE_STAGE_TIMER_EVENT, { detail: null }))
}
