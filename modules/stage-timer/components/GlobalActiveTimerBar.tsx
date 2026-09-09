"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { startWebTimerAlarm, stopWebTimerAlarm } from "@/modules/stage-timer/alarm/webTimerAlarm"
import {
  ACTIVE_STAGE_TIMER_EVENT,
  ACTIVE_STAGE_TIMER_STORAGE_KEY,
  getPersistentTimerRemaining,
  readPersistentStageTimer,
  type PersistentStageTimerState,
  writePersistentStageTimer,
} from "@/modules/stage-timer/persistentStageTimer"

function clock(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
}

export function GlobalActiveTimerBar() {
  const [timer, setTimer] = useState<PersistentStageTimerState | null>(null)
  const [remaining, setRemaining] = useState(0)

  const refresh = useCallback(() => {
    const next = readPersistentStageTimer()
    setTimer(next)
    setRemaining(next ? getPersistentTimerRemaining(next) : 0)
  }, [])

  useEffect(() => {
    refresh()

    const onTimerChanged = () => refresh()
    const onStorage = (event: StorageEvent) => {
      if (event.key === ACTIVE_STAGE_TIMER_STORAGE_KEY) refresh()
    }

    window.addEventListener(ACTIVE_STAGE_TIMER_EVENT, onTimerChanged)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(ACTIVE_STAGE_TIMER_EVENT, onTimerChanged)
      window.removeEventListener("storage", onStorage)
    }
  }, [refresh])

  useEffect(() => {
    if (!timer || timer.status !== "running") return

    let alarmStarted = false
    const tick = () => {
      const next = getPersistentTimerRemaining(timer)
      setRemaining(next)
      if (next > 0 || alarmStarted) return

      alarmStarted = true
      const ended: PersistentStageTimerState = {
        ...timer,
        remainingSeconds: 0,
        status: "ended",
        endAt: null,
        updatedAt: Date.now(),
      }
      writePersistentStageTimer(ended)
      void startWebTimerAlarm()
    }

    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [timer])

  useEffect(() => {
    if (!timer || timer.status !== "ended") return
    return () => stopWebTimerAlarm()
  }, [timer])

  const href = useMemo(() => {
    if (!timer) return "/guest"
    const params = new URLSearchParams({
      section: "stages",
      stage: timer.stageId,
      view: "matches",
    })
    return `/guest/competitions/${encodeURIComponent(timer.competitionId)}?${params.toString()}`
  }, [timer])

  if (!timer) return null

  const statusLabel =
    timer.status === "running"
      ? "RUNNING"
      : timer.status === "paused"
        ? "PAUSED"
        : "TIME"

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex justify-center sm:justify-end">
      <div className="pointer-events-auto flex min-h-14 w-full max-w-md items-center gap-3 rounded-2xl border border-neutral-950 bg-white px-3 py-2 shadow-xl sm:w-auto sm:min-w-[360px]">
        <span className={[
          "h-2.5 w-2.5 shrink-0 rounded-full",
          timer.status === "running" ? "bg-red-500" : timer.status === "ended" ? "bg-red-700" : "bg-neutral-400",
        ].join(" ")} />

        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-black uppercase tracking-[0.08em] text-neutral-500">
            {timer.stageName || "Stage"} · {statusLabel}
          </div>
          <div className="font-mono text-2xl font-black leading-none tabular-nums text-neutral-950">
            {clock(remaining)}
          </div>
        </div>

        <a
          href={href}
          className="inline-flex min-h-10 shrink-0 items-center rounded-xl border border-neutral-950 bg-[var(--arena-yellow)] px-3 text-sm font-black text-neutral-950"
        >
          Open
        </a>
      </div>
    </div>
  )
}
