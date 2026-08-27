import Link from "next/link"
import { redirect } from "next/navigation"

import { RegisteredShell } from "@/components/layout/RegisteredShell"
import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { createRosterAction } from "@/modules/rosters/actions/createRoster"

type NewRosterPageProps = {
  searchParams?: Promise<{
    error?: string
  }>
}

export default async function NewRosterPage({
  searchParams,
}: NewRosterPageProps) {
  const currentWorkspace = await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect("/login?error=no_active_workspace")
  }

  const query = await searchParams

  return (
    <RegisteredShell
      currentWorkspace={currentWorkspace}
      activeSection="roster"
    >
      <div className="mx-auto max-w-3xl">
        <Link
          href="/rosters"
          className="inline-flex min-h-10 items-center rounded-full border border-slate-950 bg-white px-4 text-sm font-bold text-slate-950"
        >
          ← Rosters
        </Link>

        <header className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            New roster
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Create Roster
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Give it a name — you&apos;ll add players next.
          </p>
        </header>

        <form action={createRosterAction} className="mt-7">
          {query?.error === "missing_fields" ? (
            <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Enter a roster name.
            </p>
          ) : null}

          <label className="block">
            <span className="text-xs font-black uppercase text-slate-950">Name</span>
            <input
              name="name"
              required
              autoFocus
              maxLength={120}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-slate-950"
              placeholder="e.g. Saluzzo Winter League"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-xs font-black uppercase text-slate-950">
              Description <span className="font-medium text-slate-500">(optional)</span>
            </span>
            <textarea
              name="description"
              rows={4}
              maxLength={500}
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-950"
              placeholder="What's this roster for?"
            />
          </label>

          <button
            type="submit"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-yellow-300 px-6 text-sm font-black text-slate-950 transition hover:bg-yellow-200 sm:w-60"
          >
            Create Roster
          </button>
        </form>
      </div>
    </RegisteredShell>
  )
}
