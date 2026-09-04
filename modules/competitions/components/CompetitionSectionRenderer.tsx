import Link from "next/link"

import {
  CompetitionEntriesManager,
} from "@/modules/competition-entries/components/CompetitionEntriesManager"

import {
  CompetitionStagesManager,
} from "@/modules/competition-stages/components/CompetitionStagesManager"

import type {
  CompetitionStage,
} from "@/modules/competition-stages/types"

import type {
  CompetitionEntry,
} from "@/modules/competition-entries/types"

type Props = {
  section: string
  competitionId: string
  locked: boolean
  entries: CompetitionEntry[]
  stages: CompetitionStage[]
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    )
}

function phaseTypeLabel(
  stage: CompetitionStage,
) {
  const labels: Record<string, string> = {
    elimination: "Elimination",
    round_robin: "Round Robin",
    consolation: "Consolation",
    individual_rotation: "Individual Rotation",
    swiss: "Swiss",
    ladder: "Ladder",
  }

  return (
    labels[stage.stageType] ??
    humanize(stage.stageType)
  )
}

function phaseStatusLabel(stage: CompetitionStage) {
  const value = String(stage.status)

  const labels: Record<string, string> = {
    draft: "Setup",
    configured: "Setup complete",
    generated: "Ready",
    running: "In progress",
    completed: "Completed",
  }

  return labels[value] ?? humanize(value)
}

function phaseName(
  stage: CompetitionStage,
  index: number
) {
  if (
    "name" in stage &&
    typeof stage.name === "string" &&
    stage.name.trim()
  ) {
    return stage.name
  }

  if (
    "title" in stage &&
    typeof stage.title === "string" &&
    stage.title.trim()
  ) {
    return stage.title
  }

  return `Stage ${index + 1}`
}

function isCompleted(stage: CompetitionStage) {
  return String(stage.status) === "completed"
}

export function CompetitionSectionRenderer({
  section,
  competitionId,
  locked,
  entries,
  stages,
}: Props) {
  switch (section) {
    case "entries":
      return (
        <CompetitionEntriesManager
          competitionId={competitionId}
          entries={entries}
          locked={locked}
        />
      )

    case "stages":
      return (
        <CompetitionStagesManager
          competitionId={competitionId}
          stages={stages}
          locked={locked}
        />
      )

    case "configuration":
      return (
        <TournamentHome
          competitionId={competitionId}
          stages={stages}
        />
      )

    case "reports":
      return <Placeholder title="Reports" />

    default:
      return null
  }
}

function TournamentHome({
  competitionId,
  stages,
}: {
  competitionId: string
  stages: CompetitionStage[]
}) {
  const nextPhase =
    stages.find((stage) => !isCompleted(stage)) ??
    stages[stages.length - 1]

  const visiblePhases =
    stages.slice(0, 3)

  if (stages.length === 0) {
    return (
      <section className="border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center">
        <h2 className="text-lg font-semibold text-slate-950">
          Choose the tournament format
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Create the first stage to define how this tournament will be played.
        </p>

        <Link
          href={`/competitions/${competitionId}?section=stages`}
          className="mt-4 inline-flex min-h-12 items-center justify-center bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Set up tournament
        </Link>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Tournament
          </p>

          <h2 className="mt-0.5 text-lg font-semibold text-slate-950">
            {stages.length === 1 ? "Format" : "Stages"}
          </h2>
        </div>

        <Link
          href={`/competitions/${competitionId}?section=stages`}
          className="inline-flex min-h-10 items-center text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          {stages.length === 1
            ? "Manage →"
            : "View all →"}
        </Link>
      </div>

      <div className="grid gap-2">
        {visiblePhases.map(
          (stage, index) => {
            const isNext =
              nextPhase?.id === stage.id

            return (
              <Link
                key={stage.id}
                href={`/competitions/${competitionId}/stages/${stage.id}`}
                className={[
                  "group flex min-h-20 items-center justify-between gap-3 border bg-white px-4 py-3 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
                  isNext
                    ? "border-slate-400"
                    : "border-slate-200 hover:border-slate-400",
                ].join(" ")}
              >
                <div className="min-w-0">
                  {stages.length > 1 ? (
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Stage {index + 1}
                    </p>
                  ) : null}

                  <p className="mt-0.5 truncate text-base font-semibold text-slate-950">
                    {phaseName(
                      stage,
                      index
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {phaseTypeLabel(
                      stage
                    )}{" "}
                    ·{" "}
                    {phaseStatusLabel(
                      stage
                    )}
                  </p>
                </div>

                <span
                  className={[
                    "shrink-0 font-semibold transition",
                    isNext
                      ? "inline-flex min-h-10 items-center bg-slate-900 px-3 text-xs text-white group-hover:bg-slate-700"
                      : "text-lg text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-700",
                  ].join(" ")}
                >
                  {isNext
                    ? "Continue →"
                    : "→"}
                </span>
              </Link>
            )
          }
        )}
      </div>

      {stages.length >
      visiblePhases.length ? (
        <Link
          href={`/competitions/${competitionId}?section=stages`}
          className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          +{" "}
          {stages.length -
            visiblePhases.length}{" "}
          more stage
          {stages.length -
            visiblePhases.length ===
          1
            ? ""
            : "s"}{" "}
          →
        </Link>
      ) : null}
    </section>
  )
}

function Placeholder({
  title,
}: {
  title: string
}) {
  return (
    <div className="border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        {title}
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        This section will be implemented in a later release.
      </p>
    </div>
  )
}
