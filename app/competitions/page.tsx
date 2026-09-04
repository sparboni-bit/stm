import Link from "next/link"
import { redirect } from "next/navigation"

import { RegisteredShell } from "@/components/layout/RegisteredShell"
import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { listCompetitionStagesAction } from "@/modules/competition-stages/actions/listCompetitionStages"
import { listCompetitionsAction } from "@/modules/competitions/actions/listCompetitions"
import { DeleteCompetitionButton } from "@/modules/competitions/components/DeleteCompetitionButton"

type CompetitionsPageProps = {
  searchParams?: Promise<{
    view?: string
    page?: string
  }>
}

const EVENTS_PER_PAGE = 5

function formatDate(value: string | null) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

function formatDateRange(
  startAt: string | null,
  endAt: string | null,
) {
  const start = formatDate(startAt)
  const end = formatDate(endAt)

  if (start && end && start !== end) {
    return `${start} – ${end}`
  }

  return start ?? end
}

function buildPageHref(
  view: "open" | "past",
  page: number,
) {
  return `/competitions?view=${view}&page=${page}`
}

export default async function CompetitionsPage({
  searchParams,
}: CompetitionsPageProps) {
  const currentWorkspace =
    await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect(
      "/login?error=no_active_workspace",
    )
  }

  const query = await searchParams

  const view: "open" | "past" =
    query?.view === "past"
      ? "past"
      : "open"

  const requestedPage = Number.parseInt(
    query?.page ?? "1",
    10,
  )

  const competitions =
    await listCompetitionsAction()

  const allItems =
    view === "past"
      ? competitions.archived
      : competitions.active

  const totalPages = Math.max(
    1,
    Math.ceil(
      allItems.length / EVENTS_PER_PAGE,
    ),
  )

  const currentPage =
    Number.isFinite(requestedPage) &&
    requestedPage > 0
      ? Math.min(
          requestedPage,
          totalPages,
        )
      : 1

  const startIndex =
    (currentPage - 1) *
    EVENTS_PER_PAGE

  const items = allItems.slice(
    startIndex,
    startIndex + EVENTS_PER_PAGE,
  )

  const stageCounts =
    new Map<string, number>()

  await Promise.all(
    items.map(async (competition) => {
      try {
        const stages =
          await listCompetitionStagesAction(
            competition.id,
          )

        stageCounts.set(
          competition.id,
          stages.length,
        )
      } catch {
        stageCounts.set(
          competition.id,
          0,
        )
      }
    }),
  )

  return (
    <RegisteredShell
      currentWorkspace={currentWorkspace}
      activeSection="events"
    >
      <div className="mx-auto max-w-4xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Your account
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Events
            </h1>

            <p className="mt-1 max-w-md text-sm leading-5 text-slate-500">
              All the tournament events
              you&apos;re organizing.
            </p>
          </div>

          <Link
            href="/competitions/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-950 bg-[var(--arena-yellow)] px-4 py-2 text-sm font-black text-slate-950 transition hover:brightness-95"
          >
            + New Event
          </Link>
        </header>

        <nav className="mt-6 grid max-w-sm grid-cols-2 rounded-xl bg-slate-100 p-1">
          <Link
            href="/competitions?view=open&page=1"
            className={[
              "flex min-h-10 items-center justify-center rounded-lg text-sm font-bold transition",
              view === "open"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500",
            ].join(" ")}
          >
            Open
          </Link>

          <Link
            href="/competitions?view=past&page=1"
            className={[
              "flex min-h-10 items-center justify-center rounded-lg text-sm font-bold transition",
              view === "past"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500",
            ].join(" ")}
          >
            Past
          </Link>
        </nav>

        {allItems.length === 0 ? (
          <section className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <h2 className="text-lg font-bold text-slate-950">
              {view === "open"
                ? "No open events"
                : "No past events"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {view === "open"
                ? "Create your first event to start adding stages."
                : "Past events will appear here."}
            </p>
          </section>
        ) : (
          <>
            <section className="mt-5 grid gap-4 lg:grid-cols-2">
              {items.map(
                (competition) => {
                  const stageCount =
                    stageCounts.get(
                      competition.id,
                    ) ?? 0

                  const dates =
                    formatDateRange(
                      competition.start_at,
                      competition.end_at,
                    )

                  return (
                    <article
                      key={competition.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="min-w-0 text-lg font-black leading-6 text-slate-950">
                          {
                            competition.title
                          }
                        </h2>

                        <span
                          className={[
                            "shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold",
                            view === "open"
                              ? "bg-[var(--arena-yellow)] text-slate-950"
                              : "bg-slate-100 text-slate-500",
                          ].join(" ")}
                        >
                          {stageCount}{" "}
                          {stageCount === 1
                            ? "stage"
                            : "stages"}

                          {view === "past"
                            ? " · closed"
                            : ""}
                        </span>
                      </div>

                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        Organizer ·{" "}
                        {
                          currentWorkspace
                            .workspace.name
                        }
                      </p>

                      {competition.description ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">
                          {
                            competition.description
                          }
                        </p>
                      ) : (
                        <p className="mt-2 text-sm leading-5 text-slate-400">
                          No description.
                        </p>
                      )}

                      {dates ? (
                        <div className="mt-3">
                          <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                            🗓️ {dates}
                          </span>
                        </div>
                      ) : null}

                      {view === "open" ? (
                        <div className="mt-5 flex items-stretch gap-2">
                          <Link
                            href={`/competitions/${competition.id}`}
                            className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-4 text-sm font-bold text-white transition hover:bg-neutral-800"
                          >
                            Open
                          </Link>

                          <DeleteCompetitionButton
                            competitionId={
                              competition.id
                            }
                            eventTitle={
                              competition.title
                            }
                          />
                        </div>
                      ) : (
                        <Link
                          href={`/competitions/${competition.id}`}
                          className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-950 bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-50"
                        >
                          View
                        </Link>
                      )}
                    </article>
                  )
                },
              )}
            </section>

            {totalPages > 1 ? (
              <nav
                aria-label="Events pagination"
                className="mt-6 flex items-center justify-center gap-2"
              >
                {currentPage > 1 ? (
                  <Link
                    href={buildPageHref(
                      view,
                      currentPage - 1,
                    )}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Previous
                  </Link>
                ) : null}

                <span className="px-3 text-sm font-semibold text-slate-500">
                  {currentPage} /{" "}
                  {totalPages}
                </span>

                {currentPage <
                totalPages ? (
                  <Link
                    href={buildPageHref(
                      view,
                      currentPage + 1,
                    )}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Next
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </>
        )}
      </div>
    </RegisteredShell>
  )
}