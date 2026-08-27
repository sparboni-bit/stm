import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { RegisteredShell } from "@/components/layout/RegisteredShell"
import { getCompetitionAction } from "@/modules/competitions/actions/getCompetition"
import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { getCompetitionStatistics } from "@/modules/competitions/repositories/competition-statistics.repository"
import { CompetitionSectionRenderer } from "@/modules/competitions/components/CompetitionSectionRenderer"
import { CompetitionEventHeader } from "@/modules/competitions/components/CompetitionEventHeader"
import { listCompetitionEntries } from "@/modules/competition-entries/repositories/competition-entry.repository"
import { listCompetitionStages } from "@/modules/competition-stages/repositories/competition-stage.repository"

type CompetitionDetailPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    section?: string
  }>
}

const operationalSections = [
  { key: "configuration", label: "Home" },
  { key: "stages", label: "Stages" },
] as const

const resultsSections = [
  { key: "reports", label: "Results" },
] as const

export default async function CompetitionDetailPage({
  params,
  searchParams,
}: CompetitionDetailPageProps) {
  const currentWorkspace = await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect("/login?error=no_active_workspace")
  }

  const { id } = await params
  const query = await searchParams
  const competition = await getCompetitionAction(id)

  if (!competition) {
    notFound()
  }

  const isResultsOnly = ["completed", "archived"].includes(
    competition.status,
  )

  const sections = isResultsOnly
    ? resultsSections
    : operationalSections

  const validSection =
    sections.find((section) => section.key === query?.section)?.key ??
    (isResultsOnly ? "reports" : "stages")

  const isHome = validSection === "configuration"

  const [
    statistics,
    entries,
    stages,
  ] = await Promise.all([
    isHome
      ? getCompetitionStatistics(
          competition.id,
        )
      : Promise.resolve(null),

    isHome
      ? listCompetitionEntries(
          competition.id,
        )
      : Promise.resolve([]),

    validSection === "stages" ||
    isHome
      ? listCompetitionStages(
          competition.id,
        )
      : Promise.resolve([]),
  ])

  const locked = [
    "completed",
    "archived",
  ].includes(competition.status)

  return (
    <RegisteredShell
      currentWorkspace={currentWorkspace}
      activeSection="events"
      context={{
        title: competition.title,
        items: sections.map((section) => ({
          label: section.label,
          href: `/competitions/${competition.id}?section=${section.key}`,
          active: validSection === section.key,
        })),
      }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="md:hidden">
          <Link
            href="/competitions"
            className="inline-flex min-h-10 items-center rounded-full border border-slate-950 bg-white px-4 text-sm font-bold text-slate-950"
          >
            ← Events
          </Link>
        </div>

        <CompetitionEventHeader
          competitionId={competition.id}
          title={competition.title}
          description={competition.description}
          startAt={competition.start_at}
          endAt={competition.end_at}
          organizerName={currentWorkspace.workspace.name}
          readOnly={isResultsOnly}
        />

        {!isResultsOnly ? (
          <nav className="mt-6 grid grid-cols-3 gap-2 md:hidden">
            {operationalSections.map((section) => (
              <Link
                key={section.key}
                href={`/competitions/${competition.id}?section=${section.key}`}
                className={[
                  "flex min-h-11 items-center justify-center rounded-xl border px-2 text-xs font-bold",
                  validSection === section.key
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-slate-300 bg-white text-slate-950",
                ].join(" ")}
              >
                {section.label}
              </Link>
            ))}
          </nav>
        ) : null}

        {isHome && statistics ? (
          <div className="mt-6 grid grid-cols-4 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {[
              { label: "Players", value: entries.length },
              { label: "Matches", value: statistics.matches },
              { label: "Courts", value: statistics.courts },
              { label: "Stages", value: stages.length },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-0 px-2 py-4 text-center"
              >
                <p className="truncate text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {isResultsOnly ? (
          <section className="mt-6 rounded-2xl bg-slate-50 px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Event results
            </p>

            <p className="mt-1 text-sm leading-5 text-slate-600">
              This event is closed. Operational setup is hidden; final results remain available for consultation.
            </p>
          </section>
        ) : null}

        <section className="mt-6">
          <CompetitionSectionRenderer
            section={validSection}
            competitionId={competition.id}
            locked={locked}
            entries={entries}
            stages={stages}
          />
        </section>
      </div>
    </RegisteredShell>
  )
}
