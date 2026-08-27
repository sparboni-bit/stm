import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"
import { logoutAction } from "@/modules/auth/actions"

type CurrentWorkspace = NonNullable<
  Awaited<ReturnType<typeof getCurrentWorkspace>>
>

type RegisteredShellProps = {
  children: ReactNode
  currentWorkspace: CurrentWorkspace
  activeSection: "home" | "events" | "roster"
  context?: {
    title: string
    items: Array<{
      label: string
      href: string
      active?: boolean
    }>
  }
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10.5V20h13v-9.5" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H4v1a4 4 0 0 0 4 4" />
      <path d="M16 6h4v1a4 4 0 0 1-4 4" />
      <path d="M12 12v4" />
      <path d="M8 20h8" />
      <path d="M10 16h4v4h-4z" />
    </svg>
  )
}

function RosterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5" />
      <path d="M16 7h5M16 11h5M17 15h4" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 5H5v14h5" />
      <path d="M14 8l4 4-4 4" />
      <path d="M8 12h10" />
    </svg>
  )
}

const primaryItems = [
  { key: "home", label: "Home", href: "/", Icon: HomeIcon },
  { key: "events", label: "Events", href: "/competitions", Icon: TrophyIcon },
  { key: "roster", label: "Roster", href: "/rosters", Icon: RosterIcon },
] as const

export function RegisteredShell({
  children,
  currentWorkspace,
  activeSection,
  context,
}: RegisteredShellProps) {
  return (
    <main className="min-h-screen bg-[#f3f4f6] md:px-6 md:py-8">
      <div className="mx-auto min-h-screen w-full max-w-[1180px] bg-white md:min-h-[calc(100vh-4rem)] md:overflow-hidden md:rounded-[34px] md:border md:border-slate-200 md:shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
        <div className="md:grid md:min-h-[calc(100vh-4rem)] md:grid-cols-[258px_minmax(0,1fr)]">
          <aside className="hidden border-r border-slate-200 bg-white md:block">
            <div className="sticky top-0 flex min-h-[calc(100vh-4rem)] flex-col px-5 py-7">
              <div className="px-3">
                <Image
                  src="/brand/pickleball-arena-logo2.png"
                  alt="Pickleball Arena"
                  width={180}
                  height={64}
                  className="h-auto w-[158px] object-contain"
                  priority
                />
              </div>

              <div className="mt-4 px-3 text-[11px] font-semibold text-slate-500">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Signed in · {currentWorkspace.workspace.name}
              </div>

              <nav className="mt-7 space-y-2" aria-label="Main navigation">
                {primaryItems.map(({ key, label, href, Icon }) => {
                  const active = activeSection === key
                  return (
                    <Link
                      key={key}
                      href={href}
                      className={[
                        "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold transition",
                        active
                          ? "bg-neutral-950 text-white"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                          active
                            ? "border-[var(--arena-yellow)] bg-[var(--arena-yellow)] text-neutral-950"
                            : "border-slate-300 bg-white text-neutral-950",
                        ].join(" ")}
                      >
                        <Icon />
                      </span>
                      {label}
                    </Link>
                  )
                })}
              </nav>

              {context ? (
                <div className="mt-7 border-t border-slate-200 pt-5">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    {context.title}
                  </p>
                  <nav className="mt-2 space-y-1" aria-label={context.title}>
                    {context.items.map((item) => (
                      <Link
                        key={`${item.href}-${item.label}`}
                        href={item.href}
                        className={[
                          "flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold transition",
                          item.active
                            ? "bg-yellow-100 text-slate-950"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-950",
                        ].join(" ")}
                      >
                        <span className="mr-2 text-[9px]">●</span>
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              ) : null}

              <div className="mt-auto border-t border-slate-200 pt-5">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-neutral-950">
                      <LogoutIcon />
                    </span>
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </aside>

          <section className="min-w-0 bg-white px-5 py-8 sm:px-8 md:px-10 md:py-9 lg:px-12">
            <div className="mb-5 flex items-center justify-between md:hidden">
              <Image
                src="/brand/pickleball-arena-logo2.png"
                alt="Pickleball Arena"
                width={145}
                height={52}
                className="h-auto w-[132px]"
                priority
              />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700"
                >
                  Logout
                </button>
              </form>
            </div>
            {children}
          </section>
        </div>
      </div>
    </main>
  )
}
