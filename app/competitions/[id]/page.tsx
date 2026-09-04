import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { RegisteredShell } from "@/components/layout/RegisteredShell"
import type { CompetitionEntry } from "@/modules/competition-entries/types"
import { getCompetitionAction } from "@/modules/competitions/actions/getCompetition"
import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { CompetitionSectionRenderer } from "@/modules/competitions/components/CompetitionSectionRenderer"
import { CompetitionEventHeader } from "@/modules/competitions/components/CompetitionEventHeader"
import { listCompetitionStages } from "@/modules/competition-stages/repositories/competition-stage.repository"

type CompetitionDetailPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    section?: string
  }>
}

const sections = [
  { key: "stages", label: "Stages" },
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

  const isClosed =
    competition.is_closed === true

  const validSection =
    sections.find((section) => section.key === query?.section)?.key ??
    "stages"

  const entries: CompetitionEntry[] = []

  const stages =
    validSection === "stages"
      ? await listCompetitionStages(
          competition.id,
        )
      : []

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
      <div className="mx-auto w-full max-w-7xl">
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
          isClosed={competition.is_closed}
          readOnly={false}
        />

        <nav className="mt-6 grid grid-cols-3 gap-2 md:hidden">
          {sections.map((section) => (
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

        {isClosed ? (
          <section className="mt-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Event status
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-600">
                This event is closed and appears in Past Events. Its stages and results remain available.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-lg bg-slate-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
              Closed
            </span>
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
