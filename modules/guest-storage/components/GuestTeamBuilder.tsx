"use client"

import {
  useMemo,
  useState,
} from "react"

import type {
  CompetitionEntry,
} from "@/modules/competition-entries/types"

import {
  createGuestTeam,
  removeGuestTeam,
} from "@/modules/guest-storage/services"

function readPlayerEntryIds(
  entry: CompetitionEntry,
): string[] {
  const value = entry.metadata?.playerEntryIds
  if (!Array.isArray(value)) return []

  return value.filter(
    (item): item is string => typeof item === "string",
  )
}

export function GuestTeamBuilder({
  competitionId,
  entries,
  onChanged,
}: {
  competitionId: string
  entries: CompetitionEntry[]
  onChanged: () => Promise<void>
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const players = useMemo(
    () =>
      entries
        .filter(
          (entry) =>
            entry.entry_type === "player" &&
            entry.status === "active" &&
            entry.metadata?.hiddenFromRoster !== true,
        )
        .sort((a, b) => a.sort_order - b.sort_order),
    [entries],
  )

  const teams = useMemo(
    () =>
      entries
        .filter(
          (entry) =>
            entry.entry_type === "team" &&
            entry.status === "active" &&
            entry.metadata?.hiddenFromRoster !== true,
        )
        .sort((a, b) => a.sort_order - b.sort_order),
    [entries],
  )

  const playerTeamNumber = useMemo(() => {
    const result = new Map<string, number>()

    teams.forEach((team, index) => {
      readPlayerEntryIds(team).forEach((playerId) => {
        result.set(playerId, index + 1)
      })
    })

    return result
  }, [teams])

  const selectedPlayers = selectedIds
    .map((id) => players.find((player) => player.id === id))
    .filter(
      (player): player is CompetitionEntry => Boolean(player),
    )

  function togglePlayer(playerId: string) {
    if (working || playerTeamNumber.has(playerId)) return

    setSelectedIds((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId)
      }

      if (current.length >= 2) return current
      return [...current, playerId]
    })
  }

  async function createTeam() {
    if (selectedIds.length !== 2) return

    setWorking(true)
    setError(null)

    try {
      await createGuestTeam({
        competitionId,
        playerEntryIds: [
          selectedIds[0],
          selectedIds[1],
        ],
      })
      setSelectedIds([])
      await onChanged()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not create team.",
      )
    } finally {
      setWorking(false)
    }
  }

  async function removeTeam(team: CompetitionEntry) {
    if (
      !window.confirm(
        `Remove team "${team.display_name}"?`,
      )
    ) {
      return
    }

    setWorking(true)
    setError(null)

    try {
      await removeGuestTeam({
        competitionId,
        teamEntryId: team.id,
      })
      setSelectedIds([])
      await onChanged()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not remove team.",
      )
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
          Doubles
        </p>
        <h3 className="mt-1 text-lg font-bold text-neutral-950">
          Build Teams
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          Select two players to create a doubles team.
        </p>
      </div>

      {error ? (
        <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
          Players
        </p>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {players.map((player) => {
            const teamNumber = playerTeamNumber.get(player.id)
            const selected = selectedIds.includes(player.id)
            const unavailable = teamNumber !== undefined

            return (
              <button
                key={player.id}
                type="button"
                disabled={working || unavailable}
                onClick={() => togglePlayer(player.id)}
                className={[
                  "flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left",
                  unavailable
                    ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                    : selected
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-300 bg-white text-neutral-950",
                ].join(" ")}
              >
                <span className="min-w-0 break-words text-sm font-semibold">
                  {player.display_name}
                </span>

                {unavailable ? (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide">
                    Team {teamNumber}
                  </span>
                ) : selected ? (
                  <span className="shrink-0 text-lg leading-none">
                    ✓
                  </span>
                ) : (
                  <span className="shrink-0 text-lg leading-none text-neutral-400">
                    +
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          {selectedPlayers.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Select two available players.
            </p>
          ) : selectedPlayers.length === 1 ? (
            <p className="text-sm font-medium text-neutral-800">
              {selectedPlayers[0].display_name}
              <span className="font-normal text-neutral-500">
                {" "}— select one more player
              </span>
            </p>
          ) : (
            <div>
              <p className="text-sm font-bold text-neutral-950">
                {selectedPlayers[0].display_name}
                {" + "}
                {selectedPlayers[1].display_name}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                Ready to team up
              </p>
            </div>
          )}

          <button
            type="button"
            disabled={working || selectedIds.length !== 2}
            onClick={() => void createTeam()}
            className="mt-4 min-h-11 w-full rounded-xl bg-[var(--arena-yellow)] px-4 text-sm font-bold text-[var(--arena-black)] disabled:opacity-40"
          >
            Create Team
          </button>
        </div>
      </div>

      <div className="border-t border-neutral-200 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
            Teams
          </p>
          <span className="text-xs text-neutral-400">
            {teams.length}
          </span>
        </div>

        <div className="space-y-2">
          {teams.map((team, index) => (
            <div
              key={team.id}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2"
            >
              <span className="w-6 shrink-0 text-sm font-bold text-neutral-400">
                {index + 1}
              </span>

              <span className="min-w-0 flex-1 break-words text-sm font-semibold text-neutral-950">
                {team.display_name}
              </span>

              <button
                type="button"
                disabled={working}
                aria-label={`Remove ${team.display_name}`}
                title="Remove team"
                onClick={() => void removeTeam(team)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-300 text-lg leading-none text-neutral-600 disabled:opacity-40"
              >
                ×
              </button>
            </div>
          ))}

          {teams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">
              No teams yet.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
