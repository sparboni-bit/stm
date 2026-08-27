import Link from "next/link"
import { redirect } from "next/navigation"

import { RegisteredShell } from "@/components/layout/RegisteredShell"
import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { CompetitionForm } from "@/modules/competitions/components/CompetitionForm"

export default async function NewCompetitionPage() {
  const currentWorkspace = await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect("/login?error=no_active_workspace")
  }

  return (
    <RegisteredShell
      currentWorkspace={currentWorkspace}
      activeSection="events"
    >
      <div className="mx-auto max-w-3xl">
        <div className="md:hidden">
          <Link
            href="/competitions"
            className="inline-flex min-h-10 items-center rounded-full border border-slate-950 bg-white px-4 text-sm font-bold text-slate-950"
          >
            ← Events
          </Link>
        </div>

        <header className="mt-5 md:mt-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            New event
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Create Event
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            A few basic details — you&apos;ll add stages once it&apos;s created.
          </p>
        </header>

        <div className="mt-7">
          <CompetitionForm />
        </div>
      </div>
    </RegisteredShell>
  )
}
