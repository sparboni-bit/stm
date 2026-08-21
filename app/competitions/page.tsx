import Link from "next/link"
import { redirect } from "next/navigation"

import {
  AppShell,
} from "@/components/layout/AppShell"

import {
  PageHeader,
} from "@/components/layout/PageHeader"

import {
  getCurrentWorkspace,
} from "@/lib/workspace/getCurrentWorkspace"

import {
  getWorkspaceMemberships,
} from "@/lib/workspace/getWorkspaceMemberships"

import {
  listCompetitionsAction,
} from "@/modules/competitions/actions/listCompetitions"

function formatStructureType(
  value: string
) {
  const labels: Record<string, string> = {
    single_elimination:
      "Single Elimination",
    round_robin:
      "Round Robin",
    round_robin_bracket:
      "Round Robin + Bracket",
    round_robin_bracket_consolation:
      "Round Robin + Bracket + Consolation",
  }

  return labels[value] || value
}

function formatPlayMode(
  value: string
) {
  const labels: Record<string, string> = {
    singles: "Singles",
    doubles: "Doubles",
    individual_doubles:
      "Individual Doubles",
  }

  return labels[value] || value
}

export default async function CompetitionsPage() {
  const currentWorkspace =
    await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect(
      "/login?error=no_active_workspace"
    )
  }

  const memberships =
    await getWorkspaceMemberships()

  const competitions =
    await listCompetitionsAction()

  return (
    <AppShell
      currentWorkspace={currentWorkspace}
      memberships={memberships}
    >
      <Link
        href="/"
        className="mb-4 inline-flex text-sm font-semibold text-slate-500 transition hover:text-slate-900"
      >
        ← Home
      </Link>

      <PageHeader
        eyebrow="Tournament Management"
        title="Tournaments"
        description={`Manage tournaments in ${currentWorkspace.workspace.name}.`}
        actions={
          <Link
            href="/competitions/new"
            className="inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + New Tournament
          </Link>
        }
      />

      <section className="space-y-3">
        {competitions.active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              🏆
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No tournaments yet
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create the first tournament in this
              workspace.
            </p>

            <Link
              href="/competitions/new"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create Tournament
            </Link>
          </div>
        ) : (
          competitions.active.map(
            (competition) => (
              <Link
                key={competition.id}
                href={`/competitions/${competition.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tournament
                    </p>

                    <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">
                      {competition.title}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      {competition.play_mode &&
                      competition.structure_type ? (
                        <>
                          {formatPlayMode(
                            competition.play_mode
                          )}
                          {" · "}
                          {formatStructureType(
                            competition.structure_type
                          )}
                        </>
                      ) : null}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                    {competition.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-500">
                    Open tournament
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    Open →
                  </span>
                </div>
              </Link>
            )
          )
        )}
      </section>

      {competitions.archived.length > 0 && (
        <details className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Archived Tournaments (
            {competitions.archived.length})
          </summary>

          <div className="mt-4 space-y-2">
            {competitions.archived.map(
              (competition) => (
                <Link
                  key={competition.id}
                  href={`/competitions/${competition.id}`}
                  className="block rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700"
                >
                  {competition.title}
                </Link>
              )
            )}
          </div>
        </details>
      )}
    </AppShell>
  )
}