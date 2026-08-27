import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { RegisteredShell } from "@/components/layout/RegisteredShell"
import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { getRoster } from "@/modules/rosters/repositories/roster.repository"
import { RosterEntriesManager } from "@/modules/rosters/components/RosterEntriesManager"

type RosterPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    section?: string
  }>
}

export default async function RosterPage({
  params,
  searchParams,
}: RosterPageProps) {
  const currentWorkspace = await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect("/login?error=no_active_workspace")
  }

  const { id } = await params
  const query = await searchParams
  const section = query?.section === "teams" ? "teams" : "players"

  let roster

  try {
    roster = await getRoster(id)
  } catch {
    notFound()
  }

  if (roster.organization_id !== currentWorkspace.workspace.id) {
    notFound()
  }

  return (
    <RegisteredShell
      currentWorkspace={currentWorkspace}
      activeSection="roster"
      context={{
        title: roster.name,
        items: [
          {
            label: "Players",
            href: `/rosters/${roster.id}?section=players`,
            active: section === "players",
          },
          {
            label: "Teams",
            href: `/rosters/${roster.id}?section=teams`,
            active: section === "teams",
          },
        ],
      }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="md:hidden">
          <Link
            href="/rosters"
            className="inline-flex min-h-10 items-center rounded-full border border-slate-950 bg-white px-4 text-sm font-bold text-slate-950"
          >
            ← Rosters
          </Link>
        </div>

        <header className="mt-5 md:mt-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Roster
          </p>
          <h1 className="mt-1 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {roster.name}
          </h1>
          {roster.description ? (
            <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
              {roster.description}
            </p>
          ) : null}
        </header>

        <nav className="mt-5 grid grid-cols-2 gap-2 md:hidden">
          <Link
            href={`/rosters/${roster.id}?section=players`}
            className={[
              "flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-bold",
              section === "players"
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-slate-300 bg-white text-slate-950",
            ].join(" ")}
          >
            Players
          </Link>
          <Link
            href={`/rosters/${roster.id}?section=teams`}
            className={[
              "flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-bold",
              section === "teams"
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-slate-300 bg-white text-slate-950",
            ].join(" ")}
          >
            Teams
          </Link>
        </nav>

        <div className="mt-6">
          <RosterEntriesManager roster={roster} section={section} />
        </div>
      </div>
    </RegisteredShell>
  )
}
