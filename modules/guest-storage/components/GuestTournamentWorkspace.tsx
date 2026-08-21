"use client"

import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import {
  useCallback,
  useEffect,
  useState,
} from "react"

import {
  getGuestCompetitionWorkspace,
} from "@/modules/guest-storage/services"
import type {
  GuestTournamentDocument,
} from "@/modules/guest-storage/types"

import { GuestHome } from "./GuestHome"
import { GuestRosterManager } from "./GuestRosterManager"
import { GuestStagesManager } from "./GuestStagesManager"
import { GuestStageEntriesManager } from "./GuestStageEntriesManager"
import { GuestStageGenerationPanel } from "./GuestStageGenerationPanel"
import { GuestMatchesManager } from "./GuestMatchesManager"
import { GuestEliminationBracket } from "./GuestEliminationBracket"
import { GuestRoundRobinStandings } from "./GuestRoundRobinStandings"
import { GuestIndividualRotationStandings } from "./GuestIndividualRotationStandings"

type StageSection = "stage" | "players" | "matches" | "standings"
type WorkspaceSection = "home" | "stages"

function readWorkspaceSectionFromLocation(): WorkspaceSection {
  if (typeof window === "undefined") return "home"
  return new URLSearchParams(window.location.search).get("section") === "stages"
    ? "stages"
    : "home"
}

function readStageIdFromLocation() {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get("stage")
}

function readStageSectionFromLocation(): StageSection {
  if (typeof window === "undefined") return "stage"
  const value = new URLSearchParams(window.location.search).get("view")
  return value === "players" ||
    value === "matches" ||
    value === "standings"
    ? value
    : "stage"
}

export function GuestTournamentWorkspace({
  competitionId,
}: {
  competitionId: string
}) {
  const [document, setDocument] =
    useState<GuestTournamentDocument | null>(null)
  const [stageId, setStageId] = useState<string | null>(null)
  const [stageSection, setStageSection] =
    useState<StageSection>("stage")
  const [showRoster, setShowRoster] = useState(false)
  const [workspaceSection, setWorkspaceSection] =
    useState<WorkspaceSection>("home")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const value = await getGuestCompetitionWorkspace(competitionId)
      setDocument(value ? { ...value } : null)
      if (!value) {
        setError("This guest tournament was not found on this device.")
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load the tournament.",
      )
    } finally {
      setLoading(false)
    }
  }, [competitionId])

  const syncLocation = useCallback(() => {
    setStageId(readStageIdFromLocation())
    setStageSection(readStageSectionFromLocation())
    setShowRoster(
      new URLSearchParams(window.location.search).get("roster") === "1",
    )
    setWorkspaceSection(readWorkspaceSectionFromLocation())
  }, [])

  useEffect(() => {
    syncLocation()
    void load()
    window.addEventListener("popstate", syncLocation)
    return () => window.removeEventListener("popstate", syncLocation)
  }, [load, syncLocation])

  function pushLocation(mutator: (url: URL) => void) {
    const url = new URL(window.location.href)
    mutator(url)
    window.history.pushState({}, "", `${url.pathname}${url.search}`)
    syncLocation()
  }

  function openHome() {
    pushLocation((url) => {
      url.searchParams.delete("stage")
      url.searchParams.delete("view")
      url.searchParams.delete("roster")
      url.searchParams.delete("section")
    })
  }

  function openStages() {
    pushLocation((url) => {
      url.searchParams.delete("stage")
      url.searchParams.delete("view")
      url.searchParams.delete("roster")
      url.searchParams.set("section", "stages")
    })
  }

  function openStage(nextStageId: string) {
    pushLocation((url) => {
      url.searchParams.set("stage", nextStageId)
      url.searchParams.delete("view")
      url.searchParams.delete("roster")
      url.searchParams.set("section", "stages")
    })
  }

  function closeStage() {
    openStages()
  }

  function openStageSection(next: StageSection) {
    pushLocation((url) => {
      url.searchParams.set("stage", stageId ?? "")
      if (next === "stage") url.searchParams.delete("view")
      else url.searchParams.set("view", next)
      url.searchParams.delete("roster")
    })
  }

  function openRoster() {
    pushLocation((url) => {
      url.searchParams.set("roster", "1")
      url.searchParams.delete("stage")
      url.searchParams.delete("view")
      url.searchParams.set("section", "stages")
    })
  }

  function closeRoster() {
    openStages()
  }

  if (loading) {
    return (
      <div className="border border-neutral-200 bg-white p-5 text-sm text-neutral-500">
        Loading tournament...
      </div>
    )
  }

  if (!document || error) {
    return (
      <div className="border border-red-200 bg-red-50 p-5">
        <h1 className="font-bold text-red-800">Guest tournament unavailable</h1>
        <p className="mt-2 text-sm text-red-700">
          {error ?? "This tournament is not available on this device."}
        </p>
        <Link
          href="/guest"
          className="mt-4 inline-flex min-h-10 items-center border border-red-300 bg-white px-4 text-sm font-semibold text-red-800"
        >
          ← Guest tournaments
        </Link>
      </div>
    )
  }

  const selectedStage =
    document.stages.find((stage) => stage.id === stageId) ?? null

  const selectedStageEntries = selectedStage
    ? document.stageEntries.filter(
        (item) => item.stage_id === selectedStage.id,
      )
    : []

  const selectedMatches = selectedStage
    ? document.matches.filter(
        (match) => match.stage_id === selectedStage.id,
      )
    : []

  function desktopShell(content: ReactNode, active: "home" | "stages" | "roster") {
    return (
      <div className="min-h-[calc(100vh-1px)] bg-neutral-200 lg:p-6">
        <div className="mx-auto min-h-screen max-w-6xl overflow-hidden bg-white lg:min-h-[calc(100vh-3rem)] lg:rounded-[28px] lg:shadow-xl">
          <div className="lg:grid lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[230px_minmax(0,1fr)]">
            <aside className="hidden border-r border-neutral-200 bg-white px-5 py-7 lg:block">
              <Image src="/brand/pickleball-arena-logo2.png" alt="Pickleball Arena" width={180} height={64} className="h-auto w-[176px]" />
              <nav className="mt-8 space-y-2">
                <button type="button" onClick={openHome} className={["flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold", active === "home" ? "bg-neutral-950 text-white" : "text-neutral-600"].join(" ")}>
                  <span className="grid h-7 w-7 place-items-center rounded-lg border border-neutral-950 bg-[var(--arena-yellow)] text-neutral-950">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 11.5 12 4l9 7.5" />
                      <path d="M5.5 10.5V20h13v-9.5" />
                      <path d="M9.5 20v-5h5v5" />
                    </svg>
                  </span> Home
                </button>
                <button type="button" onClick={openStages} className={["flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold", active === "stages" ? "bg-neutral-950 text-white" : "text-neutral-600"].join(" ")}>
                  <span className="grid h-7 w-7 place-items-center rounded-lg border border-neutral-950 bg-[var(--arena-yellow)] text-neutral-950">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
                      <path d="M6 5H4v1a4 4 0 0 0 4 4M18 5h2v1a4 4 0 0 1-4 4" />
                      <path d="M12 11v5M9 20h6M10 16h4" />
                    </svg>
                  </span> Stages
                </button>
                <button type="button" onClick={openRoster} className={["flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold", active === "roster" ? "bg-neutral-950 text-white" : "text-neutral-600"].join(" ")}>
                  <span className="grid h-7 w-7 place-items-center rounded-lg border border-neutral-950 bg-[var(--arena-yellow)] text-neutral-950">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="12" height="16" rx="1.5" />
                      <path d="M9 8h6M9 12h6M9 16h4M10 2h4v3h-4z" />
                    </svg>
                  </span> Roster
                </button>
              </nav>
              {selectedStage ? (
                <div className="mt-7 border-t border-neutral-200 pt-5">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">{selectedStage.stageType.replaceAll("_", " ")} — {selectedStage.name}</p>
                  {[
                    ["stage", "Stage Setup"],
                    ["players", selectedStage.stageType === "round_robin" ? "Select Roster" : "Select Players"],
                    ["matches", selectedStage.stageType === "elimination" ? "Bracket" : "Matches"],
                    ...((selectedStage.stageType === "round_robin" || selectedStage.stageType === "individual_rotation") ? [["standings", "Standings"]] : []),
                  ].map(([key,label]) => (
                    <button key={key} type="button" onClick={() => openStageSection(key as StageSection)} className={["mb-1 flex min-h-9 w-full items-center rounded-lg px-3 text-left text-sm font-semibold", stageSection === key ? "bg-yellow-100 text-neutral-950" : "text-neutral-500"].join(" ")}>•&nbsp; {label}</button>
                  ))}
                </div>
              ) : null}
            </aside>
            <main className="min-w-0 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">{content}</main>
          </div>
        </div>
      </div>
    )
  }

  if (
    !showRoster &&
    !selectedStage &&
    workspaceSection === "home"
  ) {
    return desktopShell(
      <GuestHome
        playerCount={
          document.entries.filter(
            (entry) => entry.entry_type === "player",
          ).length
        }
        stageCount={document.stages.length}
        onCreateStage={openStages}
        onBuildRoster={openRoster}
      />,
      "home",
    )
  }

  if (showRoster) {
    return desktopShell(
      <div>
        <div className="mb-5 flex flex-wrap gap-2 lg:hidden">
          <button
            type="button"
            onClick={openHome}
            className="inline-flex min-h-10 items-center rounded-full border border-neutral-950 bg-white px-4 text-sm font-bold text-neutral-950"
          >
            ← Home
          </button>
          <button
            type="button"
            onClick={openStages}
            className="inline-flex min-h-10 items-center rounded-full border border-neutral-950 bg-white px-4 text-sm font-bold text-neutral-950"
          >
            Stages
          </button>
        </div>

        <GuestRosterManager
          competitionId={competitionId}
          entries={document.entries}
          onChanged={load}
        />
      </div>,
      "roster",
    )
  }

  if (selectedStage) {
    const canShowStandings =
      selectedStage.stageType === "round_robin" ||
      selectedStage.stageType === "individual_rotation"

    return desktopShell(
      <div>
        <div className="sticky top-0 z-30 -mx-5 mb-5 border-b border-neutral-200 bg-white/95 px-5 py-3 backdrop-blur lg:hidden">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={closeStage}
              className="inline-flex min-h-10 items-center rounded-full border border-neutral-950 bg-white px-4 text-sm font-bold text-neutral-950"
            >
              ← Stages
            </button>

            {stageSection === "stage" ? (
              <>
                <button
                  type="button"
                  onClick={() => window.document.getElementById("guest-stage-players")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="inline-flex min-h-10 items-center rounded-full border border-neutral-950 bg-white px-4 text-sm font-bold text-neutral-950"
                >
                  Players
                </button>
                <button
                  type="button"
                  onClick={() => window.document.getElementById("guest-stage-configure")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="inline-flex min-h-10 items-center rounded-full border border-neutral-950 bg-white px-4 text-sm font-bold text-neutral-950"
                >
                  Configure
                </button>
                {selectedMatches.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => openStageSection("matches")}
                    className="inline-flex min-h-10 items-center rounded-full bg-neutral-950 px-4 text-sm font-bold text-white"
                  >
                    {selectedStage.stageType === "elimination" ? "Bracket" : "Matches"}
                  </button>
                ) : null}
              </>
            ) : null}

            {stageSection === "matches" ? (
              <>
                <button type="button" onClick={() => openStageSection("stage")} className="inline-flex min-h-10 items-center rounded-full border border-neutral-950 bg-white px-4 text-sm font-bold text-neutral-950">Setup</button>
                {canShowStandings ? <button type="button" onClick={() => openStageSection("standings")} className="inline-flex min-h-10 items-center rounded-full bg-neutral-950 px-4 text-sm font-bold text-white">Standings</button> : null}
              </>
            ) : null}

            {stageSection === "standings" ? (
              <>
                <button type="button" onClick={() => openStageSection("matches")} className="inline-flex min-h-10 items-center rounded-full bg-neutral-950 px-4 text-sm font-bold text-white">
                  Matches
                </button>
                <button type="button" onClick={() => openStageSection("stage")} className="inline-flex min-h-10 items-center rounded-full border border-neutral-950 bg-white px-4 text-sm font-bold text-neutral-950">Setup</button>
              </>
            ) : null}
          </div>
        </div>

        <section>
          {stageSection === "stage" ? (
            <div className="space-y-4">
              {(selectedStage.stageType === "round_robin" || selectedStage.stageType === "elimination") ? (
                <>
                  <div id="guest-stage-configure" className="scroll-mt-24">
                    <GuestStageGenerationPanel
                      competitionId={competitionId}
                      stage={selectedStage}
                      roster={document.entries}
                      stageEntries={selectedStageEntries}
                      matchCount={selectedMatches.length}
                      onChanged={load}
                      onOpenMatches={() => openStageSection("matches")}
                    />
                  </div>
                  <div id="guest-stage-players" className="scroll-mt-24">
                    <GuestStageEntriesManager
                      competitionId={competitionId}
                      stage={selectedStage}
                      roster={document.entries}
                      stageEntries={selectedStageEntries}
                      onChanged={load}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div id="guest-stage-players" className="scroll-mt-24">
                    <GuestStageEntriesManager
                      competitionId={competitionId}
                      stage={selectedStage}
                      roster={document.entries}
                      stageEntries={selectedStageEntries}
                      onChanged={load}
                    />
                  </div>
                  <div id="guest-stage-configure" className="scroll-mt-24">
                    <GuestStageGenerationPanel
                      competitionId={competitionId}
                      stage={selectedStage}
                      roster={document.entries}
                      stageEntries={selectedStageEntries}
                      matchCount={selectedMatches.length}
                      onChanged={load}
                      onOpenMatches={() => openStageSection("matches")}
                    />
                  </div>
                </>
              )}
            </div>
          ) : null}

          {stageSection === "players" ? (
            <GuestRosterManager
              competitionId={competitionId}
              entries={document.entries}
              onChanged={load}
            />
          ) : null}

          {stageSection === "matches" ? (
            selectedStage.stageType === "elimination" ? (
              <GuestEliminationBracket
                competitionId={competitionId}
                stage={selectedStage}
                matches={selectedMatches}
                entries={document.entries}
                onChanged={load}
              />
            ) : (
              <GuestMatchesManager
                competitionId={competitionId}
                matches={selectedMatches}
                entries={document.entries}
                stages={[selectedStage]}
                courts={document.courts}
                onChanged={load}
              />
            )
          ) : null}

          {stageSection === "standings" &&
          selectedStage.stageType === "round_robin" ? (
            <GuestRoundRobinStandings
              matches={selectedMatches}
              entries={document.entries}
            />
          ) : null}

          {stageSection === "standings" &&
          selectedStage.stageType === "individual_rotation" ? (
            <GuestIndividualRotationStandings
              stage={selectedStage}
              matches={selectedMatches}
              entries={document.entries}
            />
          ) : null}

        </section>


      </div>,
      "stages",
    )
  }

  return desktopShell(
    <div>
      <div className="mb-5 flex flex-wrap gap-2 lg:hidden">
        <button
          type="button"
          onClick={openHome}
          className="inline-flex min-h-10 items-center rounded-full border border-neutral-950 bg-white px-4 text-sm font-bold text-neutral-950"
        >
          ← Home
        </button>
        <button
          type="button"
          onClick={openRoster}
          className="inline-flex min-h-10 items-center rounded-full border border-neutral-950 bg-white px-4 text-sm font-bold text-neutral-950"
        >
          Roster
        </button>
      </div>
      <GuestStagesManager
          competitionId={competitionId}
          stages={document.stages}
          roster={document.entries}
          stageEntries={document.stageEntries}
          matches={document.matches}
          onChanged={load}
          onOpenStage={openStage}
          onOpenRoster={openRoster}
        />
    </div>
    ,
    "stages",
  )
}
