import Link from "next/link"
import {
  notFound,
  redirect,
} from "next/navigation"

import {
  AppShell,
} from "@/components/layout/AppShell"

import {
  getCompetitionAction,
} from "@/modules/competitions/actions/getCompetition"

import {
  getCurrentWorkspace,
} from "@/lib/workspace/getCurrentWorkspace"

import {
  getWorkspaceMemberships,
} from "@/lib/workspace/getWorkspaceMemberships"

import {
  getCompetitionStatistics,
} from "@/modules/competitions/repositories/competition-statistics.repository"

import {
  CompetitionSectionRenderer,
} from "@/modules/competitions/components/CompetitionSectionRenderer"

import {
  listCompetitionEntries,
} from "@/modules/competition-entries/repositories/competition-entry.repository"

import {
  listCompetitionStages,
} from "@/modules/competition-stages/repositories/competition-stage.repository"

type CompetitionDetailPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    section?: string
  }>
}

const sections = [
  { key: "configuration", label: "Home" },
  { key: "entries", label: "Roster" },
  { key: "stages", label: "Phases" },
  { key: "reports", label: "Reports" },
] as const

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    draft: "Setup",
    configure: "Setup",
    ready: "Ready",
    generated: "Ready",
    running: "In progress",
    completed: "Completed",
    archived: "Archived",
  }

  return (
    labels[value] ??
    value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase()
      )
  )
}

function statusClasses(value: string) {
  switch (value) {
    case "running":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"

    case "completed":
    case "archived":
      return "border-slate-200 bg-slate-100 text-slate-600"

    case "ready":
    case "generated":
      return "border-violet-200 bg-violet-50 text-violet-700"

    default:
      return "border-blue-200 bg-blue-50 text-blue-700"
  }
}

export default async function CompetitionDetailPage({
  params,
  searchParams,
}: CompetitionDetailPageProps) {
  const currentWorkspace =
    await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect(
      "/login?error=no_active_workspace"
    )
  }

  const memberships =
    await getWorkspaceMemberships()

  const { id } = await params
  const query = await searchParams

  const validSection =
    sections.find(
      (section) =>
        section.key === query?.section
    )?.key ?? "configuration"

  const competition =
    await getCompetitionAction(id)

  if (!competition) {
    notFound()
  }

  const isHome =
    validSection === "configuration"

  const [
    statistics,
    entries,
    stages,
  ] = await Promise.all([
    isHome
      ? getCompetitionStatistics(
          competition.id
        )
      : Promise.resolve(null),

    validSection === "entries" ||
    isHome
      ? listCompetitionEntries(
          competition.id
        )
      : Promise.resolve([]),

    validSection === "stages" ||
    isHome
      ? listCompetitionStages(
          competition.id
        )
      : Promise.resolve([]),
  ])

  const locked = [
    "generated",
    "running",
    "completed",
    "archived",
  ].includes(competition.status)

  return (
    <AppShell
      currentWorkspace={
        currentWorkspace
      }
      memberships={memberships}
    >
      <Link
        href="/competitions"
        className="inline-flex min-h-10 items-center text-sm font-semibold text-slate-500 transition hover:text-slate-900"
      >
        ← Tournaments
      </Link>

      <header className="mt-3 border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Tournament
            </p>

            <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {competition.title}
            </h1>

            {competition.description ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-500">
                {competition.description}
              </p>
            ) : null}
          </div>

          <span
            className={[
              "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold",
              statusClasses(
                competition.status
              ),
            ].join(" ")}
          >
            {statusLabel(
              competition.status
            )}
          </span>
        </div>
      </header>

      {isHome && statistics ? (
        <div className="mt-3 grid grid-cols-4 divide-x divide-slate-200 border border-slate-200 bg-white shadow-sm">
          {[
            {
              label: "Roster",
              value: entries.length,
            },
            {
              label: "Matches",
              value: statistics.matches,
            },
            {
              label: "Courts",
              value: statistics.courts,
            },
            {
              label: "Phases",
              value: stages.length,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="min-w-0 px-1.5 py-2.5 text-center sm:px-4 sm:py-4"
            >
              <p className="truncate text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">
                {item.label}
              </p>

              <p className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <nav
        aria-label="Tournament navigation"
        className="sticky top-16 z-20 mt-3 border-y border-slate-200 bg-slate-50 py-2"
      >
        <div className="grid w-full grid-cols-4 gap-1">
          {sections.map(
            (section) => {
              const active =
                validSection ===
                section.key

              return (
                <Link
                  key={section.key}
                  href={`/competitions/${competition.id}?section=${section.key}`}
                  className={[
                    "flex min-h-11 min-w-0 items-center justify-center px-1 py-2 text-center text-[11px] font-semibold transition sm:px-4 sm:text-sm",
                    active
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {section.label}
                </Link>
              )
            }
          )}
        </div>
      </nav>

      <section className="mt-4">
        <CompetitionSectionRenderer
          section={validSection}
          competitionId={competition.id}
          locked={locked}
          entries={entries}
          stages={stages}
        />
      </section>
    </AppShell>
  )
}
