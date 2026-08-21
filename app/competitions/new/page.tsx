import Link from "next/link"
import { redirect } from "next/navigation"

import {
  AppShell,
} from "@/components/layout/AppShell"

import {
  getCurrentWorkspace,
} from "@/lib/workspace/getCurrentWorkspace"

import {
  getWorkspaceMemberships,
} from "@/lib/workspace/getWorkspaceMemberships"

import {
  CompetitionForm,
} from "@/modules/competitions/components/CompetitionForm"

export default async function NewCompetitionPage() {
  const currentWorkspace =
    await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect(
      "/login?error=no_active_workspace"
    )
  }

  const memberships =
    await getWorkspaceMemberships()

  return (
    <AppShell
      currentWorkspace={currentWorkspace}
      memberships={memberships}
    >
      <Link
        href="/competitions"
        className="mb-4 inline-flex text-sm font-semibold text-slate-500 transition hover:text-slate-900"
      >
        ← Tournaments
      </Link>

      <section className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Tournament
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-950">
            New Tournament
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and configure a new tournament.
          </p>
        </div>

        <CompetitionForm />
      </section>
    </AppShell>
  )
}