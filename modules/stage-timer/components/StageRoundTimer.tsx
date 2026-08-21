"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"

import { useStage } from "../../competition-stages/hooks"
import {
  endStageRoundTimerAction,
  getStageRoundTimerAction,
  pauseStageRoundTimerAction,
  resetStageRoundTimerAction,
  resumeStageRoundTimerAction,
  startStageRoundTimerAction,
} from "../actions"
import {
  prepareWebTimerAlarm,
  startWebTimerAlarm,
  stopWebTimerAlarm,
} from "../alarm"
import type { StageRoundTimer } from "../types"

function remaining(
  timer: StageRoundTimer | null,
  fallback: number,
) {
  if (!timer) return fallback

  if (timer.status === "paused") {
    return (
      timer.pausedRemainingSeconds ??
      timer.durationSeconds
    )
  }

  if (
    timer.status === "running" &&
    timer.endsAt
  ) {
    return Math.max(
      0,
      Math.ceil(
        (new Date(timer.endsAt).getTime() -
          Date.now()) /
          1000,
      ),
    )
  }

  if (timer.status === "expired") {
    return 0
  }

  return timer.durationSeconds
}

function clock(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60

  return `${String(m).padStart(2, "0")}:${String(
    s,
  ).padStart(2, "0")}`
}

export function StageRoundTimer() {
  const stage = useStage()

  const configuredMinutes =
    typeof stage.settings.matchDurationMinutes ===
    "number"
      ? stage.settings.matchDurationMinutes
      : 12

  const configuredSeconds = Math.max(
    60,
    Math.round(configuredMinutes * 60),
  )

  const [timer, setTimer] =
    useState<StageRoundTimer | null>(null)

  const [seconds, setSeconds] =
    useState(configuredSeconds)

  const [error, setError] =
    useState<string | null>(null)

  const [alarmActive, setAlarmActive] =
    useState(false)

  const [pending, startTransition] =
    useTransition()

  const alarmStartedRef = useRef(false)

  useEffect(() => {
    let active = true

    getStageRoundTimerAction(stage.id)
      .then((value) => {
        if (!active) return

        setTimer(value)
        setSeconds(
          remaining(value, configuredSeconds),
        )
      })
      .catch((e) => {
        if (!active) return

        setError(
          e instanceof Error
            ? e.message
            : "Unable to load timer.",
        )
      })

    return () => {
      active = false
    }
  }, [stage.id, configuredSeconds])

  useEffect(() => {
    if (
      !timer ||
      timer.status !== "running" ||
      !timer.endsAt
    ) {
      return
    }

    const tick = () => {
      setSeconds(
        Math.max(
          0,
          Math.ceil(
            (new Date(timer.endsAt!).getTime() -
              Date.now()) /
              1000,
          ),
        ),
      )
    }

    tick()

    const id = window.setInterval(tick, 250)

    return () => {
      window.clearInterval(id)
    }
  }, [timer])

  const expired =
    timer?.status === "expired" ||
    (timer?.status === "running" &&
      seconds === 0)

  useEffect(() => {
    if (!expired) {
      alarmStartedRef.current = false
      setAlarmActive(false)
      stopWebTimerAlarm()
      return
    }

    if (alarmStartedRef.current) {
      return
    }

    alarmStartedRef.current = true
    setAlarmActive(true)

    void startWebTimerAlarm()

    return () => {
      stopWebTimerAlarm()
    }
  }, [expired])

  useEffect(() => {
    return () => {
      stopWebTimerAlarm()
    }
  }, [])

  const label = useMemo(() => {
    if (expired) return "TIME'S UP"

    if (timer?.status === "paused") {
      return "PAUSED"
    }

    if (timer?.status === "running") {
      return "LIVE"
    }

    return "ROUND TIMER"
  }, [expired, timer?.status])

  function run(
    operation: () => Promise<StageRoundTimer>,
  ) {
    setError(null)
    stopWebTimerAlarm()
    setAlarmActive(false)
    alarmStartedRef.current = false

    startTransition(() => {
      operation()
        .then((value) => {
          setTimer(value)
          setSeconds(
            remaining(value, configuredSeconds),
          )
        })
        .catch((e) => {
          setError(
            e instanceof Error
              ? e.message
              : "Timer operation failed.",
          )
        })
    })
  }

  function startTimer() {
    void prepareWebTimerAlarm()

    run(() =>
      startStageRoundTimerAction(
        stage.id,
        stage.competitionId,
        configuredSeconds,
      ),
    )
  }

  function resumeTimer() {
    void prepareWebTimerAlarm()

    run(() =>
      resumeStageRoundTimerAction(
        stage.id,
        stage.competitionId,
      ),
    )
  }

  function stopAlarm() {
    stopWebTimerAlarm()
    setAlarmActive(false)
  }

  return (
    <section
      className={[
        "border p-4 shadow-sm sm:p-5",
        expired
          ? "border-red-300 bg-red-50"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p
            className={[
              "text-[10px] font-bold uppercase tracking-[0.18em]",
              expired
                ? "text-red-700"
                : "text-slate-400",
            ].join(" ")}
          >
            {label}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-600">
            Match time · {configuredMinutes} min
          </p>
        </div>

        {timer?.roundNumber ? (
          <span className="text-xs font-bold text-slate-500">
            Round {timer.roundNumber}
          </span>
        ) : null}
      </div>

      <div
        className={[
          "py-5 text-center font-mono text-6xl font-black tabular-nums tracking-tight sm:text-7xl",
          expired
            ? "text-red-700"
            : "text-slate-950",
        ].join(" ")}
      >
        {clock(expired ? 0 : seconds)}
      </div>

      {expired ? (
        <div className="mb-4 text-center">
          <p className="text-lg font-black uppercase tracking-wide text-red-700">
            Time&apos;s up!
          </p>

          <p className="mt-1 text-sm font-medium text-red-600">
            Round time has expired.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="mb-3 border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-center">
        {expired && alarmActive ? (
          <button
            type="button"
            onClick={stopAlarm}
            className="col-span-2 min-h-12 bg-red-700 px-6 py-3 text-sm font-bold text-white"
          >
            STOP ALARM
          </button>
        ) : null}

        {!timer ||
        timer.status === "stopped" ? (
          <button
            type="button"
            disabled={pending}
            onClick={startTimer}
            className="col-span-2 min-h-12 bg-slate-950 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            START TIMER
          </button>
        ) : null}

        {timer?.status === "running" &&
        !expired ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() =>
                pauseStageRoundTimerAction(
                  stage.id,
                  stage.competitionId,
                ),
              )
            }
            className="min-h-12 border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900"
          >
            PAUSE
          </button>
        ) : null}

        {timer?.status === "paused" ? (
          <button
            type="button"
            disabled={pending}
            onClick={resumeTimer}
            className="min-h-12 bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            RESUME
          </button>
        ) : null}

        {timer &&
        timer.status !== "stopped" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() =>
                resetStageRoundTimerAction(
                  stage.id,
                  stage.competitionId,
                  configuredSeconds,
                ),
              )
            }
            className="min-h-12 border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900"
          >
            RESET
          </button>
        ) : null}

        {timer &&
        timer.status !== "stopped" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() =>
                endStageRoundTimerAction(
                  stage.id,
                  stage.competitionId,
                ),
              )
            }
            className="col-span-2 min-h-12 border border-slate-950 bg-white px-5 py-3 text-sm font-bold text-slate-950"
          >
            END TIMER
          </button>
        ) : null}
      </div>
    </section>
  )
}
