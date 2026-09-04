"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  prepareWebTimerAlarm,
  startWebTimerAlarm,
  stopWebTimerAlarm,
} from "@/modules/stage-timer/alarm/webTimerAlarm"

type WakeLockSentinelLike = {
  release: () => Promise<void>
  released?: boolean
}

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>
  }
}

export function useStageTimer(matchDurationMinutes: number) {
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
    setRemainingSeconds(durationSeconds)
    setRunning(false)
    endAtRef.current = null
    void releaseWakeLock()
  }, [durationSeconds, releaseWakeLock])

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
        void startWebTimerAlarm()
      }
    }

    update()
    const id = window.setInterval(update, 250)
    return () => window.clearInterval(id)
  }, [running, releaseWakeLock])

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
    stopWebTimerAlarm()
  }, [releaseWakeLock])

  const start = useCallback(() => {
    stopWebTimerAlarm()
    void prepareWebTimerAlarm()
    endAtRef.current = Date.now() + remainingSeconds * 1000
    setRunning(true)
    void requestWakeLock()
  }, [remainingSeconds, requestWakeLock])

  const pause = useCallback(() => {
    const endAt = endAtRef.current
    if (endAt) setRemainingSeconds(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)))
    endAtRef.current = null
    setRunning(false)
    void releaseWakeLock()
  }, [releaseWakeLock])

  const reset = useCallback(() => {
    stopWebTimerAlarm()
    endAtRef.current = null
    setRunning(false)
    setRemainingSeconds(durationSeconds)
    void releaseWakeLock()
  }, [durationSeconds, releaseWakeLock])

  const end = useCallback(() => {
    endAtRef.current = null
    setRunning(false)
    setRemainingSeconds(0)
    void releaseWakeLock()
    void startWebTimerAlarm()
  }, [releaseWakeLock])

  const adjust = useCallback((seconds: number) => {
    setRemainingSeconds((current) => {
      const next = Math.max(0, current + seconds)
      if (running) endAtRef.current = Date.now() + next * 1000
      return next
    })
  }, [running])

  const label = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`

  return { remainingSeconds, running, label, start, pause, reset, end, adjust }
}
