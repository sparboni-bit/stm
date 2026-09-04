"use client"

import { useStage } from "../hooks"
import type {
  CompetitionStageStatus,
  CompetitionStageType,
} from "../types"

const stageTypeLabels: Record<CompetitionStageType, string> = {
  round_robin: "Round Robin",
  elimination: "Elimination",
  consolation: "Consolation",
  swiss: "Swiss",
  ladder: "Ladder",
  individual_rotation: "Individual Rotation",
}

const stageStatusLabels: Record<CompetitionStageStatus, string> = {
  draft: "Draft",
  configured: "Ready",
  generated: "Ready",
  running: "In progress",
  completed: "Completed",
}

const stageStatusClasses: Record<CompetitionStageStatus, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  configured: "border-amber-200 bg-amber-50 text-amber-700",
  generated: "border-violet-200 bg-violet-50 text-violet-700",
  running: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-slate-200 bg-white text-slate-600",
}

export function StageHeader() {
  const stage = useStage()

  return (
    <header className="border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Stage {stage.sortOrder}
          </p>

          <h1 className="mt-1 break-words text-2xl font-bold text-slate-950 sm:text-3xl">
            {stage.name}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {stageTypeLabels[stage.stageType]}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 border px-2.5 py-1.5 text-xs font-semibold ${stageStatusClasses[stage.status]}`}
        >
          {stageStatusLabels[stage.status]}
        </span>
      </div>
    </header>
  )
}
