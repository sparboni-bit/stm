"use client"

import { useState } from "react"

import {
  useStage,
  useStageActions,
} from "../../../../competition-stages/hooks"

function readBoolean(
  settings: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = settings[key]

  return typeof value === "boolean"
    ? value
    : fallback
}

function readString(
  settings: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const value = settings[key]

  return typeof value === "string"
    ? value
    : fallback
}

export function EliminationStructureSection() {
  const stage = useStage()
  const { configureStage } = useStageActions()

  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const seedingMode = readString(
    stage.settings,
    "seedingMode",
    "none",
  )

  const thirdPlaceMatch = readBoolean(
    stage.settings,
    "thirdPlaceMatch",
    false,
  )

  const canConfigure =
    stage.status === "draft"

  async function handleConfigure() {
    if (!canConfigure || pending) {
      return
    }

    setPending(true)
    setMessage("")
    setError("")

    try {
      await configureStage()

      setMessage(
        "Structure confirmed. You can now add participants to this Stage.",
      )
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to configure the Stage.",
      )
    } finally {
      setPending(false)
    }
  }
  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Elimination
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Structure
        </h2>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Review the elimination format and generate the
          bracket when the entries are ready.
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Format
          </dt>

          <dd className="mt-2 text-sm font-semibold text-slate-900">
            Single elimination
          </dd>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Seeding
          </dt>

          <dd className="mt-2 text-sm font-semibold text-slate-900">
            {seedingMode === "manual"
              ? "Manual"
              : "Automatic"}
          </dd>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Third-place match
          </dt>

          <dd className="mt-2 text-sm font-semibold text-slate-900">
            {thirdPlaceMatch
              ? "Enabled"
              : "Disabled"}
          </dd>
        </div>
      </dl>

    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Confirm structure
          </h3>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Confirm the Stage structure before assigning
            participants and seeds.
          </p>
        </div>

        <button
          type="button"
          onClick={handleConfigure}
          disabled={!canConfigure || pending}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--arena-yellow)] px-5 text-sm font-black text-slate-950 transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {pending
            ? "Saving..."
            : canConfigure
              ? "Continue to Players"
              : "Structure confirmed"}
        </button>
      </div>

      {message ? (
        <div
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          {message}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      ) : null}

      {!canConfigure ? (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-700">
            Structure confirmed
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Continue to Players to assign participants
            and define Stage-specific seeds.
          </p>
        </div>
      ) : null}
    </div>
  </section>
  )
}