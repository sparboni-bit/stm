"use client"

import Image from "next/image"

export function GuestHome({
  playerCount,
  stageCount,
  onCreateStage,
  onBuildRoster,
}: {
  playerCount: number
  stageCount: number
  onCreateStage: () => void
  onBuildRoster: () => void
}) {
  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div className="text-center lg:hidden">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex flex-col items-center"
          aria-label="Guest home"
        >
          <Image
            src="/brand/pickleball-arena-logo2.png"
            alt="Pickleball Arena"
            width={180}
            height={64}
            priority
            className="h-auto w-[128px]"
          />
          <span className="mt-1 text-[11px] text-slate-500">
            Tap logo to return home
          </span>
        </button>
      </div>

      <div className="mt-5 rounded-[18px] bg-neutral-100 px-5 py-5 lg:mt-0">
        <div className="flex items-start gap-3">
          <Image
            src="/brand/pickleball-arena-logo.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <p className="text-[13px] leading-5 text-neutral-950">
            <strong>Ready to run your tournament.</strong>{" "}
            Build your player list once, create one or more stages and manage
            matches and standings directly from this device.
          </p>
        </div>
      </div>

      <div className="mt-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Welcome
        </p>
        <h1 className="mt-1 max-w-[620px] text-[30px] font-black leading-[1.05] tracking-[-0.035em] text-neutral-950 sm:text-[34px]">
          What do you want to set up{" "}
          <span className="bg-[var(--arena-yellow)] px-1">
            today?
          </span>
        </h1>
        <p className="mt-3 max-w-[620px] text-[15px] leading-6 text-slate-500">
          Pick one to get started. Build your player list or create the next
          stage of your tournament.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCreateStage}
          className="flex min-h-[112px] items-center gap-4 rounded-[18px] border border-neutral-950 bg-white px-5 py-4 text-left sm:min-h-[176px] sm:flex-col sm:items-start sm:justify-between"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] border border-neutral-950 bg-[var(--arena-yellow)] text-neutral-950">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
              <path d="M6 5H4v1a4 4 0 0 0 4 4" />
              <path d="M18 5h2v1a4 4 0 0 1-4 4" />
              <path d="M12 11v5" />
              <path d="M9 20h6" />
              <path d="M10 16h4" />
            </svg>
          </span>
          <span>
            <strong className="block text-[17px] leading-5 text-neutral-950">
              Create a tournament&apos;s stage
            </strong>
            <span className="mt-1 block text-[13px] text-slate-500">
              {stageCount > 0
                ? `${stageCount} stage${stageCount === 1 ? "" : "s"} already created`
                : "Set format, courts and rounds"}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onBuildRoster}
          className="flex min-h-[112px] items-center gap-4 rounded-[18px] border border-neutral-950 bg-white px-5 py-4 text-left sm:min-h-[176px] sm:flex-col sm:items-start sm:justify-between"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] border border-neutral-950 bg-[var(--arena-yellow)] text-neutral-950">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="12" height="16" rx="1.5" />
              <path d="M9 8h6M9 12h6M9 16h4" />
              <path d="M10 2h4v3h-4z" />
            </svg>
          </span>
          <span>
            <strong className="block text-[17px] leading-5 text-neutral-950">
              Build a player list
            </strong>
            <span className="mt-1 block text-[13px] text-slate-500">
              {playerCount > 0
                ? `${playerCount} player${playerCount === 1 ? "" : "s"} in the tournament roster`
                : "Add players to the tournament roster."}
            </span>
          </span>
        </button>
      </div>

    </div>
  )
}
