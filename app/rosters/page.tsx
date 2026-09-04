import Link from "next/link"
import { redirect } from "next/navigation"

import { RegisteredShell } from "@/components/layout/RegisteredShell"
import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { listRosters } from "@/modules/rosters/repositories/roster.repository"
import { RosterDeleteButton } from "@/modules/rosters/components/RosterDeleteButton"

export default async function RostersPage() {
  const currentWorkspace = await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect("/login?error=no_active_workspace")
  }

  const rosters = await listRosters(currentWorkspace.workspace.id)

  return (
    <RegisteredShell
      currentWorkspace={currentWorkspace}
      activeSection="roster"
    >
      <div className="mx-auto max-w-4xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Your account
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Rosters
            </h1>
            <p className="mt-1 max-w-md text-sm leading-5 text-slate-500">
              Independent player lists you can reuse across any stage or event.
            </p>
          </div>

          <Link
            href="/rosters/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center border border-slate-950 bg-[var(--arena-yellow)] px-4 py-2 text-sm font-black text-slate-950 transition hover:brightness-95"
          >
            + New Roster
          </Link>
        </header>

        {rosters.length === 0 ? (
          <section className="mt-7 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <h2 className="text-lg font-bold text-slate-950">No rosters yet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create a reusable player list, then select players from it when configuring a Stage.
            </p>
            <Link
              href="/rosters/new"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white"
            >
              Create Roster
            </Link>
          </section>
        ) : (
          <section className="mt-7 grid gap-3 sm:grid-cols-2">
            {rosters.map((roster) => (
              <article
                key={roster.id}
                className="border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex min-h-[76px] flex-col">
                  <h2 className="text-base font-black text-slate-950">
                    {roster.name}
                  </h2>
                  {roster.description ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                      {roster.description}
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <Link
                    href={`/rosters/${roster.id}`}
                    className="flex min-h-11 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-bold text-white transition hover:bg-neutral-800"
                  >
                    Open
                  </Link>

                  <RosterDeleteButton
                    rosterId={roster.id}
                    rosterName={roster.name}
                  />
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </RegisteredShell>
  )
}
