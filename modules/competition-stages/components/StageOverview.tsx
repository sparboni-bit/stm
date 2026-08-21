"use client"

import {
  useManifest,
  useStage,
} from "../hooks"
import type { CompetitionStageStatus } from "../types"
import { StageCompletionPanel } from "./StageCompletionPanel"

const stageStatusLabels: Record<CompetitionStageStatus, string> = {
  draft: "Draft",
  configured: "Ready",
  generated: "Ready",
  running: "In progress",
  completed: "Completed",
}


type StageOverviewProps = {
  entryCount?: number
}

export function StageOverview({
  entryCount = 0,
}: StageOverviewProps) {
  const stage = useStage()
  const manifest = useManifest()

  const items = [
    { label: "Phase", value: stage.name },
    { label: "Format", value: manifest.name },
    { label: "Status", value: stageStatusLabels[stage.status] },
    {
      label: "Roster",
      value: entryCount > 0 ? `${entryCount} assigned` : "Not configured",
    },
  ]

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Phase overview
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Overview
        </h2>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          {manifest.description}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="border border-slate-200 bg-slate-50 p-3 sm:p-4"
          >
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </dt>

            <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <StageCompletionPanel />
    </section>
  )
}
