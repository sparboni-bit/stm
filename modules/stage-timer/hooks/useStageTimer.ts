"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  prepareWebTimerAlarm,
  startWebTimerAlarm,
  stopWebTimerAlarm,
} from "@/modules/stage-timer/alarm/webTimerAlarm"
import {
  clearPersistentStageTimer,
  getPersistentTimerRemaining,
  readPersistentStageTimer,
  writePersistentStageTimer,
} from "@/modules/stage-timer/persistentStageTimer"

type WakeLockSentinelLike = {
  release: () => Promise<void>
  released?: boolean
}

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>
  }
}

type PersistentTimerContext = {
  competitionId: string
  stageId: string
  stageName?: string
}

export function useStageTimer(
  matchDurationMinutes: number,
  persistentContext?: PersistentTimerContext,
) {
  const durationSeconds = Math.max(1, matchDurationMinutes) * 60
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds)
  const [running, setRunning] = useState(false)
  const endAtRef = useRef<number | null>(null)
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null)

  const releaseWakeLock = useCallback(async () => {
    const lock = wakeLockRef.current
    wakeLockRef.current = null
    if (!lock || lock.released) return
    try { await lock.release() } catch { /* browser/device may already have released it */ }
  }, [])

  const requestWakeLock = useCallback(async () => {
    if (document.visibilityState !== "visible") return
    const nav = navigator as WakeLockNavigator
    if (!nav.wakeLock?.request) return
    try {
      await releaseWakeLock()
      wakeLockRef.current = await nav.wakeLock.request("screen")
    } catch {
      // Wake Lock is progressive enhancement: timer still works without it.
    }
  }, [releaseWakeLock])

  useEffect(() => {
    if (persistentContext) {
      const saved = readPersistentStageTimer()
      if (saved?.stageId === persistentContext.stageId && saved.competitionId === persistentContext.competitionId) {
        const nextRemaining = getPersistentTimerRemaining(saved)
        setRemainingSeconds(nextRemaining)
        setRunning(saved.status === "running" && nextRemaining > 0)
        endAtRef.current = saved.status === "running" ? saved.endAt : null
        if (saved.status === "running" && nextRemaining > 0) void requestWakeLock()
        return
      }
    }

    setRemainingSeconds(durationSeconds)
    setRunning(false)
    endAtRef.current = null
    void releaseWakeLock()
  }, [
    durationSeconds,
    persistentContext?.competitionId,
    persistentContext?.stageId,
    releaseWakeLock,
    requestWakeLock,
  ])

  useEffect(() => {
    if (!running) return

    const update = () => {
      const endAt = endAtRef.current
      if (!endAt) return
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setRemainingSeconds(next)
      if (next === 0) {
        setRunning(false)
        endAtRef.current = null
        void releaseWakeLock()

        if (!persistentContext) {
          void startWebTimerAlarm()
        }
      }
    }

    update()
    const id = window.setInterval(update, 250)
    return () => window.clearInterval(id)
  }, [
    durationSeconds,
    persistentContext?.competitionId,
    persistentContext?.stageId,
    persistentContext?.stageName,
    running,
    releaseWakeLock,
  ])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && running) {
        void requestWakeLock()
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [running, requestWakeLock])

  useEffect(() => () => {
    void releaseWakeLock()
    if (!persistentContext) stopWebTimerAlarm()
  }, [persistentContext, releaseWakeLock])

  const start = useCallback(() => {
    stopWebTimerAlarm()
    void prepareWebTimerAlarm()
    const endAt = Date.now() + remainingSeconds * 1000
    endAtRef.current = endAt
    setRunning(true)
    void requestWakeLock()

    if (persistentContext) {
      writePersistentStageTimer({
        competitionId: persistentContext.competitionId,
        stageId: persistentContext.stageId,
        stageName: persistentContext.stageName ?? "Stage",
        durationSeconds,
        remainingSeconds,
        status: "running",
        endAt,
        updatedAt: Date.now(),
      })
    }
  }, [durationSeconds, persistentContext, remainingSeconds, requestWakeLock])

  const pause = useCallback(() => {
    const endAt = endAtRef.current
    const nextRemaining = endAt
      ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      : remainingSeconds
    setRemainingSeconds(nextRemaining)
    endAtRef.current = null
    setRunning(false)
    void releaseWakeLock()

    if (persistentContext) {
      writePersistentStageTimer({
        competitionId: persistentContext.competitionId,
        stageId: persistentContext.stageId,
        stageName: persistentContext.stageName ?? "Stage",
        durationSeconds,
        remainingSeconds: nextRemaining,
        status: "paused",
        endAt: null,
        updatedAt: Date.now(),
      })
    }
  }, [durationSeconds, persistentContext, releaseWakeLock, remainingSeconds])

  const reset = useCallback(() => {
    stopWebTimerAlarm()
    endAtRef.current = null
    setRunning(false)
    setRemainingSeconds(durationSeconds)
    void releaseWakeLock()
    if (persistentContext) clearPersistentStageTimer()
  }, [durationSeconds, persistentContext, releaseWakeLock])

  const end = useCallback(() => {
    endAtRef.current = null
    setRunning(false)
    setRemainingSeconds(0)
    void releaseWakeLock()

    if (persistentContext) {
      writePersistentStageTimer({
        competitionId: persistentContext.competitionId,
        stageId: persistentContext.stageId,
        stageName: persistentContext.stageName ?? "Stage",
        durationSeconds,
        remainingSeconds: 0,
        status: "ended",
        endAt: null,
        updatedAt: Date.now(),
      })
      void startWebTimerAlarm()
    } else {
      void startWebTimerAlarm()
    }
  }, [durationSeconds, persistentContext, releaseWakeLock])

  const adjust = useCallback((seconds: number) => {
    setRemainingSeconds((current) => {
      const next = Math.max(0, current + seconds)
      const nextEndAt = running ? Date.now() + next * 1000 : null
      if (running) endAtRef.current = nextEndAt

      if (persistentContext) {
        writePersistentStageTimer({
          competitionId: persistentContext.competitionId,
          stageId: persistentContext.stageId,
          stageName: persistentContext.stageName ?? "Stage",
          durationSeconds,
          remainingSeconds: next,
          status: running ? "running" : next === 0 ? "ended" : "paused",
          endAt: nextEndAt,
          updatedAt: Date.now(),
        })
      }

      return next
    })
  }, [durationSeconds, persistentContext, running])

  const label = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`

  return { remainingSeconds, running, label, start, pause, reset, end, adjust }
}
