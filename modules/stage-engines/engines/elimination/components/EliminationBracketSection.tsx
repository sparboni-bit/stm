"use client"

import {
  useEffect,
  useState,
} from "react"

import { useRouter } from "next/navigation"

import {
  useStage,
  useStageActions,
} from "../../../../competition-stages/hooks"

import {
  getEliminationBracketView,
} from "../../../core/actions"

import type {
  BracketViewModel,
} from "../view"

import {
  BracketViewer,
} from "./bracket"

export function EliminationBracketSection() {
  const stage = useStage()
  const router = useRouter()

  const {
    generateStage,
    refresh,
  } = useStageActions()

  const [view, setView] =
    useState<BracketViewModel | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [generating, setGenerating] =
    useState(false)

  const generated =
    stage.status === "generated" ||
    stage.status === "running" ||
    stage.status === "completed"

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError("")

      try {
        const result =
          await getEliminationBracketView(
            stage.id,
          )

        if (!active) {
          return
        }

        if (!result.success) {
          setError(result.message)
          setLoading(false)
          return
        }

        setView(result.view)
        setLoading(false)
      } catch (caughtError) {
        if (!active) {
          return
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load bracket.",
        )

        setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [
    stage.id,
    stage.status,
  ])

  async function handleGenerateBracket() {
    if (
      generated ||
      generating
    ) {
      return
    }

    setGenerating(true)
    setError("")

    try {
      await generateStage()

      refresh()
      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to generate bracket.",
      )
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-sm font-semibold text-slate-500">
        Loading bracket...
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>

        {!generated ? (
          <button
            type="button"
            onClick={
              handleGenerateBracket
            }
            disabled={generating}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--arena-yellow)] px-6 py-3 text-sm font-black text-slate-950 transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {generating
              ? "Generating..."
              : "Generate Bracket"}
          </button>
        ) : null}
      </div>
    )
  }

  if (!view || view.rounds.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Bracket setup
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              Bracket not generated
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Entries and seeds are ready.
              Generate the bracket to create
              the elimination matches.
            </p>
          </div>

          {!generated ? (
            <button
              type="button"
              onClick={
                handleGenerateBracket
              }
              disabled={generating}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--arena-yellow)] px-6 py-3 text-sm font-black text-slate-950 transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
            >
              {generating
                ? "Generating..."
                : "Generate Bracket"}
            </button>
          ) : null}
        </div>

        {generated ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            The Stage is marked as
            generated, but no bracket
            was found.
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <BracketViewer view={view} />
  )
}