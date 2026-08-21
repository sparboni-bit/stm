"use client"

import { useState } from "react"

import type { MatchDetailView } from "../view"
import { BestOf3ScoreForm } from "./BestOf3ScoreForm"
import { RetirementScoreForm } from "./RetirementScoreForm"
import { SingleSetScoreForm } from "./SingleSetScoreForm"

type ScoreMode =
  | "single_set"
  | "best_of_3"
  | "retirement"

type Props = {
  match: MatchDetailView
}

function storedMode(
  match: MatchDetailView,
): ScoreMode {
  if (
    match.finishType === "retirement"
  ) {
    return "retirement"
  }

  return match.score.format ===
    "best_of_3"
    ? "best_of_3"
    : "single_set"
}

export function MatchScoreEditor({
  match,
}: Props) {
  const individualRotation =
    match.matchType === "individual_rotation"

  const [mode, setMode] =
    useState<ScoreMode>(
      individualRotation &&
      storedMode(match) === "best_of_3"
        ? "single_set"
        : storedMode(match),
    )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 border border-slate-200 bg-white p-3 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={() =>
            setMode("single_set")
          }
          className={[
            "min-h-11 w-full px-3 text-sm font-bold sm:w-auto sm:px-4",
            mode === "single_set"
              ? "bg-slate-950 text-white"
              : "border border-slate-300 bg-white text-slate-700",
          ].join(" ")}
        >
          Single set
        </button>

        {!individualRotation ? (
        <button
          type="button"
          onClick={() =>
            setMode("best_of_3")
          }
          className={[
            "min-h-11 w-full px-3 text-sm font-bold sm:w-auto sm:px-4",
            mode === "best_of_3"
              ? "bg-slate-950 text-white"
              : "border border-slate-300 bg-white text-slate-700",
          ].join(" ")}
        >
          Best of 3
        </button>
        ) : null}

        <button
          type="button"
          onClick={() =>
            setMode("retirement")
          }
          className={[
            "min-h-11 w-full px-3 text-sm font-bold sm:w-auto sm:px-4",
            mode === "retirement"
              ? "bg-slate-950 text-white"
              : "border border-slate-300 bg-white text-slate-700",
          ].join(" ")}
        >
          Retirement
        </button>
      </div>

      {mode === "retirement" ? (
        <RetirementScoreForm
          match={match}
        />
      ) : !individualRotation && mode === "best_of_3" ? (
        <BestOf3ScoreForm
          match={match}
        />
      ) : (
        <SingleSetScoreForm
          match={match}
        />
      )}
    </div>
  )
}
